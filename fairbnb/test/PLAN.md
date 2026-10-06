# QA Automation & Performance Test Audit Plan

**Run ID**: `run-20260921-1150`  
**Engineer**: Senior QA Automation & Performance Test Engineer  
**Target Repository**: `C:\Users\shubham\fairbnb--new` (Branch `govind-temp`)

---

## 1. Objectives & Scope
Execute an evidence-based, sequential end-to-end quality and performance audit across all implemented modules in FairBnB:
1. **Phase 0 — Discovery & Isolation**:
   - Inventory actual backend endpoints (211 discovered) and frontend routes (81 discovered).
   - Provision isolated disposable PostgreSQL database `fairbnb_qa_audit_run_20260921_1150` with exclusive ownership markers.
   - Launch isolated test backend on port `5010` and frontend on port `3010`.
2. **Phase 1 — Jest, Integration & Builds**:
   - Run backend TypeScript build (`nest build`).
   - Run frontend Turbopack production build (`next build`).
   - Execute all applicable Jest unit, integration, and e2e suites using official package scripts.
   - Document pass/fail counts, duration, and baseline status in `JEST_REPORT.md`.
3. **Phase 2 — API Functionality & Security**:
   - Multi-role authenticated test runner across:
     - Authentication & Session (`/auth/*`)
     - User Management & Roles (`/users/*`, `/admin/users/*`)
     - Property Catalog, Search & Filtering (`/properties/*`)
     - Pricing, Availability & Quotes (`/bookings/quote`, `/properties/:id/availability`)
     - Coupon Engine (Validation, Usage Limits, Expiry, Min Order) (`/coupons/*`)
     - Booking Lifecycle (Creation, Cancellation, Refunds) (`/bookings/*`)
     - Settlements & Payouts (Authorization, 2-recipient execution, Stale revision rejection, Reversals, Webhooks) (`/admin/settlements/*`, `/payouts/*`)
     - Co-Host Agreement & Payout Rules (`/properties/:id/co-hosts/*`, `/co-hosts/*`)
     - Role-Based Access Control (RBAC) & Cross-Tenant Ownership Isolation (Guest accessing admin routes, Host A accessing Host B resources).
   - Document in `API_REPORT.md`.
4. **Phase 3 — Playwright / CDP Browser End-to-End**:
   - Real browser journeys using Google Chrome across Guest, Host, Co-Host, and Admin personas:
     - Journey 1: Guest Authentication & Protected Page Access.
     - Journey 2: Property Search, Filtering, and Details Navigation.
     - Journey 3: Checkout Preview with Coupon Application.
     - Journey 4: Admin Settlement List, Rev #1 Authorization, and Transfer Execution.
     - Journey 5: Host & Co-Host Earnings Verification (asserting simulated flags and zero leakage).
     - Journey 6: Unauthorized Cross-Role Access (rejection checks).
   - Capture screenshots and evidence into `evidence/` and summarize in `PLAYWRIGHT_REPORT.md`.
5. **Phase 4 — API Latency & Frontend Performance**:
   - Measure 30 warmed samples per representative endpoint across Auth, Properties, Bookings, Coupons, Settlements, and Co-Hosts.
   - Calculate min, p50 (median), p95, and max response times.
   - Bounded concurrency test (concurrency 1 to 5) on representative read endpoints.
   - Measure frontend navigation metrics, lab timings, and console errors.
   - Summarize in `PERFORMANCE_REPORT.md`.
6. **Phase 5 — Cleanup & Final Report**:
   - Verify exclusive database ownership marker.
   - Terminate test backend (PID 30108) and test frontend (PID 9944).
   - Drop isolated test database `fairbnb_qa_audit_run_20260921_1150`.
   - Compile comprehensive `FINAL_REPORT.md` and `CHECKPOINT.md`.

---

## 2. Pass / Fail Criteria
- **PASS**: Meets all requirements, returns expected HTTP status and payload schema, enforces RBAC, preserves data integrity, and produces verifiable evidence.
- **FAIL**: Deviates from specification, returns 500 error, exposes sensitive internals, leaks cross-tenant data, or violates business logic.
- **BLOCKED**: External dependency unavailable (e.g. real Cashfree bank rails without live keys) or previous step failure prevents execution.
- **NOT TESTED**: Explicitly out of scope or skipped.
- **NOT APPLICABLE**: Feature not implemented or disabled by design.
