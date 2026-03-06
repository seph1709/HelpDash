# Phase 1: Security - Research

**Researched:** 2026-03-06
**Domain:** Next.js API route security, env var credential management, Supabase server-side auth
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SEC-01 (run-schema.mjs):**
- Keep the script — do not delete it
- Replace hardcoded connection parameters (host, port, user, password) with `DATABASE_URL_UNPOOLED` as a connection string — matches the existing env var already used in the project for direct pg connections
- Add `supabase/schema.sql` to the repo containing the full schema derived from Drizzle (`src/db/schema.ts`) — this gives the script something to run

**SEC-02 (migrate-now endpoint):**
- Delete the route entirely (`src/app/api/migrate-now/route.ts` — the file itself)
- Remove `/api/migrate-now` from `PUBLIC_PATHS` in `src/proxy.ts`
- No other files reference this endpoint — safe to delete with no further changes

**SEC-03 (Notification API):**
- Add booking-participant validation inside the `/api/notifications` route: verify the authenticated caller (`user.id`) is either the `client_id` or `provider_id` of the `bookingId` supplied in the request body before allowing the insert
- Credential rotation (the committed password in git history) is handled by the user outside the codebase — not in scope for this phase

### Claude's Discretion

- How to implement the booking-participant lookup query in the notifications route (client to use, query shape)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Hardcoded database credentials in `scripts/run-schema.mjs` are moved to environment variables | Confirmed: `pg` Client accepts `connectionString`; `DATABASE_URL_UNPOOLED` already used in migrate-now route with same ssl config |
| SEC-02 | The unauthenticated `/api/migrate-now` endpoint is removed or protected behind an admin auth check | Confirmed: file deletion + single-line removal from `PUBLIC_PATHS` array in `src/proxy.ts` is sufficient |
| SEC-03 | Notification API restricts sending to verified booking participants only | Confirmed: `createSupabaseAdminClient` already imported in route; a single SELECT on `bookings` by `bookingId` + compare to `user.id` implements this |
</phase_requirements>

---

## Summary

Phase 1 is a surgical, no-new-features security hardening pass. All three vulnerabilities are in existing files that are fully read. The changes are small, self-contained, and do not require installing any new libraries. The patterns for all three fixes are already established in the codebase; this phase applies those patterns to files that were missed.

The largest practical complication is SEC-01: `supabase/schema.sql` already exists but is **out of sync** with the current database state. It is missing the `chat_messages` table and the `booking_id` column on the `notifications` table, both of which were applied via `migrations_002.sql`. Before `run-schema.mjs` can be used reliably, `supabase/schema.sql` must be brought up to date. This is within the phase scope per the CONTEXT.md requirement to produce a schema derived from `src/db/schema.ts`.

Additionally, `drizzle.config.ts` contains the same hardcoded password as `run-schema.mjs`. This file is in the repository and represents the same credential-exposure risk. The phase scope as written only explicitly names `scripts/run-schema.mjs`, but `drizzle.config.ts` should be flagged to the user for awareness.

**Primary recommendation:** Execute all three fixes as independent, sequential file edits with no dependency on each other. SEC-02 is one deletion + one line removal (lowest risk). SEC-01 is a string replacement + schema file update. SEC-03 is an insertion of a validation block in the notifications route.

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pg` (npm) | ^8.18.0 (devDep) | Used by `scripts/run-schema.mjs` — standalone Node script, not Next.js | Already installed; `Client` accepts `connectionString` directly |
| `@supabase/supabase-js` | ^2.97.0 | Supabase admin client for DB queries in API routes | Already used in notifications route |
| `@supabase/ssr` | ^0.8.0 | Cookie-based server client for auth in API routes | Already used for `user` extraction in notifications route |
| `next` | 16.1.6 | Framework; `NextResponse` shape for API responses | Already in use |

### No New Dependencies Required

All fixes use libraries already present. No `npm install` step needed for this phase.

---

## Architecture Patterns

### Established Route Pattern (already used in every protected route)

```typescript
// Auth guard — established pattern
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### pg Client with connectionString (already used in migrate-now route)

```typescript
// Source: src/app/api/migrate-now/route.ts (existing)
const client = new Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
})
```

This is the exact pattern `run-schema.mjs` must adopt, replacing the hardcoded object.

### Booking-Participant Validation Pattern (SEC-03)

The admin client is already imported in the notifications route. The validation query follows the same subquery pattern used in the RLS policies throughout `supabase/schema.sql`:

```typescript
// Pattern: query bookings to check participant membership
const admin = createSupabaseAdminClient()
const { data: booking } = await admin
  .from('bookings')
  .select('client_id, provider_id')
  .eq('id', bookingId)
  .single()

if (!booking || (booking.client_id !== user.id && booking.provider_id !== user.id)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

This check must be inserted AFTER the existing auth guard and BEFORE the notification insert.

### PUBLIC_PATHS Removal Pattern (SEC-02)

`src/proxy.ts` line 4:
```typescript
// Before
const PUBLIC_PATHS = ['/login', '/register', '/api/auth/register', '/api/auth/login', '/api/migrate-now']

// After
const PUBLIC_PATHS = ['/login', '/register', '/api/auth/register', '/api/auth/login']
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authenticated DB queries in scripts | Custom auth layer | `DATABASE_URL_UNPOOLED` env var + pg `connectionString` | Already the project standard for direct connections |
| Cross-user DB inserts in API routes | Custom auth bypass | `createSupabaseAdminClient()` (service role) | Already imported in notifications route |
| Session validation in routes | Custom cookie parsing | `createSupabaseServerClient().auth.getUser()` | Handles token refresh, cookie sync automatically |

---

## Common Pitfalls

### Pitfall 1: SEC-03 — Missing bookingId means null bypass

**What goes wrong:** If `bookingId` is not sent in the request body (it is optional in the current route), the validation query cannot execute. A caller who omits `bookingId` would skip the participant check and still insert a notification for any `userId`.

**Why it happens:** The existing route treats `bookingId` as optional (`...(bookingId ? { booking_id: bookingId } : {})`). SEC-03 requires it for notifications that name a booking participant as recipient.

**How to avoid:** The guard must differentiate: if `bookingId` is present, validate participant membership before proceeding. If absent, a policy decision is needed — either reject all notifications without a `bookingId` or allow them as "system-level" notifications. The CONTEXT.md description implies validation applies when `bookingId` is supplied. Clarify: the participant check applies when `bookingId` IS present; the no-booking-id path remains valid (unenforced by this fix) since the notifyUser callers always pass bookingId when notifying a booking participant.

**Warning signs:** Test the route with a valid `userId` but without `bookingId` — if it still inserts, the guard is incomplete.

### Pitfall 2: SEC-01 — supabase/schema.sql is out of date

**What goes wrong:** Running `scripts/run-schema.mjs` with the current `supabase/schema.sql` would produce a database missing the `chat_messages` table and the `booking_id` column on `notifications`.

**Why it happens:** `migrations_002.sql` applied additive changes that were never folded back into the base `schema.sql`. The Drizzle `src/db/schema.ts` IS current (it includes `chatMessages` and `booking_id` on `notifications`).

**How to avoid:** The schema.sql must be updated to add the missing `chat_messages` table, the `booking_id` column on `notifications`, and the related RLS policies. The source of truth is `src/db/schema.ts` — compare it against `schema.sql` and add the delta. Do NOT re-run `migrations_002.sql` against schema.sql (it uses `ALTER TABLE ... IF NOT EXISTS` guards — that pattern is for incremental migration, not initial schema).

**Warning signs:** After the fix, verify `schema.sql` defines `chat_messages` table with its two indexes and two RLS policies, and `notifications` with a `booking_id` column.

### Pitfall 3: SEC-01 — drizzle.config.ts also contains hardcoded credentials

**What goes wrong:** The password `u.62S*w!T*tVMJ8` appears in `drizzle.config.ts` as well as `scripts/run-schema.mjs`. Fixing only `run-schema.mjs` leaves the credential exposed in a tracked file.

**Why it happens:** `drizzle.config.ts` was not named in the CONTEXT.md scope. The phase as defined only commits to fixing `run-schema.mjs`.

**How to avoid:** Flag this to the user. As a minimum-risk addition to the phase, `drizzle.config.ts` should read from `DATABASE_URL_UNPOOLED` using the `url` credential format that drizzle-kit supports. This is out of scope as written but is low-effort and high-value. Decision belongs to the user.

### Pitfall 4: SEC-02 — Route deletion must remove BOTH the file AND the PUBLIC_PATHS entry

**What goes wrong:** Deleting only the file leaves `/api/migrate-now` in `PUBLIC_PATHS`, which is harmless but creates a misleading config entry. Removing only from PUBLIC_PATHS without deleting the file still exposes the route (Next.js will serve it; middleware just won't redirect unauthenticated users away — the route has no internal auth check).

**Why it happens:** Two separate changes required across two files.

**How to avoid:** The plan must include both: delete `src/app/api/migrate-now/route.ts` AND edit the `PUBLIC_PATHS` array in `src/proxy.ts`.

---

## Code Examples

### SEC-01: run-schema.mjs after fix

```javascript
// Replace the Client({host, port, user, password}) block with:
const client = new Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
})
```

No other changes to the script logic are needed. The `readFileSync` for `schema.sql` remains identical.

### SEC-03: Participant validation block insertion point

Current route order:
1. Auth guard (user exists check → 401)
2. Body parse
3. Missing fields check → 400
4. Admin client insert

After fix, order must be:
1. Auth guard (user exists check → 401)
2. Body parse
3. Missing fields check → 400
4. **NEW: Booking-participant check (if bookingId present → 403 if not participant)**
5. Admin client insert

### supabase/schema.sql delta needed

The following must be added to `supabase/schema.sql` to bring it in sync with `src/db/schema.ts` and `migrations_002.sql`:

1. Add `booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL` column to the `notifications` table definition
2. Add the full `chat_messages` table block (matches migrations_002.sql content)
3. Add the two `chat_messages` RLS policies
4. Add `CREATE INDEX IF NOT EXISTS idx_chat_messages_booking_id` and `idx_chat_messages_created_at`
5. Add the "Users delete own notifications" policy (also in migrations_002.sql)

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Hardcoded DB creds in script | `DATABASE_URL_UNPOOLED` connection string via env | Script safe to commit; rotate without code change |
| Open migration endpoint (PUBLIC_PATHS) | Route deleted; no public path entry | No attack surface |
| Auth-only notification guard | Auth + booking-participant membership check | Prevents cross-user notification injection |

---

## Open Questions

1. **drizzle.config.ts credentials**
   - What we know: `drizzle.config.ts` contains the same hardcoded password as `run-schema.mjs`
   - What's unclear: Whether this is in scope for Phase 1 or deferred
   - Recommendation: Surface to user; the fix is a one-line change (`url: process.env.DATABASE_URL_UNPOOLED`). If the user confirms, add it as a task in the plan. If not, leave it for a future security pass.

2. **SEC-03: bookingId-less notifications**
   - What we know: The route currently accepts notifications without a `bookingId`. Some callers may send system-level notifications without a booking reference.
   - What's unclear: Should ALL notification inserts require a `bookingId`, or only those where one is provided?
   - Recommendation: Scope the participant check only to when `bookingId` is present — consistent with existing behavior and the CONTEXT.md description ("verify the... bookingId supplied in the request body"). A null/absent `bookingId` bypasses the booking-participant check.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — no test runner found in project |
| Config file | None — Wave 0 must create |
| Quick run command | `npx jest --testPathPattern=security --passWithNoTests` (after Wave 0 setup) |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | `run-schema.mjs` reads `DATABASE_URL_UNPOOLED` env var, not hardcoded values | manual-only | inspect file for literal IP/password strings: `grep -n "u\.62S" scripts/run-schema.mjs` should return empty | ❌ Wave 0 |
| SEC-02 | `/api/migrate-now` route file does not exist | manual-only | `test ! -f src/app/api/migrate-now/route.ts && echo PASS` | ❌ Wave 0 |
| SEC-02 | `PUBLIC_PATHS` in `src/proxy.ts` does not contain `/api/migrate-now` | manual-only | `grep "migrate-now" src/proxy.ts` should return empty | ❌ Wave 0 |
| SEC-03 | Unauthenticated POST to `/api/notifications` returns 401 | manual-only | requires live Supabase — cannot unit-test without mocking | ❌ Wave 0 |
| SEC-03 | Authenticated POST with `bookingId` where caller is not a participant returns 403 | manual-only | requires live Supabase with seeded booking data | ❌ Wave 0 |
| SEC-03 | Authenticated POST with `bookingId` where caller IS a participant succeeds | manual-only | requires live Supabase with seeded booking data | ❌ Wave 0 |

**Note:** These three security fixes are file-level changes verifiable by inspection or curl against a dev server. A full test framework (Jest/Vitest + Next.js test utilities + Supabase mock) would be disproportionate for this phase. The verification strategy is: code inspection for SEC-01 and SEC-02, and manual curl/Postman testing against a dev environment for SEC-03.

### Sampling Rate

- **Per task commit:** Grep-based file inspection (no runner needed)
- **Per wave merge:** All three grep checks pass + manual smoke test of notifications route
- **Phase gate:** All three success criteria confirmed before `/gsd:verify-work`

### Wave 0 Gaps

- No test framework installed — for this phase, verification is inspection-based, not runner-based
- If a test runner is desired: `npm install --save-dev jest @types/jest ts-jest` and `jest.config.ts`
- The planner should NOT create a Wave 0 for test infrastructure setup — the security fixes do not require it, and the verification is grep + manual

*(Rationale: These are source-file deletions and targeted logic additions. The investment in mocking Supabase server clients exceeds the value for three small, reviewable diffs.)*

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection of `scripts/run-schema.mjs` — confirmed hardcoded credentials
- Direct code inspection of `src/app/api/migrate-now/route.ts` — confirmed PUBLIC_PATHS membership and connection pattern using `DATABASE_URL_UNPOOLED`
- Direct code inspection of `src/app/api/notifications/route.ts` — confirmed auth guard present, participant check absent
- Direct code inspection of `src/proxy.ts` — confirmed `/api/migrate-now` in PUBLIC_PATHS array at line 4
- Direct code inspection of `src/lib/supabase-server.ts` — confirmed `createSupabaseAdminClient` and `createSupabaseServerClient` interfaces
- Direct code inspection of `supabase/schema.sql` vs `src/db/schema.ts` — confirmed schema drift (missing `chat_messages`, missing `booking_id` on notifications)
- Direct code inspection of `drizzle.config.ts` — confirmed same password hardcoded (additional finding)

### Secondary (MEDIUM confidence)

- `pg` npm package documentation: `Client` constructor accepts `connectionString` as an alternative to individual host/port/user/password fields — consistent with usage already in `migrate-now/route.ts`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed and in active use; no new tooling research needed
- Architecture: HIGH — all patterns are copied directly from existing code in the same project
- Pitfalls: HIGH — identified by direct diff of schema.sql vs schema.ts and careful reading of the notifications route logic

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable — no external API changes affect these fixes)
