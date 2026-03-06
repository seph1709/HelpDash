# Testing

**Analysis Date:** 2026-03-06

## Current State

**Test coverage: Zero**

No test files exist anywhere in the codebase. No test framework is installed. The `package.json` scripts contain only `dev`, `build`, `start`, and `lint` — there is no `test` script.

## Installed Testing Infrastructure

**None.** The following frameworks are absent from both `dependencies` and `devDependencies` in `package.json`:
- Jest / `@jest/globals`
- Vitest
- `@testing-library/react`
- Cypress
- Playwright (not in project deps; appears only as a transitive dependency of `next-pwa`)
- `@testing-library/jest-dom`
- `msw` (Mock Service Worker)

## What Should Be Tested

Based on the codebase analysis, these areas carry the highest risk without tests:

**Critical — Business Logic:**
- `src/controllers/jobController.ts` — job creation with `visible_to_free_at` tiering logic
- `src/controllers/authController.ts` — user registration and login flows
- `src/controllers/providerController.ts` — profile and stats update logic
- `src/models/jobModel.ts` — `getJobFeedForProvider` with subscription tier filtering and distance calculations
- `src/models/providerModel.ts` — `getNearbyProviders` Haversine distance filtering
- `src/lib/utils.ts` — `getDistanceKm`, `formatCurrency`, `reverseGeocode`

**High — API Route Validation:**
- All routes in `src/app/api/` — Zod validation, auth checks, error responses
- `src/app/api/chat/route.ts` — booking participant validation before admin insert
- `src/app/api/notifications/route.ts` — auth enforcement

**High — State Machine:**
- Booking status transitions (`pending → accepted → en_route → arrived → in_progress → done`)
- Currently enforced only in UI; no server-side validation exists

**Medium — UI Components:**
- `src/views/components/chat/ChatBox.tsx` — realtime subscription lifecycle
- `src/views/components/map/LiveMap.tsx` / `LocationSharer.tsx` — geolocation and Leaflet integration
- `src/app/(client)/bookings/[id]/BookingActions.tsx` — complex conditional rendering based on booking status

## Recommended Testing Stack

For this Next.js + Supabase codebase:

**Unit / Integration: Vitest**
- Preferred over Jest for Next.js 15+ due to ESM compatibility
- Fast HMR-based test runner
- Install: `npm install -D vitest @vitest/ui`

**React Component Testing: Testing Library**
- `@testing-library/react` + `@testing-library/user-event`
- `jsdom` or `happy-dom` as test environment

**API Route Testing: Vitest + node-fetch or supertest**
- Mock Supabase client with `vi.mock`
- Test request/response contracts for each route

**E2E: Playwright**
- Already available as transitive dep; install `@playwright/test` directly
- Critical flows: registration, post-job, book provider, booking lifecycle

**Supabase Mocking:**
- Mock `@supabase/supabase-js` and `@supabase/ssr` using `vi.mock`
- Or use Supabase local dev stack (`supabase start`) for integration tests

## Example Test Structure (when implemented)

```
src/
├── controllers/
│   ├── jobController.ts
│   └── __tests__/
│       └── jobController.test.ts
├── models/
│   ├── jobModel.ts
│   └── __tests__/
│       └── jobModel.test.ts
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── app/
    └── api/
        └── jobs/
            └── create/
                ├── route.ts
                └── __tests__/
                    └── route.test.ts
e2e/
└── booking-flow.spec.ts
```

## Priority Order for First Tests

1. `src/lib/utils.ts` — pure functions, easiest to test, high value (`getDistanceKm`)
2. `src/controllers/jobController.ts` — subscription tier logic, job visibility window
3. `src/app/api/` route handlers — validate Zod schemas, auth checks, error codes
4. Booking status machine — server-side transition validation (once added)
5. E2E: registration + post-job + book provider flow

---

*Testing analysis: 2026-03-06*
