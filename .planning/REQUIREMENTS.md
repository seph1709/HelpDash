# Requirements: HelpDash

**Defined:** 2026-03-06
**Core Value:** Trust — homeowners know who's coming before they arrive, because every provider is ID-verified and carries a real rating from past jobs

## v1 Requirements

### Chat & Communication

- [ ] **CHAT-01**: Homeowner and provider can send photos in chat alongside text messages
- [ ] **CHAT-02**: Chat messages show read receipts (visible when the other party has viewed the message)

### Trust & Safety

- [ ] **TRUST-01**: Admin can review uploaded provider IDs and manually approve or reject verification (replaces current OCR auto-approve)
- [ ] **TRUST-02**: Homeowners and providers can raise a dispute on a booking and view its status
- [ ] **TRUST-03**: Booking status transitions are validated server-side (not UI-only, preventing client manipulation)

### Payments & Subscriptions

- [ ] **PAY-01**: Providers can pay for subscriptions via GCash through PayMongo integration (currently a non-functional stub)

### Job Feed & Matching

- [ ] **FEED-01**: Expired jobs (older than 24 hours) are automatically filtered from the provider feed and closed
- [ ] **FEED-02**: Bookings are auto-confirmed if the homeowner does not confirm within the auto_confirm_at window after provider marks done
- [ ] **FEED-03**: Providers can filter the job feed by service category
- [ ] **FEED-04**: Providers can save a preferred max job distance in their profile; the feed only shows jobs within that radius

### Security

- [ ] **SEC-01**: Hardcoded database credentials in `scripts/run-schema.mjs` are moved to environment variables
- [ ] **SEC-02**: The unauthenticated `/api/migrate-now` endpoint is removed or protected behind an admin auth check
- [ ] **SEC-03**: Notification API restricts sending to verified booking participants only (prevents any logged-in user from notifying any other user)

### Admin

- [ ] **ADMIN-01**: Protected admin dashboard for reviewing provider ID verifications and managing subscription activations
- [ ] **ADMIN-02**: Admin can view, suspend, or ban providers from the dashboard

## v2 Requirements

### Feed & Reliability

- **FEED-V2-01**: Chat message history supports pagination (load earlier messages beyond 100-message cap)
- **FEED-V2-02**: No-show automation — booking auto-transitions to no_show if provider does not update status within defined window
- **FEED-V2-03**: Subscription expiry enforced server-side (premium benefits stop when subscription_expires_at passes)

### Payments

- **PAY-V2-01**: Admin can confirm and activate cash subscription payments through the admin panel

### Security

- **SEC-V2-01**: Provider ID photos served via signed URLs from a private Supabase storage bucket (currently potentially public)

### Admin

- **ADMIN-V2-01**: Admin can remove inappropriate job listings from the platform

## Out of Scope

| Feature | Reason |
|---------|--------|
| Recurring / ongoing service bookings | One-time tasks only for v1 |
| Bidding / quote system | Instant proximity matching only; no negotiation |
| Homeowner-to-provider job payments | Off-platform; only provider subscriptions flow through the app |
| Native mobile app | Web PWA first |
| PostGIS spatial indexing | MVP scale is fine with Haversine in-memory; defer to scaling phase |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHAT-01 | TBD | Pending |
| CHAT-02 | TBD | Pending |
| TRUST-01 | TBD | Pending |
| TRUST-02 | TBD | Pending |
| TRUST-03 | TBD | Pending |
| PAY-01 | TBD | Pending |
| FEED-01 | TBD | Pending |
| FEED-02 | TBD | Pending |
| FEED-03 | TBD | Pending |
| FEED-04 | TBD | Pending |
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| ADMIN-01 | TBD | Pending |
| ADMIN-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 15

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after initial definition*
