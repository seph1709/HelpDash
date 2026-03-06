# External Integrations

**Analysis Date:** 2026-03-06

## Database

**Supabase PostgreSQL**
- Purpose: Primary database for all application data
- Client: `@supabase/supabase-js` (runtime queries), `drizzle-orm` + `postgres` driver (migrations only)
- Config: `DATABASE_URL` env var (Transaction Pooler, port 6543, `prepare: false`)
- Used in: `src/db/index.ts`, all models in `src/models/`
- Notes: Drizzle schema at `src/db/schema.ts` defines tables; runtime queries all go through Supabase JS client, not Drizzle

## Authentication

**Supabase Auth**
- Purpose: User authentication (email/password)
- Client: `@supabase/ssr` for cookie-based SSR sessions; `@supabase/supabase-js` for client-side
- Config: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Used in: `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, all layouts and API routes
- Pattern: `supabase.auth.getUser()` called in every layout and API route to validate session; `supabase.auth.signOut()` in AppShell logout
- RLS: Row-level security enabled; admin bypass via `SUPABASE_SERVICE_ROLE_KEY` in `createSupabaseAdminClient()`

## Storage

**Supabase Storage**
- Purpose: Provider government ID photo uploads
- Bucket: `provider-ids`
- Used in: `src/app/provider/onboarding/page.tsx` (upload) — `supabase.storage.from('provider-ids').upload()`
- Notes: Uses `getPublicUrl()` — bucket may need to be private; see CONCERNS.md

## Realtime

**Supabase Realtime (Broadcast)**
- Purpose: Live notifications and chat messages
- Channels:
  - `user-notifs:{userId}` — notification badge updates and toast popups
  - `chat:{bookingId}` — live chat messages in booking detail pages
  - `location:{bookingId}` — live provider GPS position during active booking
- Used in:
  - `src/lib/notify.ts` — broadcasts on `user-notifs:{userId}` after notification insert
  - `src/app/api/chat/route.ts` — broadcasts on `chat:{bookingId}` after message insert
  - `src/views/layouts/AppShell.tsx` — subscribes to `user-notifs:{userId}`
  - `src/views/components/chat/ChatBox.tsx` — subscribes to `chat:{bookingId}`
  - `src/views/components/map/LocationSharer.tsx` — broadcasts on `location:{bookingId}`
  - `src/views/components/map/LiveMap.tsx` — subscribes to `location:{bookingId}`

## AI / OCR

**Google Cloud Vision API**
- Purpose: OCR text extraction from government ID photos during provider onboarding
- Endpoint: `https://vision.googleapis.com/v1/images:annotate`
- Config: `GOOGLE_VISION_API_KEY` env var (optional — falls back to manual entry if not set)
- Used in: `src/controllers/idParseController.ts`
- Feature used: `TEXT_DETECTION` — extracts full text then applies heuristic parsing for Philippine ID name/address fields
- Notes: Integration is optional; without the key, providers fill in their name/address manually

## Geolocation / Maps

**OpenStreetMap Nominatim (Reverse Geocoding)**
- Purpose: Convert GPS coordinates to human-readable address during job posting
- Endpoint: `https://nominatim.openstreetmap.org/reverse`
- Config: None (free, no API key required)
- Used in: `src/lib/utils.ts` (`reverseGeocode()`)
- Notes: Free tier; usage policy requires `User-Agent` header (currently set to `barangay-tasks-app`)

**Leaflet + OpenStreetMap Tiles**
- Purpose: Interactive map for job location picking and live provider tracking
- Tile source: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (free OSM tiles)
- Config: None
- Used in: `src/views/components/map/LiveMap.tsx`, `src/views/components/map/LocationPicker.tsx`
- Notes: Leaflet dynamically imported (`next/dynamic` with `ssr: false`) to avoid SSR issues

## Payments (Planned/Stub)

**PayMongo / GCash**
- Purpose: Provider subscription payments via GCash e-wallet
- Status: **Not implemented** — stub only
- Used in: `src/app/provider/subscription/page.tsx` (returns early with "coming soon" toast)
- Schema references: `providers.gcash_number`, `payments.gcash_reference_id` columns exist
- Notes: Cash payment path exists but stores `payment_status: 'failed'` as placeholder; no admin confirmation flow

## CI/CD

**GitHub Actions**
- Purpose: CI pipeline (lint, build checks)
- Config: `.github/workflows/ci.yml`
- Target: Node.js 20

**Vercel**
- Purpose: Production deployment (serverless, edge)
- Config: Standard Next.js Vercel deployment (no `vercel.json` present — uses defaults)

## Environment Variables Summary

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL (Transaction Pooler, port 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin key (bypasses RLS) |
| `GOOGLE_VISION_API_KEY` | No | Google Vision OCR for ID parsing |

---

*Integrations analysis: 2026-03-06*
