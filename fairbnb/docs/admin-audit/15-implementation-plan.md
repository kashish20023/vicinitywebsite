# DELIVERABLE 15 — IMPLEMENTATION PLAN

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Phased Implementation Roadmap & Rollback Strategy  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Phased Execution Order

Implementation is broken down into small, incremental, independently verifiable phases. Each phase can be deployed and tested in isolation without blocking others.

```text
Phase 1: Action Center (Immediate Operational Productivity)
   ↓
Phase 2: Platform Health & Technical Diagnostics
   ↓
Phase 3: Property Health & Listing Completeness Signals
   ↓
Phase 4: User Activity Timeline
   ↓
Phase 5: Operational Analytics Refinements
   ↓
Phase 6: Financial Anomaly Detection
   ↓
Phase 7: Global Command Search
   ↓
Phase 8: Admin Productivity & Keyboard Ergonomics
```

---

## 2. Phase-by-Phase Technical Specifications

---

### Phase 1: Operational Action Center

- **Objective:** Provide a consolidated triage widget on `/admin/dashboard` showing pending items across KYC, Listings, Reels, and Payouts.
- **Files Affected:**
  - Frontend: `src/app/admin/dashboard/page.tsx`, `src/app/admin/dashboard/components/ActionCenter.tsx` (new)
  - Backend: `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin.service.ts`
- **APIs Affected:** `GET /admin/operations/action-center` (new)
- **Database Affected:** None (reads from `Property`, `User`, `ReelReport`, `PayoutRequest`, `Dispute`).
- **Dependencies:** None.
- **Tests Required:** Vitest integration test for `ActionCenter.tsx`; NestJS unit test in `admin.service.spec.ts` for aggregation logic.
- **Risks:** Minimal.
- **Rollback Strategy:** Revert `ActionCenter.tsx` and controller route; zero database impact.

---

### Phase 2: Platform Health & Technical Diagnostics

- **Objective:** Provide server uptime, memory usage, database ping latency, and environment indicators.
- **Files Affected:**
  - Frontend: `src/app/admin/settings/page.tsx`, `src/app/admin/settings/components/PlatformHealthTab.tsx` (new)
  - Backend: `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin.service.ts`
- **APIs Affected:** `GET /admin/system/health` (new)
- **Database Affected:** None (`PrismaService.$queryRaw("SELECT 1")`).
- **Dependencies:** None.
- **Tests Required:** Test health endpoint response structure and latency reporting when database is reachable.
- **Risks:** None.
- **Rollback Strategy:** Disable tab in UI and remove controller method.

---

### Phase 3: Property Health & Listing Completeness

- **Objective:** Display listing quality percentage badges and missing-feature pill warnings on property cards.
- **Files Affected:**
  - Frontend: `src/app/admin/verification/page.tsx`, `src/app/admin/listings/page.tsx`, `src/components/property/PropertyHealthBadge.tsx` (new)
  - Backend: `backend/src/admin/admin.service.ts`
- **APIs Affected:** `GET /admin/properties`, `GET /admin/properties/pending` (response includes calculated `healthScore` and `missingFields`).
- **Database Affected:** None.
- **Dependencies:** None.
- **Tests Required:** Unit tests verifying score calculation against various combinations of missing Wi-Fi, photos, and rules.
- **Risks:** None (deterministic calculation).
- **Rollback Strategy:** Strip the calculated fields from response.

---

### Phase 4: User Activity Timeline

- **Objective:** Chronological lifecycle view in user details (account created -> listings -> bookings -> disputes).
- **Files Affected:**
  - Frontend: `src/app/admin/users/page.tsx`, `src/app/admin/users/components/UserTimelineDrawer.tsx` (new)
  - Backend: `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin.service.ts`
- **APIs Affected:** `GET /admin/users/:id/timeline` (new)
- **Database Affected:** None.
- **Dependencies:** None.
- **Tests Required:** Test timeline sorting order (newest first) and event categorization.
- **Risks:** Slow query if user has thousands of records (mitigated by `take: 20` pagination).
- **Rollback Strategy:** Remove drawer UI and controller route.

---

### Phase 5: Operational Analytics Refinements

- **Objective:** Time-series comparisons (MoM, YoY) on revenue, GBV, and average stay duration.
- **Files Affected:**
  - Frontend: `src/app/admin/analytics/page.tsx`
  - Backend: `backend/src/admin/admin.service.ts`
- **APIs Affected:** `GET /admin/analytics/overview` (enhanced query params for comparison mode).
- **Database Affected:** None.
- **Dependencies:** None.
- **Tests Required:** Benchmark aggregation queries over 10,000 synthetic bookings.
- **Risks:** Heavy SQL aggregation (mitigated by `group by` date truncation).
- **Rollback Strategy:** Revert comparison flag.

---

### Phase 6: Financial Anomaly Detection

- **Objective:** Warning alerts for payment failure spikes and excessive cancellations.
- **Files Affected:**
  - Frontend: `src/app/admin/finance/page.tsx`, `src/app/admin/dashboard/page.tsx`
  - Backend: `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin.service.ts`
- **APIs Affected:** `GET /admin/operations/anomalies` (new)
- **Database Affected:** None.
- **Dependencies:** None.
- **Tests Required:** Validate threshold trigger logic when simulated failed payments exceed 15%.
- **Risks:** False positive alerts (tuned with sensible baseline thresholds).
- **Rollback Strategy:** Disable anomaly banner in UI.

---

### Phase 7: Global Multi-Entity Command Search

- **Objective:** Keyboard-driven Command Palette (`Cmd + K`) querying across users, properties, and bookings.
- **Files Affected:**
  - Frontend: `src/components/layout/AdminHeader.tsx`, `src/components/ui/CommandPalette.tsx` (new)
  - Backend: `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin.service.ts`
- **APIs Affected:** `GET /admin/search?q={query}` (new)
- **Database Affected:** Composite non-blocking indexes on `User(name, email)` and `Property(title)`.
- **Dependencies:** None.
- **Tests Required:** End-to-end debounce test and search input sanitizer test.
- **Risks:** High request frequency while typing (mitigated by 300ms frontend debounce and backend throttling).
- **Rollback Strategy:** Revert header search to static input.

---

### Phase 8: Admin Productivity & Keyboard Shortcuts

- **Objective:** Keyboard navigation for high-volume moderation (`A` for Approve, `R` for Reject, `Esc` to close).
- **Files Affected:**
  - Frontend: `src/app/admin/verification/page.tsx`, `src/app/admin/moderation/page.tsx`
  - Backend: None.
- **APIs Affected:** None.
- **Database Affected:** None.
- **Dependencies:** None.
- **Tests Required:** Vitest keydown event handler tests.
- **Risks:** Conflicts with input text fields (mitigated by disabling hotkeys when input/textarea is focused).
- **Rollback Strategy:** Remove keydown listeners.
