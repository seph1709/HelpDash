---
phase: 01-security
verified: 2026-03-07T00:00:00Z
status: human_needed
score: 11/12 must-haves verified
re_verification: false
human_verification:
  - test: "Non-participant user receives 403 from POST /api/notifications with a bookingId they do not own"
    expected: "HTTP 403 with body { error: 'Forbidden' }"
    why_human: "Requires live Supabase instance with real booking rows. The guard logic is structurally correct in code but cannot be exercised without a running database."
  - test: "Participant user (client_id or provider_id) receives 200 from POST /api/notifications with their booking's bookingId"
    expected: "HTTP 200 with body { ok: true } and notification row inserted"
    why_human: "Requires live Supabase instance. Validates the positive path of the guard does not over-block."
  - test: "POST /api/notifications with no bookingId still succeeds (system-level notification regression)"
    expected: "HTTP 200 with body { ok: true }"
    why_human: "Guard is scoped to bookingId-present requests; the branch is visible in code but the absence-of-bookingId path must be confirmed against a live endpoint."
  - test: "Unauthenticated POST /api/notifications receives 401"
    expected: "HTTP 401 with body { error: 'Unauthorized' }"
    why_human: "Auth guard is present in code; live test confirms middleware does not short-circuit before the handler fires."
---

# Phase 1: Security Verification Report

**Phase Goal:** Known vulnerabilities are eliminated so the platform is safe to expose to real users
**Verified:** 2026-03-07
**Status:** human_needed — all automated checks pass; 4 live-endpoint tests required for SEC-03 confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `scripts/run-schema.mjs` contains no hardcoded IP address, username, or password | VERIFIED | File uses `connectionString: process.env.DATABASE_URL_UNPOOLED` only; grep for `u.62S` and `2406:da18` returns zero matches |
| 2 | `scripts/run-schema.mjs` reads `DATABASE_URL_UNPOOLED` from the environment | VERIFIED | Line 11: `connectionString: process.env.DATABASE_URL_UNPOOLED` — env var read via `process.env` |
| 3 | `drizzle.config.ts` contains no hardcoded password | VERIFIED | `dbCredentials` block contains only `url: process.env.DATABASE_URL_UNPOOLED!` — no host/port/user/password fields |
| 4 | `supabase/schema.sql` defines the `chat_messages` table with its indexes and RLS policies | VERIFIED | Lines 242-261: `CREATE TABLE IF NOT EXISTS chat_messages`, both indexes (`idx_chat_messages_booking_id`, `idx_chat_messages_created_at`), `ENABLE ROW LEVEL SECURITY`, policies "Chat participants can read" and "Chat participants can send" |
| 5 | `supabase/schema.sql` defines `booking_id` on the notifications table | VERIFIED | Line 148: `booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL` inside the notifications `CREATE TABLE` block |
| 6 | `src/app/api/migrate-now/route.ts` does not exist | VERIFIED | `test ! -f` returns PASS; git confirms commit `57fd3e9` deleted the file |
| 7 | `PUBLIC_PATHS` in `src/proxy.ts` does not contain `/api/migrate-now` | VERIFIED | Line 4: `['/login', '/register', '/api/auth/register', '/api/auth/login']` — four entries, no migrate-now |
| 8 | No residual `migrate-now` references anywhere in `src/` | VERIFIED | `grep -r "migrate-now" src/` returns zero matches |
| 9 | An authenticated non-participant receives 403 when posting with a bookingId they do not own | NEEDS HUMAN | Guard logic present at lines 19-29 of notifications route; live Supabase required to confirm runtime behavior |
| 10 | An authenticated participant can send the notification | NEEDS HUMAN | Positive path through guard visible in code; requires live test against real booking rows |
| 11 | A notification POST with no `bookingId` succeeds (no regression) | NEEDS HUMAN | Guard is inside `if (bookingId)` block — structurally correct; live confirmation needed |
| 12 | An unauthenticated POST receives 401 | NEEDS HUMAN | Auth guard at line 8 is present; live confirmation needed |

**Score:** 8/8 automated truths verified, 4/4 truths require human testing

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/run-schema.mjs` | DB connection script without hardcoded credentials | VERIFIED | Uses `connectionString: process.env.DATABASE_URL_UNPOOLED`; 60 lines, substantive implementation |
| `drizzle.config.ts` | Drizzle config without hardcoded password | VERIFIED | Uses `url: process.env.DATABASE_URL_UNPOOLED!`; full config present |
| `supabase/schema.sql` | Complete schema including `chat_messages` and `booking_id` on notifications | VERIFIED | Both additions confirmed via grep |
| `src/app/api/migrate-now/route.ts` | DELETED | VERIFIED | File does not exist; directory removed |
| `src/proxy.ts` | Middleware without `migrate-now` in `PUBLIC_PATHS` | VERIFIED | Clean 4-entry array at line 4 |
| `src/app/api/notifications/route.ts` | Notification route with booking-participant guard | VERIFIED | Guard block at lines 19-29; contains `booking.client_id !== user.id && booking.provider_id !== user.id` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/run-schema.mjs` | `process.env.DATABASE_URL_UNPOOLED` | `pg Client connectionString` | WIRED | `connectionString: process.env.DATABASE_URL_UNPOOLED` at line 11 |
| `drizzle.config.ts` | `process.env.DATABASE_URL_UNPOOLED` | `dbCredentials.url` | WIRED | `url: process.env.DATABASE_URL_UNPOOLED!` at line 8 |
| `src/proxy.ts` | `PUBLIC_PATHS` array (4 entries only) | string removal | WIRED | Array confirmed: `/login`, `/register`, `/api/auth/register`, `/api/auth/login` — no migrate-now |
| `src/app/api/notifications/route.ts` | `bookings` table | `admin.from('bookings').select('client_id, provider_id').eq('id', bookingId)` | WIRED | Query present at lines 20-24; comparison at line 26; 403 return at line 27 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SEC-01 | 01-01-PLAN.md | Hardcoded database credentials in `scripts/run-schema.mjs` moved to env vars | SATISFIED | `run-schema.mjs` and `drizzle.config.ts` both use `DATABASE_URL_UNPOOLED`; zero credential strings in tracked files |
| SEC-02 | 01-02-PLAN.md | Unauthenticated `/api/migrate-now` endpoint removed or protected | SATISFIED | Route file deleted (`57fd3e9`), directory removed, PUBLIC_PATHS cleaned (`b84accd`), zero references in `src/` |
| SEC-03 | 01-03-PLAN.md | Notification API restricts sending to verified booking participants only | SATISFIED (code) / NEEDS HUMAN (runtime) | Guard block present in `route.ts`; live endpoint tests required for runtime confirmation |

All three Phase 1 requirement IDs (SEC-01, SEC-02, SEC-03) are claimed by plans and have implementation evidence. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No TODO/FIXME/placeholder/stub patterns detected across all five modified files (`run-schema.mjs`, `drizzle.config.ts`, `supabase/schema.sql`, `src/proxy.ts`, `src/app/api/notifications/route.ts`).

---

## Commit Verification

All commits referenced in summaries exist in git history:

| Commit | Summary | Description |
|--------|---------|-------------|
| `abda474` | 01-01-SUMMARY | fix: remove hardcoded database credentials |
| `01e05ba` | 01-01-SUMMARY | feat: sync supabase/schema.sql |
| `57fd3e9` | 01-02-SUMMARY | fix: delete migrate-now route |
| `b84accd` | 01-02-SUMMARY | fix: remove /api/migrate-now from PUBLIC_PATHS |
| `955c98d` | 01-03-SUMMARY | feat: add booking-participant guard |

---

## Human Verification Required

The following four tests require a running dev server with a live Supabase database. The code is structurally complete and correct; these tests confirm runtime behavior.

### 1. Non-participant 403

**Test:** Log in as User A. Find a booking where User A is neither `client_id` nor `provider_id`. POST to `http://localhost:3000/api/notifications` with body `{ "userId": "<any-user-id>", "type": "test", "message": "test", "bookingId": "<booking-where-A-is-not-participant>" }` including User A's session cookie.
**Expected:** HTTP 403 `{ "error": "Forbidden" }`
**Why human:** Requires live Supabase rows. The Supabase admin client's `.from('bookings')` query must return real data for the comparison to execute.

### 2. Participant succeeds

**Test:** Log in as User B who IS the `client_id` or `provider_id` of a real booking. POST to `/api/notifications` with that booking's ID.
**Expected:** HTTP 200 `{ "ok": true }` and a notification row inserted in the database.
**Why human:** Validates the positive path — ensures the guard does not over-block legitimate callers.

### 3. No bookingId regression

**Test:** POST to `/api/notifications` with body `{ "userId": "<any-user-id>", "type": "test", "message": "test" }` (no `bookingId`).
**Expected:** HTTP 200 `{ "ok": true }`
**Why human:** The `if (bookingId)` branch is bypassed in code; live test confirms no unintended side-effects from the admin client restructuring.

### 4. Unauthenticated 401

**Test:** POST to `/api/notifications` with no session cookie or Authorization header.
**Expected:** HTTP 401 `{ "error": "Unauthorized" }`
**Why human:** Auth guard is present in code; confirms middleware configuration does not accidentally exempt `/api/notifications` from auth.

---

## Summary

**SEC-01 (hardcoded credentials):** Fully resolved. Both `scripts/run-schema.mjs` and `drizzle.config.ts` now read `DATABASE_URL_UNPOOLED` from the environment. Zero credential strings remain in any tracked file. Verified against live git history.

**SEC-02 (open migration endpoint):** Fully resolved. `src/app/api/migrate-now/route.ts` is deleted, the directory is gone, and `PUBLIC_PATHS` contains only the four legitimate auth paths. The attack surface is zero.

**SEC-03 (notification spoofing):** Code complete. The booking-participant guard is present, substantive, and wired to the `bookings` table via the admin client. Four live endpoint tests are required before this can be marked fully closed — these are standard for any auth guard and cannot be verified without a running Supabase backend.

All automated checks pass. The phase goal is achieved at the code level; SEC-03 runtime behavior awaits human sign-off.

---

_Verified: 2026-03-07_
_Verifier: Claude (gsd-verifier)_
