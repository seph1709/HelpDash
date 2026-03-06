# HelpDash

## What This Is

HelpDash is a two-sided home service marketplace for the Philippines where homeowners post specific tasks and get instantly matched with the nearest available, vetted provider. Providers are ID-verified and publicly rated. Homeowners can track a provider's live location while en route and coordinate via in-app chat after booking.

## Core Value

Trust — homeowners know who's coming before they arrive, because every provider is ID-verified and carries a real rating from past jobs.

## Requirements

### Validated

<!-- Already built in existing codebase -->

- ✓ User authentication (homeowner & provider sign up / login via Supabase Auth) — existing
- ✓ Role-based dashboards (separate client and provider views with auth guards) — existing
- ✓ Job posting with location, category, and description — existing
- ✓ Provider job feed with proximity-based matching (Haversine distance) — existing
- ✓ Provider applies to job; instant booking acceptance — existing
- ✓ Booking lifecycle management (status tracking for both sides) — existing
- ✓ In-app text chat unlocked after booking confirmed (Supabase Realtime) — existing
- ✓ Realtime push notifications — existing
- ✓ Provider onboarding with government ID upload and OCR parsing — existing
- ✓ Provider ratings and reviews after job completion — existing
- ✓ Real-time location tracking components (LiveMap, LocationSharer) — existing
- ✓ Provider subscription tiers (free/premium, 5-min visibility delay for free) — existing
- ✓ PWA support (install prompt, offline banner) — existing

### Active

<!-- What we're building / fixing in this milestone -->

- [ ] Photo sharing in chat (homeowner and provider can send images)
- [ ] Admin dashboard — ID verification approval, cash subscription confirmation
- [ ] GCash/PayMongo subscription payment integration (currently a stub)
- [ ] Job expiry enforcement (expired jobs filtered from feed, auto-closed)
- [ ] Booking status machine server-side validation (currently UI-only, exploitable)
- [ ] Security hardening (hardcoded credentials, exposed migration endpoint, notification spoofing)
- [ ] Dispute resolution interface (raise, view, and resolve booking disputes)
- [ ] ID verification human review flow (OCR result queued for admin approval, not auto-verified)
- [ ] Auto-confirm booking when provider marks done and client doesn't respond (auto_confirm_at)
- [ ] No-show automation (transition booking to no_show if provider doesn't update status)

### Out of Scope

- Recurring / ongoing service bookings — one-time tasks only for v1
- Bidding / quote system — instant proximity matching only, no price negotiation
- Homeowner-to-provider payments through the platform — payment is off-platform; subscriptions are the only in-app payment
- Mobile native app — web PWA first

## Context

- Stack: Next.js 16 (App Router), TypeScript, Supabase (auth + DB + realtime + storage), Drizzle ORM (migrations), Tailwind CSS, React Leaflet
- Philippines market: barangay-level location, GCash as primary payment channel
- Codebase is brownfield — core booking, chat, and tracking flows are built; primary gaps are security, admin tooling, and payment completion
- Key tech debt: hardcoded DB credentials in `scripts/run-schema.mjs`, unauthenticated `/api/migrate-now` endpoint, in-memory distance filtering (PostGIS needed at scale)

## Constraints

- **Tech stack**: Next.js + Supabase — all new features must fit this stack
- **Payments**: Subscriptions only (provider pays to unlock premium job visibility); job payment is off-platform
- **Verification**: Provider ID verification requires human admin review — OCR alone is not sufficient
- **Geography**: Philippines-focused; location uses barangay granularity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Instant proximity booking (no bidding) | Simplicity — homeowners just post and get matched | — Pending |
| Location tracking auto-starts on job accept | Uber-style UX — no manual opt-in friction for provider | — Pending |
| Chat unlocks after booking confirmed | Prevents spam; both parties are committed before talking | — Pending |
| Chat supports text + photos | Homeowners need to show the problem; providers need to share progress | — Pending |
| Off-platform job payments | Reduces regulatory complexity for v1; subscriptions are the only in-app money flow | — Pending |
| Provider subscription for premium visibility | Monetization model — free providers see jobs 5 min late; premium see immediately | — Pending |

---
*Last updated: 2026-03-06 after initialization*
