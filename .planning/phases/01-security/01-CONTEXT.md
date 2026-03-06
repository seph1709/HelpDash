# Phase 1: Security - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate 3 known vulnerabilities in the existing codebase: hardcoded database credentials in `scripts/run-schema.mjs` (SEC-01), unauthenticated `/api/migrate-now` endpoint (SEC-02), and notification spoofing via `/api/notifications` (SEC-03). No new features — fixes only.

</domain>

<decisions>
## Implementation Decisions

### run-schema.mjs (SEC-01)
- Keep the script — do not delete it
- Replace hardcoded connection parameters (host, port, user, password) with `DATABASE_URL_UNPOOLED` as a connection string — matches the existing env var already used in the project for direct pg connections
- Add `supabase/schema.sql` to the repo containing the full schema derived from Drizzle (`src/db/schema.ts`) — this gives the script something to run

### migrate-now endpoint (SEC-02)
- Delete the route entirely (`src/app/api/migrate-now/route.ts` — the file itself)
- Remove `/api/migrate-now` from `PUBLIC_PATHS` in `src/proxy.ts`
- No other files reference this endpoint — safe to delete with no further changes

### Notification API (SEC-03)
### Claude's Discretion
- Add booking-participant validation inside the `/api/notifications` route: verify the authenticated caller (`user.id`) is either the `client_id` or `provider_id` of the `bookingId` supplied in the request body before allowing the insert
- Credential rotation (the committed password in git history) is handled by the user outside the codebase — not in scope for this phase

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createSupabaseServerClient` / `createSupabaseAdminClient` (`src/lib/supabase-server.ts`): already used in the notifications route — same pattern applies for the participant validation query
- Auth guard pattern (`if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`): established in every protected route — use same shape for the new 403 response in notifications

### Established Patterns
- All API routes: Zod `safeParse` validation → auth check → logic → `NextResponse.json()`
- `DATABASE_URL_UNPOOLED`: already used by `src/app/api/migrate-now/route.ts` for direct pg connections — `scripts/run-schema.mjs` should adopt the same var
- `PUBLIC_PATHS` in `src/proxy.ts`: array of unauthenticated paths that the middleware allows through — removing an entry here is sufficient to require auth on a route

### Integration Points
- `scripts/run-schema.mjs`: standalone script, no imports from `src/` — env var change is self-contained
- `src/app/api/migrate-now/route.ts`: deletion only, no callers in the codebase
- `src/app/api/notifications/route.ts`: called by `src/lib/notify.ts` (client-side fetch) — route signature stays the same after adding the participant check

</code_context>

<specifics>
## Specific Ideas

- The `supabase/schema.sql` file should be auto-generated/derived from Drizzle so it stays in sync with `src/db/schema.ts` — treat it as a snapshot of the schema, not a second source of truth

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-security*
*Context gathered: 2026-03-06*
