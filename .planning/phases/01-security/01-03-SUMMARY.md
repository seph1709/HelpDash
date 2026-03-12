---
phase: 01-security
plan: 03
subsystem: api
tags: [supabase, notifications, authorization, booking-participant, security]

# Dependency graph
requires:
  - phase: 01-security
    provides: Authenticated user context via createSupabaseServerClient
provides:
  - Booking-participant guard on /api/notifications POST route (403 for non-participants)
affects: [notifications, bookings]

# Tech tracking
tech-stack:
  added: []
  patterns: [admin-client-reuse, participant-guard-before-insert]

key-files:
  created: []
  modified:
    - src/app/api/notifications/route.ts

key-decisions:
  - "Reuse existing admin client for booking lookup rather than creating a second client instance — reduces overhead and keeps the guard atomic"
  - "Guard fires only when bookingId is present — system-level notifications (no bookingId) are unaffected, preserving existing caller behavior"

patterns-established:
  - "Participant guard pattern: fetch client_id/provider_id from bookings, compare against authenticated user.id, return 403 if neither matches"

requirements-completed: [SEC-03]

# Metrics
duration: 1min
completed: 2026-03-06
---

# Phase 1 Plan 03: Notification Booking-Participant Guard Summary

**Booking-participant authorization guard added to /api/notifications: non-participants receive 403 when supplying a bookingId they do not belong to**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-06T12:51:10Z
- **Completed:** 2026-03-06T12:51:38Z
- **Tasks:** 1 of 1 auto tasks complete (checkpoint pending human verification)
- **Files modified:** 1

## Accomplishments
- Added booking-participant guard to POST /api/notifications using the existing admin client
- Guard verifies caller is client_id or provider_id of the referenced booking before allowing the insert
- System-level notifications (no bookingId) are unaffected — no regression on existing behavior
- 401 unauthenticated and 400 missing-fields guards remain intact

## Task Commits

Each task was committed atomically:

1. **Task 1: Insert booking-participant guard into notifications route** - `955c98d` (feat)

**Plan metadata:** (pending — after human verification checkpoint)

## Files Created/Modified
- `src/app/api/notifications/route.ts` - Added booking-participant guard block; moved admin client instantiation before the guard; reuses admin client for both lookup and insert

## Decisions Made
- Reuse the single admin client instance for both the booking lookup and the subsequent notification insert — avoids creating a second Supabase client, reduces overhead, and keeps the execution path linear
- Guard scoped to `bookingId`-present requests only — system-level notifications have no participant concept and must not be blocked

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SEC-03 implementation complete pending human verification of live Supabase behavior
- Notification spoofing vector (any authenticated user posting to any booking) is now closed
- All three Phase 1 security fixes (SEC-01 hardcoded creds, SEC-02 open migration endpoint, SEC-03 notification spoofing) addressed

---
*Phase: 01-security*
*Completed: 2026-03-06*
