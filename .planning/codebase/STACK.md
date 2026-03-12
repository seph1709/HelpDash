# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- TypeScript 5.x - All source files (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- CSS - Global styles (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js 20 (pinned in CI via `.github/workflows/ci.yml`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router, API Routes, Middleware (`next.config.ts`)
- React 19.2.3 - UI rendering (`src/app/**/*.tsx`, `src/views/**/*.tsx`)

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS (`postcss.config.mjs`, `src/app/globals.css`)

**Forms:**
- React Hook Form 7.71.2 - Form state management (`@hookform/resolvers` for Zod integration)
- Zod 4.3.6 - Schema validation and type inference

**Maps:**
- Leaflet 1.9.4 + React Leaflet 5.0.0 - Interactive maps, dynamically imported to avoid SSR issues (`src/views/components/map/`)

**Build/Dev:**
- ESLint 9 with `eslint-config-next` - Linting (`eslint.config.mjs`)
- Drizzle Kit 0.31.9 - Database migration tooling (`drizzle.config.ts`)
- PostCSS with `@tailwindcss/postcss` - CSS processing

**PWA:**
- next-pwa 5.6.0 - Service worker and PWA manifest support (`public/manifest.json`)

## Key Dependencies

**Critical:**
- `drizzle-orm` 0.45.1 - Type-safe ORM for PostgreSQL queries (`src/db/index.ts`, `src/db/schema.ts`)
- `postgres` 3.4.8 - PostgreSQL driver used by Drizzle in serverless/edge mode with `prepare: false`
- `@supabase/supabase-js` 2.97.0 - Supabase JS client for auth, realtime, storage
- `@supabase/ssr` 0.8.0 - Supabase SSR helpers for Next.js cookie-based auth (`src/lib/supabase.ts`, `src/lib/supabase-server.ts`)

**UI Utilities:**
- `lucide-react` 0.575.0 - Icon library
- `clsx` 2.1.1 + `tailwind-merge` 3.5.0 - Conditional class merging via `cn()` helper (`src/lib/utils.ts`)
- `sonner` 2.0.7 - Toast notification system

**Dev Only:**
- `pg` 8.18.0 - PostgreSQL driver used by Drizzle Kit for migrations
- `@types/leaflet` 1.9.21 - TypeScript types for Leaflet

## Configuration

**Environment:**
- Configured via environment variables (`.env` file - not committed)
- Required variables:
  - `DATABASE_URL` - PostgreSQL connection string (Supabase Transaction Pooler, port 6543)
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only, bypasses RLS)
  - `GOOGLE_VISION_API_KEY` - Optional; enables government ID OCR

**Build:**
- `next.config.ts` - Next.js config; remote image patterns for Supabase Storage and Nominatim
- `drizzle.config.ts` - Drizzle ORM config; schema at `src/db/schema.ts`, output at `drizzle/`
- `tsconfig.json` - TypeScript config (standard Next.js setup)
- `postcss.config.mjs` - PostCSS with Tailwind plugin

## Platform Requirements

**Development:**
- Node.js 20
- npm (lockfile present, use `npm ci` for clean installs)
- PostgreSQL access (Supabase project required)

**Production:**
- Vercel (serverless edge deployment via GitHub Actions)
- Supabase for PostgreSQL database, authentication, storage, and realtime

---

*Stack analysis: 2026-03-06*
