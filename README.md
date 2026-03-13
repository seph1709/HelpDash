# HelpDash 🛠️

> **Barangay-level on-demand service marketplace, Philippines.**
> Connect clients with verified local service providers — fast, safe, and cashless.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Goals & Success Metrics](#goals--success-metrics)
- [User Personas](#user-personas)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Project Overview

**HelpDash** is a progressive web application (PWA) that connects City residents  with nearby, verified freelance service providers at the barangay level. Whether you need a plumber at 2am or someone to fix your aircon before the summer heat, HelpDash gets you matched in minutes.

This project follows the **BMAD (Breakthrough Method of Agile AI-Driven Development)** methodology — iterative, story-driven, and AI-assisted from inception to deployment.

---

## Problem Statement

> Filipino homeowners and small businesses struggle to find trustworthy, nearby freelance workers quickly. Existing platforms are either too general, too expensive, or require lengthy vetting. Meanwhile, skilled workers in local barangays lack visibility and a reliable way to find paid work consistently.

**Core pain points:**
- ❌ No reliable way to find vetted local tradespeople fast
- ❌ Cash-only transactions with no paper trail
- ❌ No accountability for no-shows or poor quality work
- ❌ Skilled workers have no digital storefront or income consistency

---

## Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Fast matching | Booking confirmed within 15 minutes of job post |
| Trust & safety | >80% of providers are ID-verified |
| Retention | >60% client rebooking rate within 30 days |
| Provider income | Avg provider earns 3+ jobs/week |
| Payment adoption | >70% of transactions via GCash |

---

## User Personas

### 🏠 Maria — The Client
- **Who:** Homeowner, 35–55,  City resident
- **Goal:** Find a reliable handyman/cleaner/etc. fast, without cold-calling strangers
- **Pain:** Doesn't know who to trust; tired of asking neighbors for recommendations
- **Key flows:** Post job → browse providers → book → pay → rate

### 🔧 Bong — The Provider
- **Who:** Skilled tradesperson, 25–45, looking for consistent income
- **Goal:** Find jobs nearby without heavy marketing; build a reputation
- **Pain:** Irregular income; no platform to showcase skills; no-show clients waste time
- **Key flows:** Onboard → browse job feed → apply → accept booking → complete → get paid

---

## Key Features

### For Clients
- 📝 **Post a Job** — describe the task, set budget, add photos/voice note, pick urgency (ASAP or scheduled)
- 🗺️ **Live Map** — see available providers near you in real time
- 📅 **Browse Providers** — filter by skill, rating, availability, and barangay
- 💬 **In-App Chat** — communicate directly once a booking is confirmed
- 🔔 **Notifications** — real-time updates on booking status
- ⭐ **Rate & Review** — score providers after job completion
- ⚖️ **Dispute Resolution** — raise disputes with photo evidence

### For Providers
- 🪪 **Onboarding & ID Verification** — AI-parsed government ID for trust building
- 📋 **Job Feed** — browse open jobs filtered by skill and distance
- 🚀 **Priority Access** — premium subscribers see new jobs 24h before free tier
- 📍 **Location Sharing** — share live ETA/location with the client
- 💰 **GCash / Cash Payments** — receive payments digitally or in cash
- 📊 **Dashboard** — track earnings, completed jobs, and ratings
- 🔄 **Availability Toggle** — go online/offline with a single tap

### Platform
- 📱 **PWA** — installable, works offline, push notifications
- 🔐 **Supabase Auth** — secure email/password login + session management
- 🤖 **AI ID Parsing** — automatically extract name and address from uploaded ID photos

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 16 App                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  (auth)     │  │  (client)    │  │  provider  │  │
│  │  /login     │  │  /dashboard  │  │  /dashboard│  │
│  │  /register  │  │  /bookings   │  │  /job-feed │  │
│  └─────────────┘  │  /post-job   │  │  /bookings │  │
│                   │  /providers  │  │  /profile  │  │
│                   └──────────────┘  └────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              API Routes (/api/*)             │   │
│  │  auth · jobs · bookings · notifications      │   │
│  │  providers · chat · id-parse · migrate       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Controllers │  │  Models   │  │    Views    │  │
│  │  (business   │  │ (Drizzle  │  │ (React +    │  │
│  │   logic)     │  │  ORM)     │  │  Tailwind)  │  │
│  └──────────────┘  └───────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
              │                    │
     ┌────────┴────────┐  ┌────────┴────────┐
     │  Supabase Auth  │  │  PostgreSQL DB  │
     │  (sessions,     │  │  (Drizzle ORM + │
     │   storage)      │  │   migrations)   │
     └─────────────────┘  └─────────────────┘
```

**Pattern:** The app follows an MVC-inspired structure within Next.js App Router:
- **Models** (`src/models/`) — raw DB queries via Drizzle ORM
- **Controllers** (`src/controllers/`) — business logic, validation, orchestration
- **Views** (`src/views/`) — reusable UI components
- **App routes** (`src/app/`) — page and API route handlers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | Custom (Lucide icons, Sonner toasts) |
| Forms | React Hook Form + Zod |
| Maps | Leaflet + React Leaflet |
| Database | PostgreSQL (via Supabase) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (SSR) |
| Storage | Supabase Storage |
| Payments | GCash (manual reference) / Cash |
| PWA | next-pwa |
| Hosting | Vercel (recommended) |

---

## Data Model

```
users ──────────────────── providers (1:1)
  │                            │
  ├── jobs (1:N)               ├── bookings (1:N)
  │     │                      └── subscriptions (1:N)
  │     └── bookings (1:N)
  │             │
  ├── bookings  ├── payments (1:N)
  │   (client)  ├── ratings (1:N)
  │             ├── disputes (1:N)
  │             └── chat_messages (1:N)
  │
  └── notifications (1:N)
```

### Key Entities

| Entity | Description |
|--------|-------------|
| `users` | All platform users; `role` = `client` \| `provider` \| `both` |
| `providers` | Extended profile for provider-role users (skills, rates, ID verification) |
| `jobs` | Service requests posted by clients; expires after 24h |
| `bookings` | Confirmed match between a client job and a provider |
| `payments` | GCash or cash payment records tied to a booking |
| `ratings` | Bidirectional post-job ratings |
| `disputes` | Escalations with photo evidence |
| `notifications` | Real-time in-app alerts |
| `chat_messages` | Per-booking messaging thread |
| `subscriptions` | Provider premium plan records |

### Job Status Flow
```
open → matched → in_progress → completed
                             ↘ disputed
  ↘ cancelled
```

### Booking Status Flow
```
pending → accepted → en_route → arrived → in_progress → done
                                                       ↘ disputed
       ↘ cancelled / no_show
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `GET` | `/api/jobs/feed` | Fetch open job listings (provider) |
| `POST` | `/api/jobs/create` | Create a new job (client) |
| `GET/POST` | `/api/notifications` | Get/mark notifications |
| `POST` | `/api/chat` | Send a chat message |
| `POST` | `/api/id-parse` | Parse uploaded government ID via AI |
| `GET` | `/api/providers/profile` | Get provider profile |
| `POST` | `/api/providers/availability` | Toggle provider availability |
| `GET` | `/api/provider/completed-jobs` | Fetch completed job history |
| `POST` | `/api/provider/update-stats` | Recalculate provider stats |
| `POST` | `/api/migrate-now` | Run DB migrations (dev only) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com) project (free tier works)
- PostgreSQL connection string from Supabase

### Installation

```bash
# Clone the repo
git clone https://github.com/seph1709/HelpDash.git
cd HelpDash

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase credentials (see below)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

> ⚠️ Never commit `.env.local` to version control.

---

## Database Setup

This project uses **Drizzle ORM** with migrations.

```bash
# Generate migration files from schema changes
npx drizzle-kit generate

# Apply migrations to your database
npx drizzle-kit migrate

# Or use the in-app migration endpoint (dev only)
# POST /api/migrate-now
```

The full schema is defined in `src/db/schema.ts`.

---

## Development Workflow

HelpDash is built using the **BMAD method** — an AI-assisted agile workflow with clearly defined roles and artifacts:

### Phases

| Phase | Role | Output |
|-------|------|--------|
| 1. Discover | Analyst | Problem statement, user research |
| 2. Define | Product Manager | PRD, user stories, acceptance criteria |
| 3. Design | Architect | System design, data model, API contracts |
| 4. Build | Developer | Feature branches, code, tests |
| 5. Validate | QA | Manual + automated test coverage |
| 6. Ship | DevOps | CI/CD, staging, production deploy |

### Story Format

```
AS A [persona]
I WANT TO [action]
SO THAT [benefit]

ACCEPTANCE CRITERIA:
- [ ] Given ... when ... then ...
```

### Branch Strategy

```
main          ← production
  └── dev     ← integration
        └── feat/[story-id]-short-description
        └── fix/[bug-id]-short-description
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**.

### Manual / Docker

```bash
npm run build
npm start
```

> The app runs on port `3000` by default. Use a reverse proxy (nginx/Caddy) for production HTTPS.

---

## Project Structure

```
HelpDash/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Login & Register pages
│   │   ├── (client)/         # Client-facing pages
│   │   ├── provider/         # Provider-facing pages
│   │   └── api/              # REST API routes
│   ├── controllers/          # Business logic layer
│   ├── db/                   # Drizzle ORM config & schema
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities (Supabase, notifications)
│   ├── models/               # Database query functions
│   ├── types/                # Shared TypeScript types
│   └── views/
│       ├── components/       # Reusable UI components
│       │   ├── booking/
│       │   ├── chat/
│       │   ├── map/
│       │   └── shared/
│       └── layouts/          # App shell / layout wrappers
├── public/                   # Static assets
├── supabase/                 # Supabase config / seed files
├── scripts/                  # Utility scripts
├── drizzle.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Contributing

1. Fork the repo and create your branch from `dev`
2. Follow the BMAD story format when creating features
3. Write clear commit messages: `feat:`, `fix:`, `chore:`, `docs:`
4. Run `npm run lint` before submitting a PR
5. Open a PR against `dev` — not `main`

---

## License

Private — all rights reserved. Contact the repository owner for licensing inquiries.

---
