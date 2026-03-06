# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Layered MVC-style architecture within a Next.js App Router fullstack application

**Key Characteristics:**
- Routes are split into client (`(client)/`) and provider (`provider/`) role-based segments, each protected by their own layout-level auth guards
- Server Components handle data fetching directly via Supabase server client; Client Components handle interactivity and realtime subscriptions
- API Routes follow a strict three-layer pipeline: route handler → controller → model
- Drizzle ORM is used for schema definition and migrations only; runtime queries go through the Supabase JS client (not Drizzle)
- Realtime push (notifications, chat) is delivered via Supabase Broadcast channels

## Layers

**Routes / Pages (Next.js App Router):**
- Purpose: Entry points for UI rendering and HTTP handling; Server Components fetch data directly, Client Components subscribe to realtime events
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, and co-located interactive components (`*Actions.tsx`, `*Button.tsx`)
- Depends on: controllers (via API routes), Supabase server client (via direct calls in Server Components), shared views
- Used by: Browser / Next.js runtime

**API Route Handlers:**
- Purpose: Stateless HTTP endpoints that validate inputs (Zod), authenticate callers, and delegate to controllers
- Location: `src/app/api/`
- Contains: `route.ts` files — one per HTTP method per endpoint
- Depends on: `src/controllers/`, `src/lib/supabase-server.ts`
- Used by: Client Components and `src/lib/notify.ts`

**Controllers:**
- Purpose: Business logic and orchestration; enforce domain rules before calling models
- Location: `src/controllers/`
- Contains: `authController.ts`, `jobController.ts`, `providerController.ts`, `idParseController.ts`
- Depends on: `src/models/`, `src/types/`, `src/lib/utils.ts`
- Used by: `src/app/api/` route handlers

**Models:**
- Purpose: Data access layer; all Supabase queries live here
- Location: `src/models/`
- Contains: `userModel.ts`, `jobModel.ts`, `providerModel.ts`
- Depends on: Supabase JS client, `src/types/`
- Used by: controllers

**Views (UI Components):**
- Purpose: Reusable presentational components and the shared app shell layout
- Location: `src/views/`
- Contains: `components/shared/`, `components/booking/`, `components/chat/`, `components/map/`, `layouts/AppShell.tsx`
- Depends on: `src/lib/utils.ts`, `src/types/`, `src/lib/supabase.ts` (browser client for realtime)
- Used by: pages

**Database Schema:**
- Purpose: Single source of truth for table shapes and Drizzle-inferred TypeScript types
- Location: `src/db/schema.ts`, `src/db/index.ts`
- Contains: table definitions, relations, and exported row types (`UserRow`, `JobRow`, etc.)
- Depends on: drizzle-orm
- Used by: migrations only (runtime uses Supabase client)

**Lib (Infrastructure Utilities):**
- Purpose: Cross-cutting utilities and client factories
- Location: `src/lib/`
- Contains: `supabase.ts` (browser client), `supabase-server.ts` (server + admin clients), `utils.ts` (formatting, geo calculations), `notify.ts` (notification helper)
- Depends on: `@supabase/ssr`, `@supabase/supabase-js`
- Used by: all layers

**Types:**
- Purpose: Shared TypeScript interfaces and domain constants (job categories, barangay list)
- Location: `src/types/index.ts`
- Contains: `User`, `Provider`, `Job`, `Booking`, `Payment`, `Rating`, `Dispute`, `Notification`, `Subscription`, `ApiResponse`, `JOB_CATEGORIES`, `BARANGAYS_QC`
- Depends on: nothing
- Used by: all layers

**Hooks:**
- Purpose: Client-side React hooks for auth state
- Location: `src/hooks/useUser.ts`
- Contains: `useUser()` — fetches and subscribes to current user from Supabase auth
- Depends on: `src/lib/supabase.ts`
- Used by: Client Components that need current user without a full Server Component fetch

## Data Flow

**Client-initiated API mutation (e.g., post a job):**

1. Client Component calls `fetch('/api/jobs/create', { method: 'POST', body })` or a Server Component directly calls the model
2. `src/app/api/jobs/create/route.ts` authenticates the caller via `createSupabaseServerClient()` and validates the body with Zod
3. Route calls `createJobListing()` in `src/controllers/jobController.ts`
4. Controller applies domain rules (validates required fields, injects computed fields like `visible_to_free_at`) then calls `createJob()` in `src/models/jobModel.ts`
5. Model executes the Supabase insert and returns typed data
6. Response propagates back: model → controller → route → HTTP JSON

**Server Component page render (e.g., client dashboard):**

1. Next.js renders `src/app/(client)/dashboard/page.tsx` on the server
2. Layout `src/app/(client)/layout.tsx` runs first: creates server Supabase client, fetches auth user and user profile, redirects to `/login` if unauthenticated, passes `user` + `notificationCount` to `AppShell`
3. Page component fetches its own data directly (recent jobs, active bookings) using the server Supabase client
4. Rendered HTML streamed to browser with no client-side fetch needed for initial data

**Realtime notification delivery:**

1. `src/lib/notify.ts` is called from a server action or API route after a state change (e.g., booking accepted)
2. It POSTs to `/api/notifications` which uses the admin client to bypass RLS and insert the notification row
3. It then broadcasts on the `user-notifs:{userId}` Supabase Realtime channel
4. `src/views/layouts/AppShell.tsx` subscribes to this channel on mount; incoming payloads increment the badge counter and trigger a `sonner` toast

**Realtime chat:**

1. Client sends message via `POST /api/chat`
2. Route validates sender is a booking participant, inserts via admin client, then broadcasts on `chat:{bookingId}` channel
3. `src/views/components/chat/ChatBox.tsx` subscribes to the channel and appends incoming messages

**State Management:**

- No global client state store (no Redux, Zustand, or Context)
- Server Components own initial data; Client Components manage ephemeral UI state with `useState`/`useEffect`
- `useUser()` hook provides current user on client when needed outside of a server render

## Key Abstractions

**AppShell:**
- Purpose: Shared authenticated wrapper providing top nav, sidebar (desktop), bottom nav (mobile), notification badge, and logout
- Examples: `src/views/layouts/AppShell.tsx`
- Pattern: Accepts `user` and `notificationCount` props from layout Server Components; uses `pathname` to determine which nav set (client vs. provider) to render; subscribes to realtime notifications internally

**Supabase Client Factories:**
- Purpose: Two distinct clients — server (cookie-based, respects RLS) and admin (service role, bypasses RLS)
- Examples: `src/lib/supabase-server.ts` (`createSupabaseServerClient`, `createSupabaseAdminClient`), `src/lib/supabase.ts` (`createSupabaseBrowserClient`)
- Pattern: Admin client used only in API routes where cross-user inserts are required (notifications, chat); never in Server Components or Client Components

**Role-Based Route Groups:**
- Purpose: Separate navigation and auth rules for client users vs. provider users
- Examples: `src/app/(client)/` (client route group), `src/app/provider/` (provider routes)
- Pattern: Each group has its own `layout.tsx` that enforces authentication and role checks, then wraps content in `AppShell`

**Job Visibility Tiering:**
- Purpose: Premium providers see new jobs immediately; free providers see jobs after a 5-minute delay
- Examples: `src/models/jobModel.ts` (`getJobFeedForProvider`), `src/db/schema.ts` (`visible_to_free_at` column)
- Pattern: `visible_to_free_at` is set to `now() + 5 minutes` on job insert; free-tier query filters by `visible_to_free_at <= now()`

## Entry Points

**Root page:**
- Location: `src/app/page.tsx`
- Triggers: Any GET to `/`
- Responsibilities: Returns null; middleware redirects authenticated users to `/dashboard` and unauthenticated users to `/login`

**Root layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Sets global metadata, PWA viewport, applies Geist fonts, renders `OfflineBanner` and `Toaster`

**Client layout (auth guard):**
- Location: `src/app/(client)/layout.tsx`
- Triggers: Any route under `/(client)/` (dashboard, bookings, post-job, providers, notifications)
- Responsibilities: Validates session, fetches user profile, counts unread notifications, wraps children in `AppShell`

**Provider layout (auth + role guard):**
- Location: `src/app/provider/layout.tsx`
- Triggers: Any route under `/provider/`
- Responsibilities: Validates session, redirects client-only users to `/dashboard`, wraps children in `AppShell`

## Error Handling

**Strategy:** Throw-on-error in models/controllers; catch at API route boundary and return `{ error: string }` JSON with appropriate HTTP status

**Patterns:**
- Models: `if (error) throw new Error(error.message)` on mutating operations; return `null` or `[]` on reads
- Controllers: propagate model errors upward; add domain validation errors as thrown `Error` instances
- API routes: `try/catch` wraps the full handler; errors from controllers surface as `{ error: message }` with `status: 400` or `status: 401/403`
- Server Component pages: errors from direct Supabase calls are silently ignored (destructure and proceed with `null` data); no error boundaries present

## Cross-Cutting Concerns

**Logging:** `console.log` and `console.error` only; no structured logging library. Two debug `console.log` calls exist in `src/app/provider/dashboard/page.tsx`.

**Validation:** Zod schemas defined inline in each API route handler; no shared schema registry.

**Authentication:** Supabase Auth (cookie-based JWT via `@supabase/ssr`); session validated in every layout and every API route by calling `supabase.auth.getUser()`. Admin bypass via service role client for cross-user writes.

**Geolocation / Distance:** Haversine formula implemented in `src/lib/utils.ts` (`getDistanceKm`); distance filtering done in JavaScript after fetching all candidates from Supabase (no PostGIS).

---

*Architecture analysis: 2026-03-06*
