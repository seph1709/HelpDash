---
phase: 01-security
plan: 02
subsystem: api
tags: [security, middleware, next.js, attack-surface-reduction]

# Dependency graph
requires: []
provides:
  - Unauthenticated /api/migrate-now route eliminated from codebase
  - PUBLIC_PATHS in src/proxy.ts restricted to four legitimate auth paths
affects: [02-trust, 03-admin, 04-mvp, 05-launch]

# Tech tracking
tech-stack:
  added: []
  patterns: [Delete attack surface rather than guarding it — route elimination over auth guards for dangerous internal endpoints]

key-files:
  created: []
  modified:
    - src/proxy.ts

key-decisions:
  - "Deleted route file entirely rather than adding auth guard — eliminates attack surface rather than reducing it"
  - "Removed entire src/app/api/migrate-now/ directory, not just the route file"

patterns-established:
  - "Attack surface reduction: when an internal/dangerous endpoint has no legitimate external use, delete it rather than guard it"

requirements-completed: [SEC-02]

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 1 Plan 02: Delete Unauthenticated Migration Endpoint Summary

**Unauthenticated /api/migrate-now SQL-execution endpoint eliminated by deleting route file and removing PUBLIC_PATHS entry in middleware**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-06T17:11:05Z
- **Completed:** 2026-03-06T17:14:00Z
- **Tasks:** 2
- **Files modified:** 1 (deleted 1)

## Accomplishments
- Deleted src/app/api/migrate-now/route.ts and its directory — no route handler, no response, zero attack surface
- Removed '/api/migrate-now' from PUBLIC_PATHS in src/proxy.ts — middleware now requires authentication for all non-auth API paths
- Verified grep -r "migrate-now" src/ returns zero matches — no residual references anywhere in the codebase

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete the migrate-now route file** - `57fd3e9` (fix)
2. **Task 2: Remove /api/migrate-now from PUBLIC_PATHS in src/proxy.ts** - `b84accd` (fix)

**Plan metadata:** (docs commit pending)

## Files Created/Modified
- `src/app/api/migrate-now/route.ts` - DELETED (unauthenticated SQL execution endpoint, 69 lines removed)
- `src/proxy.ts` - Removed '/api/migrate-now' from PUBLIC_PATHS array (line 4)

## Decisions Made
- Deleted the route entirely rather than adding an auth guard. The endpoint had no legitimate external caller — it was an internal migration utility that should never have been publicly routable. Elimination over restriction.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SEC-02 complete. All three Phase 1 security fixes now addressed (pending 01-03 for notification spoofing if applicable).
- No residual references to migrate-now in codebase.
- Middleware PUBLIC_PATHS is clean — only legitimate auth paths are public.

---
*Phase: 01-security*
*Completed: 2026-03-06*
