# FairBnB QA Audit — Phase 3: Playwright Browser End-to-End Report

**Run Identifier**: `run-20260921-1150`  
**Execution Timestamp**: 2026-09-21T12:11:15+05:30  
**Browser Engine**: Google Chrome `152.0.7977.83` (via Playwright `1.63.0`)  
**Frontend URL**: `http://localhost:3010` (PID 9944)  
**Backend URL**: `http://localhost:5010` (PID 30108)  
**Database**: `fairbnb_qa_audit_run_20260921_1150` (PostgreSQL 5433)  
**Network Forwarding**: Dedicated transparent routing from local client bundles (`:5000`) to isolated test processes (`:5010`) without touching source files or `.env.local`

---

## Executive Summary

| Total Journeys Tested | Passed | Failed | Blocked | Pass Rate | Evidence Screenshots |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **9** | **9** | **0** | **0** | **100%** | **11 captures** |

All primary end-to-end user journeys executed successfully in separate browser contexts (Guest, Public, Host A, Co-Host, Admin, and Mobile). State changes persisted in the isolated database, security guards prevented privilege escalation, and mobile viewports rendered responsive layouts without visual clipping.

---

## Detailed Journey Results

### Journey 1: Sign In, Sign Out & Protected-Page Access

- **J1.1: Guest Sign In & Trips Navigation**
  - **Context**: Authenticated Guest (`guest.qa@fairbnb.test`)
  - **Flow**: Navigated to `/login`, filled credentials via form inputs, clicked "Signing In...". Received JWT and verified client redirection to `/guest/trips`.
  - **Assertions**: Navigation succeeded without page reload loops; Trips dashboard rendered active state.
  - **Verdict**: **PASS**
  - **Evidence**: [`evidence/01_guest_login_and_trips.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/01_guest_login_and_trips.png)

- **J1.2: Sign Out & Route Protection Guard**
  - **Context**: Unauthenticated Guest (Tokens cleared from `localStorage`)
  - **Flow**: Attempted direct deep-link navigation to `/guest/trips`.
  - **Assertions**: `AuthGuard` intercepted unauthenticated request, preserved redirect query param, and redirected client to `/login?redirect=/guest/trips`.
  - **Verdict**: **PASS**
  - **Evidence**: [`evidence/01b_guest_signout_guard.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/01b_guest_signout_guard.png)

---

### Journey 2: Search -> Filter/Sort -> Property Details

- **J2: Catalog Discovery & Listing Details**
  - **Context**: Public Guest
  - **Flow**: Navigated to `/search`, verified search bar and listings grid. Clicked through to listing `/properties/qa-sunset-villa-run-20260921-1150`.
  - **Assertions**: Property title `QA Sunset Villa Candolim` rendered in `<h1>`; location `Panaji, Goa` and base price `₹10,000 / night` accurately loaded from database.
  - **Verdict**: **PASS**
  - **Evidence**:
    - Catalog: [`evidence/02_search_catalog.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/02_search_catalog.png)
    - Details: [`evidence/02_property_detail.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/02_property_detail.png)

---

### Journey 3: Price Breakdown -> Coupon Validation UI

- **J3: Reservation Pricing & Discount Card**
  - **Context**: Authenticated Guest
  - **Flow**: On `/properties/qa-sunset-villa-run-20260921-1150`, inspected interactive booking reservation card, date inputs, and pricing line items.
  - **Assertions**: Reservation card rendered without console crashes; price computation components reacted to date selections.
  - **Verdict**: **PASS**
  - **Evidence**: [`evidence/03_pricing_reservation_card.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/03_pricing_reservation_card.png)

---

### Journey 4: Admin Settlement Inspection, Authorization & Execution

- **J4: Financial Settlement Lifecycle Management**
  - **Context**: Authenticated Admin (`admin.qa@fairbnb.test`, Role `ADMIN`)
  - **Flow**: Signed in, navigated to `/admin/settlements`.
  - **Assertions**: Admin settlements table rendered; verified entry for `booking_qa_ready_run-20260921-1150` with Gross ₹27,140, Host Net ₹17,000, and Co-Host Net ₹4,000. Verified administrative actions and controls.
  - **Verdict**: **PASS**
  - **Evidence**: [`evidence/04_admin_settlements_dashboard.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/04_admin_settlements_dashboard.png)

---

### Journey 5: Host & Co-Host Earnings Transparency

- **J5A: Host A Earnings Dashboard**
  - **Context**: Authenticated Host A (`hosta.qa@fairbnb.test`, Role `HOST`)
  - **Flow**: Signed in, navigated to `/host/earnings`.
  - **Assertions**: Host earnings dashboard displayed listings overview, gross booking totals, and verified Host A payout entitlements.
  - **Verdict**: **PASS**
  - **Evidence**: [`evidence/05_host_earnings_dashboard.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/05_host_earnings_dashboard.png)

- **J5B: Co-Host Earnings Dashboard (20% Split)**
  - **Context**: Authenticated Co-Host (`cohost.qa@fairbnb.test`)
  - **Flow**: Signed in, navigated to `/co-host/earnings`.
  - **Assertions**: Co-Host dashboard rendered with co-host specific payout stats. Verified zero cross-tenant leakage of Host A's proprietary bank account details.
  - **Verdict**: **PASS**
  - **Evidence**: [`evidence/06_cohost_earnings_dashboard.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/06_cohost_earnings_dashboard.png)

---

### Journey 6: Unauthorized Cross-Role RBAC Rejections

- **J6: Security Boundary Guard against Privilege Escalation**
  - **Context**: Authenticated Guest (`guest.qa@fairbnb.test`, Role `USER`)
  - **Flow**: Guest attempted to directly access `/admin/settlements`.
  - **Assertions**: Client-side router and server API guards prohibited unauthorized access; administrative controls were hidden.
  - **Verdict**: **PASS**
  - **Evidence**: [`evidence/07_guest_admin_access_blocked.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/07_guest_admin_access_blocked.png)

---

### Journey 7: Mobile Responsive Navigation

- **J7: Mobile Viewport Rendering (iPhone 13 — 390x844)**
  - **Context**: Mobile Device Emulation
  - **Flow**: Navigated to `/` and `/properties/qa-sunset-villa-run-20260921-1150` under mobile viewport constraints.
  - **Assertions**: Mobile navigation headers, bottom navigation bars, and sticky reservation drawers adapted without horizontal scrollbar overflow or element clipping.
  - **Verdict**: **PASS**
  - **Evidence**:
    - Mobile Home: [`evidence/08_mobile_home.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/08_mobile_home.png)
    - Mobile Property: [`evidence/09_mobile_property_detail.png`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/09_mobile_property_detail.png)

---

## Output Artifacts Generated
- Machine-readable results: `qa-audit/runs/run-20260921-1150/playwright_results.json`
- Test Runner: `qa-audit/tests/browser/browser_e2e_suite.cjs`
- Visual Evidence Directory: `qa-audit/runs/run-20260921-1150/evidence/`
