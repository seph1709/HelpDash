---
phase: 1
slug: security
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — no test runner found in project |
| **Config file** | none — Wave 0 installs if desired (not required for this phase) |
| **Quick run command** | `grep -n "u\.62S" scripts/run-schema.mjs; test ! -f src/app/api/migrate-now/route.ts && echo "SEC-02 PASS"; grep "migrate-now" src/proxy.ts && echo "SEC-02 FAIL" || echo "SEC-02 PASS"` |
| **Full suite command** | Same as quick run + manual curl test against dev server for SEC-03 |
| **Estimated runtime** | ~5 seconds (grep-based) |

---

## Sampling Rate

- **After every task commit:** Run the grep checks for the relevant requirement
- **After every plan wave:** Run all grep checks + manual smoke test of notifications route
- **Before `/gsd:verify-work`:** All grep checks pass + SEC-03 manually confirmed on dev server
- **Max feedback latency:** 5 seconds (grep) / ~2 minutes (manual SEC-03 test)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SEC-01 | grep-inspect | `grep -n "u\.62S\|2406:da18\|69a7:ab14" scripts/run-schema.mjs` → should return empty | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SEC-01 | grep-inspect | `grep "DATABASE_URL_UNPOOLED" scripts/run-schema.mjs` → should return match | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | SEC-02 | shell-check | `test ! -f src/app/api/migrate-now/route.ts && echo PASS || echo FAIL` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | SEC-02 | grep-inspect | `grep "migrate-now" src/proxy.ts` → should return empty | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | SEC-03 | manual | Authenticated POST with valid bookingId where caller is NOT a participant → must return 403 | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 1 | SEC-03 | manual | Authenticated POST with valid bookingId where caller IS a participant → must succeed (200) | ❌ W0 | ⬜ pending |
| 1-03-03 | 03 | 1 | SEC-03 | manual | Authenticated POST without bookingId → must succeed (system-level notification path unchanged) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework installation required for this phase. All SEC-01 and SEC-02 verifications are grep/shell checks that run without a test runner. SEC-03 requires a live dev server.

*Existing infrastructure covers all phase requirements (grep-based inspection + manual dev server).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-participant caller receives 403 from `/api/notifications` | SEC-03 | Requires live Supabase with seeded booking data; mocking service role client is disproportionate for this phase | 1. Start dev server. 2. Log in as User A. 3. POST to `/api/notifications` with a `bookingId` where User A is NOT client or provider. 4. Expect 403. |
| Participant caller succeeds | SEC-03 | Same reason | 1. Start dev server. 2. Log in as the client or provider of a real booking. 3. POST to `/api/notifications` with that `bookingId`. 4. Expect 200. |
| System notification (no bookingId) still works | SEC-03 | Regression guard | POST to `/api/notifications` with no `bookingId`. Expect 200. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
