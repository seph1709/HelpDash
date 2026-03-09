# HelpDash

A hyperlocal service marketplace connecting residents with verified local taskers for on-demand home services.

---

## Business Context

**Problem:** Residents in Philippine barangays rely on informal word-of-mouth to find plumbers, electricians, cleaners, and other service workers. This creates friction, safety concerns, and no accountability layer for either party.

**Solution:** HelpDash is a two-sided marketplace where clients post jobs and verified providers apply — with real-time tracking, in-app chat, ratings, and dispute resolution built in.

**Target Users:**

- **Clients** — Residents who need household or errands services
- **Providers** — Local skilled workers (taskers) looking for consistent job leads

---

## MVP Features

### For Clients

- Register and post jobs with category, budget, urgency, location, photos, and voice notes
- Browse nearby available providers with ratings and service radius
- Manage bookings through a full lifecycle (pending → accepted → in progress → done)
- In-app chat with assigned provider
- Rate providers and raise disputes

### For Providers

- Onboarding with ID verification (AI-parsed from photo upload)
- Browse job feed with early access for premium subscribers
- Apply to jobs, set ETA, and share live location
- Manage earnings and completed job history
- Free and Premium subscription tiers

### Platform

- Push notifications for booking events
- Real-time live map with provider location sharing
- GCash and cash payment methods
- Progressive Web App (installable, offline-ready)

---

## Architecture

```
HelpDash/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login & Register pages
│   │   ├── (client)/           # Client-facing pages (dashboard, bookings, providers)
│   │   ├── provider/           # Provider-facing pages (job feed, bookings, profile)
│   │   └── api/                # REST API route handlers
│   ├── controllers/            # Business logic (auth, jobs, providers, ID parse)
│   ├── models/                 # Data access layer (user, provider, job)
│   ├── views/
│   │   ├── components/
│   │   │   ├── shared/         # Reusable UI components (Button, Card, Badge, etc.)
│   │   │   ├── map/            # Leaflet map components (LiveMap, LocationPicker)
│   │   │   ├── chat/           # ChatBox component
│   │   │   └── booking/        # Booking-specific components
│   │   └── layouts/            # AppShell layout
│   ├── db/                     # Drizzle ORM config and schema
│   ├── hooks/                  # React hooks (useUser)
│   ├── lib/                    # Supabase client, utilities, notifications
│   └── types/                  # Shared TypeScript types
```

**Data Flow:**

```
Client/Browser
     |
Next.js App Router (SSR + RSC)
     |
API Routes (src/app/api/)
     |
Controllers (business logic)
     |
Models (Drizzle ORM)
     |
PostgreSQL via Supabase
```

**Key Architectural Decisions:**
| Concern | Choice | Reason |
|---|---|---|
| Database | Supabase + PostgreSQL | Managed Postgres with auth and storage built-in |
| ORM | Drizzle ORM | Type-safe, lightweight, no magic |
| Auth | Supabase SSR | Server-side session handling with Next.js |
| Maps | Leaflet + react-leaflet | Open-source, no API key cost |
| Forms | React Hook Form + Zod | Runtime validation with TypeScript inference |
| Styling | Tailwind CSS v4 | Utility-first, fast iteration |
| PWA | next-pwa | Offline support and home screen install |

---

## Tech Stack

| Layer          | Technology                 |
| -------------- | -------------------------- |
| Framework      | Next.js 16 (App Router)    |
| Language       | TypeScript 5               |
| UI             | React 19 + Tailwind CSS v4 |
| Database       | PostgreSQL (Supabase)      |
| ORM            | Drizzle ORM                |
| Auth & Storage | Supabase                   |
| Maps           | Leaflet + react-leaflet    |
| Forms          | React Hook Form + Zod      |
| Icons          | Lucide React               |
| Toasts         | Sonner                     |
| PWA            | next-pwa                   |

---

## Development Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with a PostgreSQL database

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_postgres_connection_string
```

### Installation

```bash
npm install
```

### Database Migration

```bash
npx drizzle-kit push
```

Or via the in-app migration endpoint (development only):

```
GET /api/migrate-now
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Job Categories

| Category         | Description                       |
| ---------------- | --------------------------------- |
| Plumbing         | Pipe repairs, leak fixes          |
| Electrical       | Wiring, outlets, fixtures         |
| Laundry          | Wash and fold services            |
| Cleaning         | Home and office cleaning          |
| Carpentry        | Furniture, repairs, installations |
| AC / Aircon      | Cleaning, repair, installation    |
| Painting         | Interior and exterior             |
| Appliance Repair | TV, ref, washing machine          |
| Moving / Angkat  | Furniture and box moving          |
| Errands / Padala | Delivery and errands              |
| Tutoring         | Academic assistance               |
| Other            | General tasks                     |

---

## Booking Lifecycle

```
pending -> accepted -> en_route -> arrived -> in_progress -> done
                                                           -> disputed
                                                           -> cancelled
                                                           -> no_show
```

---

## Provider Subscription Tiers

| Feature            | Free     | Premium           |
| ------------------ | -------- | ----------------- |
| Job feed access    | Delayed  | Early access      |
| Profile visibility | Standard | Boosted           |
| Subscription       | Free     | Paid (GCash/Cash) |

<!-- ---

## Deployment

The recommended deployment target is [Vercel](https://vercel.com) — it integrates directly with Next.js and supports Edge Functions.

1. Push to your Git repository
2. Import the project in Vercel
3. Set all environment variables from `.env.local`
4. Deploy

For the database, Supabase handles all PostgreSQL hosting and connection pooling. -->
