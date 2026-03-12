# Directory Structure

**Analysis Date:** 2026-03-06

## Top-Level Layout

```
HelpDash/
├── src/                    # All application source code
├── public/                 # Static assets (manifest.json, icons, sw.js)
├── drizzle/                # Drizzle migration output (generated)
├── scripts/                # One-off scripts (run-schema.mjs)
├── .github/workflows/      # CI/CD (ci.yml)
├── next.config.ts          # Next.js config
├── drizzle.config.ts       # Drizzle ORM config
├── tsconfig.json           # TypeScript config
├── eslint.config.mjs       # ESLint flat config
├── postcss.config.mjs      # PostCSS / Tailwind config
└── package.json
```

## Source Tree (`src/`)

```
src/
├── app/                    # Next.js App Router: pages, layouts, API routes
│   ├── (auth)/             # Auth route group — no AppShell
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (client)/           # Client role route group — AppShell, client nav
│   │   ├── layout.tsx      # Auth guard + AppShell wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── BookingActions.tsx   # Client Component (status actions)
│   │   ├── post-job/page.tsx
│   │   ├── providers/page.tsx
│   │   └── notifications/
│   │       ├── page.tsx
│   │       ├── NotificationList.tsx
│   │       └── MarkAllRead.tsx
│   ├── provider/           # Provider role routes (no route group parentheses)
│   │   ├── layout.tsx      # Auth + role guard + AppShell wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── job-feed/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── ApplyButton.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── ProviderBookingActions.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── profile/page.tsx
│   │   └── subscription/page.tsx
│   ├── api/                # API route handlers
│   │   ├── auth/register/route.ts
│   │   ├── chat/route.ts
│   │   ├── id-parse/route.ts
│   │   ├── jobs/
│   │   │   ├── create/route.ts
│   │   │   └── feed/route.ts
│   │   ├── migrate-now/route.ts        # ⚠ Unauthenticated DDL endpoint
│   │   ├── notifications/route.ts
│   │   ├── provider/
│   │   │   ├── completed-jobs/route.ts
│   │   │   └── update-stats/route.ts
│   │   └── providers/
│   │       ├── availability/route.ts
│   │       └── profile/route.ts
│   ├── layout.tsx          # Root layout (fonts, PWA, Toaster)
│   ├── page.tsx            # Root page (redirects via middleware)
│   └── globals.css
├── controllers/            # Business logic layer
│   ├── authController.ts
│   ├── idParseController.ts
│   ├── jobController.ts
│   └── providerController.ts
├── models/                 # Data access layer (Supabase queries)
│   ├── jobModel.ts
│   ├── providerModel.ts
│   └── userModel.ts
├── views/                  # Reusable UI components and layouts
│   ├── components/
│   │   ├── booking/
│   │   │   └── BookingBadgeRow.tsx
│   │   ├── chat/
│   │   │   └── ChatBox.tsx
│   │   ├── map/
│   │   │   ├── LiveMap.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── LocationSharer.tsx
│   │   └── shared/
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── OfflineBanner.tsx
│   │       ├── StarRating.tsx
│   │       └── ToggleSwitch.tsx
│   └── layouts/
│       └── AppShell.tsx
├── lib/                    # Infrastructure utilities
│   ├── supabase.ts         # Browser Supabase client factory
│   ├── supabase-server.ts  # Server + admin Supabase client factories
│   ├── notify.ts           # Notification helper (insert + broadcast)
│   └── utils.ts            # Formatting, Haversine distance, reverse geocode
├── hooks/
│   └── useUser.ts          # Client-side auth hook
├── types/
│   └── index.ts            # All domain interfaces, enums, constants
├── db/
│   ├── schema.ts           # Drizzle table definitions (all tables)
│   └── index.ts            # Drizzle client (postgres driver)
└── proxy.ts                # Middleware: auth redirect + PUBLIC_PATHS list
```

## Key File Locations

| What | Where |
|------|-------|
| Auth middleware / redirects | `src/proxy.ts` (exported as middleware) |
| All domain types | `src/types/index.ts` |
| Database schema | `src/db/schema.ts` |
| Supabase clients | `src/lib/supabase.ts`, `src/lib/supabase-server.ts` |
| Notification dispatch | `src/lib/notify.ts` |
| Geo utilities | `src/lib/utils.ts` |
| Shared UI kit | `src/views/components/shared/` |
| App shell / nav | `src/views/layouts/AppShell.tsx` |
| Client auth guard | `src/app/(client)/layout.tsx` |
| Provider auth guard | `src/app/provider/layout.tsx` |

## Naming Conventions

**Route files:** `page.tsx` / `layout.tsx` / `route.ts` (Next.js App Router conventions)

**Co-located Client Components:** PascalCase noun + role suffix, e.g., `BookingActions.tsx`, `ApplyButton.tsx`, `MarkAllRead.tsx` — lives alongside the `page.tsx` it belongs to

**Shared components:** PascalCase noun only (`Button.tsx`, `Card.tsx`, `Badge.tsx`)

**Controllers:** camelCase + `Controller` suffix (`jobController.ts`)

**Models:** camelCase + `Model` suffix (`jobModel.ts`)

**API route segments:** lowercase hyphen-kebab (`/api/provider/update-stats/`)

## Public Assets (`public/`)

```
public/
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (generated by next-pwa)
└── icons/              # App icons for PWA install prompts
```

---

*Structure analysis: 2026-03-06*
