# Codebase Concerns

**Analysis Date:** 2026-03-06

## Tech Debt

**Hardcoded Database Credentials in Committed Script:**
- Issue: `scripts/run-schema.mjs` contains a hardcoded IPv6 address, database port, username, and plaintext password directly in the source code
- Files: `scripts/run-schema.mjs` (lines 11–17)
- Impact: Critical security exposure — credentials are committed to git history and visible to anyone with repo access
- Fix approach: Move to environment variables (`process.env.DB_HOST`, `process.env.DB_PASSWORD`, etc.) and rotate the exposed password immediately

**Exposed Database Migration Endpoint with No Auth Guard:**
- Issue: `GET /api/migrate-now` runs raw DDL (ALTER TABLE, CREATE TABLE, CREATE POLICY) against the production database. It is listed in `PUBLIC_PATHS` in `src/proxy.ts`, meaning it is accessible to unauthenticated callers
- Files: `src/app/api/migrate-now/route.ts`, `src/proxy.ts` (line 4)
- Impact: Any visitor can trigger schema mutations in production, potentially breaking the running application
- Fix approach: Remove from `PUBLIC_PATHS`, add admin role check, or delete the endpoint entirely and use proper Drizzle migrations via `drizzle-kit push`

**Dual Schema Sources of Truth (Drizzle + Raw SQL):**
- Issue: `src/db/schema.ts` defines the schema with Drizzle ORM, but `scripts/run-schema.mjs` references a separate `supabase/schema.sql` file (not present in repo) and `src/app/api/migrate-now/route.ts` runs inline DDL. Three overlapping migration mechanisms exist simultaneously
- Files: `src/db/schema.ts`, `scripts/run-schema.mjs`, `src/app/api/migrate-now/route.ts`
- Impact: Schema drift between environments; `drizzle-kit` migrations cannot track changes applied via the other two paths
- Fix approach: Consolidate to a single migration strategy — Drizzle migrations (`drizzle-kit generate` + `drizzle-kit migrate`) — and delete the ad hoc routes/scripts

**Subscription Tier Not Verified at Subscription Expiry:**
- Issue: `providers.subscription_tier` and `providers.subscription_expires_at` are stored separately. No server-side code checks `subscription_expires_at` before applying premium benefits (instant job visibility). A provider whose subscription expired still receives premium-tier treatment until their tier field is manually reset
- Files: `src/models/jobModel.ts` (line 75), `src/db/schema.ts` (lines 55–56)
- Impact: Providers get free premium access after their paid period ends
- Fix approach: In `getJobFeedForProvider`, additionally check `subscription_expires_at > now()` before treating tier as `premium`

**Barangay Field Commented Out in Post-Job Form:**
- Issue: The barangay selection field is commented out in the post-job form with the schema validation also disabled. Jobs are inserted without a `barangay` value despite the column being `NOT NULL` in the schema definition
- Files: `src/app/(client)/post-job/page.tsx` (lines 35, 122, 243–249)
- Impact: Jobs stored with empty string for barangay; barangay-based proximity features silently degrade
- Fix approach: Derive barangay automatically from the selected map location (reverse geocode) or re-enable the dropdown field

**Cash Subscription Payment Status Stored as `failed`:**
- Issue: When a provider selects cash payment, the code inserts a subscription record with `payment_status: 'failed'` as a placeholder awaiting admin confirmation. There is no admin dashboard or queue to process these; the status is never updated
- Files: `src/app/provider/subscription/page.tsx` (lines 38–45)
- Impact: Providers who pay cash can never get their subscription activated through the application; requires direct database edits
- Fix approach: Use a `pending` payment status, build an admin confirmation flow, or record the intent separately from the subscription record

**GCash Payment Integration Absent:**
- Issue: GCash/PayMongo integration is not implemented. Selecting GCash shows a toast saying "coming soon" and returns early. The subscription page advertises "Pay via PayMongo" to users
- Files: `src/app/provider/subscription/page.tsx` (lines 31–34)
- Impact: The primary payment channel is non-functional; providers cannot actually subscribe through the UI
- Fix approach: Integrate PayMongo Checkout or E-Wallet API before enabling the GCash path

## Known Bugs

**`console.log` Calls Left in Provider Dashboard (Production Leak):**
- Symptoms: Server-side `console.log(recentBookings)` and `console.log(users)` fire on every provider dashboard page render, leaking booking and full user table data to server logs
- Files: `src/app/provider/dashboard/page.tsx` (lines 57–58, 61, 68)
- Trigger: Any visit to `/provider/dashboard`
- Workaround: Remove the console statements

**N+1-Style Full Users Table Fetch in Provider Dashboard:**
- Symptoms: `await supabase.from('users').select('*')` fetches all users unconditionally, then iterates them in JS to find client names per booking
- Files: `src/app/provider/dashboard/page.tsx` (lines 52, 60–73)
- Trigger: Every page load of `/provider/dashboard`
- Workaround: Join `client:users(name)` in the bookings query instead of fetching all users separately

**Rating Form Shown After `client_confirmed` is Already True:**
- Symptoms: The condition on line 202 of `BookingActions.tsx` includes `status === 'done' && clientConfirmed && score === 0 && showRating`. If a user returns to a booking page after already confirming (where `clientConfirmed` is `true`), the rating form can reappear if `showRating` is `true` in local state, allowing a second rating insert for the same booking
- Files: `src/app/(client)/bookings/[id]/BookingActions.tsx` (line 202)
- Trigger: Navigating away and back on a confirmed booking with React state persisted
- Workaround: Check database for existing rating before showing the rating form

**Unreachable Code After Return in `getUserName`:**
- Symptoms: `console.log(element)` on line 68 of the provider dashboard follows a `return` statement and never executes
- Files: `src/app/provider/dashboard/page.tsx` (line 68)
- Trigger: Always unreachable
- Workaround: Remove the dead code

**LiveMap `eslint-disable-line react-hooks/exhaustive-deps` Suppresses Real Bug:**
- Symptoms: The map initialisation `useEffect` intentionally omits `providerPos`, `jobLat`, and `jobLng` from its dependency array with a lint suppression comment. If `jobLat`/`jobLng` props change (e.g., different booking loaded), the map will not re-center
- Files: `src/views/components/map/LiveMap.tsx` (line 104)
- Trigger: Component remounts with different `jobLat`/`jobLng`
- Workaround: Proper map teardown and re-init on prop change

## Security Considerations

**Notification API Allows Any Authenticated User to Notify Any Other User:**
- Risk: `POST /api/notifications` accepts `userId` from the request body and inserts a notification for that user using the admin client. Any logged-in user can send arbitrary notifications to any other user
- Files: `src/app/api/notifications/route.ts` (lines 10–23)
- Current mitigation: Requires valid session (401 if unauthenticated)
- Recommendations: Validate that `userId` is a participant in the referenced `bookingId`, or restrict notification creation to server-side trusted calls only (remove the public HTTP endpoint)

**`update-stats` Endpoint Accepts Arbitrary `providerId` from Client:**
- Risk: `POST /api/provider/update-stats` accepts `providerId` from the request body and recalculates stats for that provider using the admin client. Any authenticated user can trigger a stats recalculation for any provider, and the endpoint could be abused to trigger expensive queries at scale
- Files: `src/app/api/provider/update-stats/route.ts` (lines 9–10)
- Current mitigation: Requires authentication
- Recommendations: Derive `providerId` from the authenticated session or validate that the caller is the booking client/provider

**Admin Client Used to Bypass RLS for Chat Insert:**
- Risk: Chat message inserts bypass RLS via the service role key after a manual participation check in application code. If the participation logic has a bug, it cannot be caught by database-level policy
- Files: `src/app/api/chat/route.ts` (lines 26–31)
- Current mitigation: Manual booking participant check before the admin insert
- Recommendations: Fix the RLS policy for `chat_messages` INSERT so it works with the regular client, avoiding the admin bypass pattern

**ID Photo Uploaded to Public Supabase Storage Bucket:**
- Risk: Government IDs are uploaded to `provider-ids` bucket and a public URL is stored. If the bucket is configured with public read access, anyone with the URL can view sensitive identity documents
- Files: `src/app/provider/onboarding/page.tsx` (lines 93–102)
- Current mitigation: URL is not publicly surfaced in the UI
- Recommendations: Confirm the `provider-ids` bucket is set to private/authenticated access only; use signed URLs when displaying

**`id_verified` Set Based on OCR Success, Not Human Review:**
- Risk: `id_verified: !!parsedName` — a provider is marked as ID-verified if the OCR returned any name string. A provider could upload any image containing text and be marked verified
- Files: `src/app/provider/onboarding/page.tsx` (line 114)
- Current mitigation: None
- Recommendations: Set `id_verified = false` on upload and require admin review step to flip the flag

## Performance Bottlenecks

**In-Memory Distance Filtering Fetches All Providers/Jobs:**
- Problem: Both `getNearbyProviders` and `getJobFeedForProvider` fetch all available records from the database then filter by Haversine distance in JavaScript
- Files: `src/models/providerModel.ts` (lines 64–83), `src/models/jobModel.ts` (lines 59–93)
- Cause: Comment in `providerModel.ts` explicitly acknowledges "PostGIS would be ideal for large scale, but this works for MVP"
- Improvement path: Enable PostGIS on Supabase and use `ST_DWithin` or the built-in `earth_distance` extension to push filtering to the database

**Providers Page Also Fetches All Available Providers Without Server-Side Filter:**
- Problem: `src/app/(client)/providers/page.tsx` runs `.select('*, user:users(...)').eq('is_available', true)` with no location bounding box, then filters in JS
- Files: `src/app/(client)/providers/page.tsx` (lines 20–28)
- Cause: Same JS-distance pattern as models
- Improvement path: Same PostGIS fix as above

**Chat Message History Hard-Capped at 100 with No Pagination:**
- Problem: `ChatBox` fetches the last 100 messages with `.limit(100)` and no infinite scroll. In long bookings, older messages are silently dropped
- Files: `src/views/components/chat/ChatBox.tsx` (line 37)
- Cause: Simple implementation without pagination
- Improvement path: Implement cursor-based pagination with "load earlier messages" trigger

## Fragile Areas

**Booking Status State Machine Enforced Only in UI:**
- Files: `src/app/(client)/bookings/[id]/BookingActions.tsx`, `src/app/provider/bookings/[id]/ProviderBookingActions.tsx`
- Why fragile: Status transitions (pending → accepted → en_route → arrived → in_progress → done) are enforced only through UI conditional rendering. The Supabase client writes directly to the `bookings` table from the browser with no server-side state machine validation. A malicious or buggy client can set any status value arbitrarily
- Safe modification: Add an API route that validates the transition before applying it, or add a Postgres trigger/RLS check
- Test coverage: No tests exist

**`auto_confirm_at` Column Exists But Is Never Used:**
- Files: `src/db/schema.ts` (line 103), `src/types/index.ts` (line 120)
- Why fragile: The schema and types include `auto_confirm_at` for automatic job confirmation, but no background job, trigger, or cron sets it or reads it. If a provider marks a job done and the client never confirms, the booking is stuck in `done/unconfirmed` indefinitely
- Safe modification: Implement a Supabase Edge Function or pg_cron job that auto-confirms after the stored timestamp
- Test coverage: None

**`job.expires_at` Column Never Enforced:**
- Files: `src/db/schema.ts` (lines 83–85), `src/models/jobModel.ts`
- Why fragile: Jobs have a `expires_at` timestamp (default 24 hours) but no code filters out expired jobs in the feed, and no background process closes them. Open expired jobs pollute the feed indefinitely
- Safe modification: Add `.gt('expires_at', new Date().toISOString())` filter in `getJobFeedForProvider` and a cleanup job
- Test coverage: None

**`no_show_count` Tracked in Schema But Never Incremented:**
- Files: `src/db/schema.ts` (line 53), `src/types/index.ts` (line 70)
- Why fragile: The `no_show` booking status exists in `BookingStatus` and the badge renders it, but no code path ever transitions a booking to `no_show` or increments `providers.no_show_count`
- Safe modification: Add a timer-based transition when a provider does not update status within a defined window after acceptance
- Test coverage: None

**Realtime Broadcast Channel Not Cleaned Up on Chat Send Error:**
- Files: `src/app/api/chat/route.ts` (lines 36–53), `src/lib/notify.ts` (lines 18–25)
- Why fragile: The server-side broadcast channel subscribes asynchronously, sends one message, then removes itself. If the subscription never reaches `SUBSCRIBED` status (e.g., network timeout), the channel leaks and `removeChannel` is never called
- Safe modification: Add a timeout guard that removes the channel if it does not reach `SUBSCRIBED` within a few seconds

## Scaling Limits

**Supabase Free Tier Realtime Connection Limits:**
- Current capacity: Each active booking page opens 1–2 Realtime channels (tracking + chat). Realtime has a concurrent connection limit on the free tier (~200)
- Limit: ~100 simultaneous active bookings before connection rejections
- Scaling path: Upgrade to Supabase Pro tier or implement connection pooling by routing broadcasts through a single server-side channel rather than per-client subscriptions

**Full Table Scans on Every Feed Load:**
- Current capacity: In-memory distance filtering works acceptably up to a few hundred providers/jobs
- Limit: Query times will become noticeable above ~1,000 available records; the entire `providers` or `jobs` table is returned to the Next.js server on each request
- Scaling path: Add PostGIS spatial indexing (see Performance Bottlenecks section)

## Dependencies at Risk

**`next-pwa` Package:**
- Risk: `next-pwa@5.6.0` has not been updated since 2022 and does not officially support Next.js App Router. Its usage in this project creates build warnings and its Workbox integration may not correctly cache App Router routes
- Impact: PWA install and offline functionality may be broken or inconsistent
- Migration plan: Migrate to `@ducanh2912/next-pwa` (maintained fork) or `serwist/next` which have App Router support

## Missing Critical Features

**No Admin Dashboard:**
- Problem: Multiple flows depend on admin intervention (cash subscription confirmation, manual `id_verified` flip) but there is no admin interface or protected admin route
- Blocks: Cash payments cannot be activated; ID verification cannot be manually approved

**No Payment Processing:**
- Problem: GCash/PayMongo integration is a stub. `payments` table exists in the schema but no code ever inserts into it through a real payment flow
- Blocks: The platform cannot process any real money; `agreed_price` is stored but payments are entirely manual/informal

**No Dispute Resolution Interface:**
- Problem: `disputes` table exists in the schema with `evidence_photos`, `resolution_note`, `resolved_at`. No UI exists to raise, view, or resolve disputes
- Blocks: The `disputed` booking/job status can never be reached through the application

**No Job Expiry Enforcement:**
- Problem: `jobs.expires_at` is set on creation but never enforced. Open jobs accumulate indefinitely in the feed
- Blocks: Feed quality degrades over time with stale listings

## Test Coverage Gaps

**Zero Test Coverage Across the Entire Codebase:**
- What's not tested: All controllers, models, API routes, UI components, and utility functions
- Files: All of `src/`
- Risk: Any refactor, new feature, or dependency update can break existing functionality with no automated detection
- Priority: High — especially critical for the booking status machine, payment flows, and authentication logic

---

*Concerns audit: 2026-03-06*
