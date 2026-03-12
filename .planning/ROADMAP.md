# Roadmap: HelpDash

## Overview

HelpDash has a working core — booking, chat, tracking, and provider onboarding all exist. This milestone closes the gap between "works in dev" and "trustworthy in production": sealing security holes first, then hardening business logic, building admin tooling, improving the job feed, and finally completing payments and chat enhancements.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security** - Seal known vulnerabilities before any new features ship (completed 2026-03-06)
- [ ] **Phase 2: Trust & Safety** - Server-side booking validation, ID review flow, and dispute interface
- [ ] **Phase 3: Admin** - Protected admin dashboard for ID verification and provider management
- [ ] **Phase 4: Feed & Automation** - Job expiry, auto-confirm, category filter, and distance preference
- [ ] **Phase 5: Payments & Chat** - GCash/PayMongo subscription integration and chat enhancements

## Phase Details

### Phase 1: Security
**Goal**: Known vulnerabilities are eliminated so the platform is safe to expose to real users
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Database credentials are no longer embedded in source code; `scripts/run-schema.mjs` reads from environment variables
  2. The `/api/migrate-now` endpoint returns 403 or does not exist for unauthenticated callers
  3. The notification API rejects requests where the sender is not a confirmed participant of the referenced booking
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Move hardcoded DB credentials to env vars; sync supabase/schema.sql (SEC-01)
- [ ] 01-02-PLAN.md — Delete unauthenticated /api/migrate-now route and clean PUBLIC_PATHS (SEC-02)
- [ ] 01-03-PLAN.md — Add booking-participant guard to /api/notifications route (SEC-03)

### Phase 2: Trust & Safety
**Goal**: Booking integrity is enforced on the server and both parties have recourse when things go wrong
**Depends on**: Phase 1
**Requirements**: TRUST-01, TRUST-02, TRUST-03
**Success Criteria** (what must be TRUE):
  1. Booking status transitions (accept, complete, cancel) are rejected by the server if they violate the allowed state machine — a client cannot manipulate status via a crafted request
  2. A homeowner or provider can raise a dispute on a booking and see its current status in their booking detail view
  3. Provider ID verification is no longer auto-approved by OCR; uploaded IDs are queued for human admin review, and the provider's verified flag is only set after an admin approves
**Plans**: TBD

Plans:
- [ ] 02-01: Implement server-side booking status machine validation (TRUST-03)
- [ ] 02-02: Build dispute creation and status view for homeowners and providers (TRUST-02)
- [ ] 02-03: Replace OCR auto-approve with admin review queue for provider ID verification (TRUST-01)

### Phase 3: Admin
**Goal**: An admin can review provider ID submissions and take moderation actions from a protected dashboard
**Depends on**: Phase 2
**Requirements**: ADMIN-01, ADMIN-02
**Success Criteria** (what must be TRUE):
  1. An admin user can log in and access a dashboard route that is inaccessible to homeowners and providers
  2. The admin dashboard lists pending ID verification submissions; the admin can approve or reject each one, updating the provider's verified status
  3. The admin can view a provider profile and suspend or ban the account, preventing them from accessing the platform
**Plans**: TBD

Plans:
- [ ] 03-01: Create protected admin route group with admin role auth guard and dashboard shell (ADMIN-01)
- [ ] 03-02: Build ID verification review UI — list pending submissions, approve/reject actions (ADMIN-01)
- [ ] 03-03: Add provider suspension and ban controls to admin dashboard (ADMIN-02)

### Phase 4: Feed & Automation
**Goal**: The job feed is accurate and self-managing — stale jobs disappear, auto-confirm runs on schedule, and providers can filter by what matters to them
**Depends on**: Phase 2
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04
**Success Criteria** (what must be TRUE):
  1. Jobs older than 24 hours no longer appear in the provider feed and are marked closed — verified by checking that a job created 25+ hours ago is absent from the feed
  2. A booking where the homeowner has not confirmed completion within the auto_confirm_at window is automatically transitioned to confirmed
  3. A provider can select one or more service categories on the job feed page and see only jobs matching those categories
  4. A provider can save a maximum job distance in their profile; the feed then only shows jobs within that radius
**Plans**: TBD

Plans:
- [ ] 04-01: Implement job expiry enforcement — filter and auto-close jobs older than 24 hours (FEED-01)
- [ ] 04-02: Implement auto-confirm booking when homeowner does not respond within auto_confirm_at window (FEED-02)
- [ ] 04-03: Add category filter UI and query to provider job feed (FEED-03)
- [ ] 04-04: Add max distance preference to provider profile and apply to feed query (FEED-04)

### Phase 5: Payments & Chat
**Goal**: Providers can pay for subscriptions via GCash, and the chat supports photos and read receipts
**Depends on**: Phase 3
**Requirements**: PAY-01, CHAT-01, CHAT-02
**Success Criteria** (what must be TRUE):
  1. A provider can initiate a subscription payment via GCash through PayMongo; a successful payment activates their premium tier
  2. A homeowner or provider can send a photo in an active booking chat; the image is displayed inline in the chat thread
  3. Chat messages show a read receipt indicator that updates when the other party has viewed the message
**Plans**: TBD

Plans:
- [ ] 05-01: Integrate PayMongo GCash payment for provider subscriptions (PAY-01)
- [ ] 05-02: Add photo upload and inline image display to chat (CHAT-01)
- [ ] 05-03: Implement read receipts for chat messages (CHAT-02)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security | 3/3 | Complete   | 2026-03-06 |
| 2. Trust & Safety | 0/3 | Not started | - |
| 3. Admin | 0/3 | Not started | - |
| 4. Feed & Automation | 0/4 | Not started | - |
| 5. Payments & Chat | 0/3 | Not started | - |
