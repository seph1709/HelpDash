---
phase: 01-security
plan: 01
subsystem: database
tags: [postgres, supabase, drizzle, credentials, rls, schema]

# Dependency graph
requires: []
provides:
  - Database connection scripts using env vars instead of hardcoded credentials
  - supabase/schema.sql in sync with src/db/schema.ts (chat_messages, booking_id on notifications)
affects: [all phases - any plan running run-schema.mjs or drizzle-kit now requires DATABASE_URL_UNPOOLED in env]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DB connection strings via DATABASE_URL_UNPOOLED env var (not host/port/user/password fields)"
    - "drizzle-kit url shorthand for connection string"

key-files:
  created: []
  modified:
    - scripts/run-schema.mjs
    - drizzle.config.ts
    - supabase/schema.sql

key-decisions:
  - "Used drizzle-kit url shorthand (url: process.env.DATABASE_URL_UNPOOLED!) rather than individual host/port/user/password fields — simpler and matches the already-established pattern in src/app/api/migrate-now/route.ts"
  - "booking_id on notifications uses ON DELETE SET NULL (not CASCADE) — preserves notification record when booking is deleted, only clears the link"

patterns-established:
  - "DB connection pattern: always use connectionString/url from DATABASE_URL_UNPOOLED env var, never inline host/port/user/password"

requirements-completed: [SEC-01]

# Metrics
duration: 1min
completed: 2026-03-06
---

# Phase 1 Plan 1: Credential Removal and Schema Sync Summary

**Hardcoded Supabase password removed from two source files; supabase/schema.sql synced to include chat_messages table with RLS and booking_id on notifications**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-06T12:50:59Z
- **Completed:** 2026-03-06T12:52:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Eliminated plaintext Supabase password from `scripts/run-schema.mjs` (was hardcoded as host/port/user/password block)
- Eliminated plaintext Supabase password from `drizzle.config.ts` (same password in dbCredentials block)
- Synced `supabase/schema.sql` with the Drizzle schema: added chat_messages table, two indexes, RLS enable + two policies, booking_id column on notifications, and "Users delete own notifications" DELETE policy

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hardcoded credentials in scripts/run-schema.mjs and drizzle.config.ts** - `abda474` (fix)
2. **Task 2: Sync supabase/schema.sql with current Drizzle schema** - `01e05ba` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `scripts/run-schema.mjs` - Client constructor now uses `connectionString: process.env.DATABASE_URL_UNPOOLED` instead of explicit host/port/user/password
- `drizzle.config.ts` - dbCredentials now uses `url: process.env.DATABASE_URL_UNPOOLED!` shorthand instead of explicit host/port/user/password/ssl fields
- `supabase/schema.sql` - Added booking_id to notifications table, "Users delete own notifications" DELETE policy, full chat_messages table definition with two indexes and two RLS policies

## Decisions Made

- Used drizzle-kit `url` shorthand rather than individual fields — matches the established pattern in `src/app/api/migrate-now/route.ts` and is simpler
- `booking_id` on notifications uses `ON DELETE SET NULL` (matching src/db/schema.ts) so notification history is preserved when a booking is deleted

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

`DATABASE_URL_UNPOOLED` must be set in the environment before running `scripts/run-schema.mjs` or `drizzle-kit`. This was a pre-existing requirement (the env var was already used in `src/app/api/migrate-now/route.ts`). No new external services were introduced.

Developers must add `DATABASE_URL_UNPOOLED` to their `.env.local` file (value: the unpooled Supabase connection string from Project Settings > Database > Connection string > Direct).

## Next Phase Readiness

- SEC-01 complete: hardcoded credentials eliminated from both tracked files
- Phase 1 Plan 2 (SEC-02: open migration endpoint) can proceed
- Any developer or CI pipeline running run-schema.mjs or drizzle-kit must have DATABASE_URL_UNPOOLED set

---
*Phase: 01-security*
*Completed: 2026-03-06*
