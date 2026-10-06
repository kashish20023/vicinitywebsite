# FairBnB QA Audit — Phase 2: API Functionality & Security Report

**Run Identifier**: `run-20260921-1150`  
**Execution Timestamp**: 2026-09-21T12:05:33+05:30  
**Target Backend**: `http://localhost:5010` (PID 30108)  
**Database**: `fairbnb_qa_audit_run_20260921_1150` (PostgreSQL Port 5433)  
**Provider Mode**: `CASHFREE_ENV=MOCK`, `CASHFREE_PAYOUTS_ENABLED=true` (Zero live credentials, simulated payouts)

---

## Executive Summary

| Total Scenarios Tested | Passed | Failed | Blocked | Pass Rate |
| :--- | :--- | :--- | :--- | :--- |
| **38** | **38** | **0** | **0** | **100%** |

Phase 2 verified endpoint contracts, authentication mechanisms, strict RBAC authorization boundaries, multi-tenant property data isolation, coupon validation business logic, booking availability conflict guards, settlement lifecycle state machines, two-recipient disbursement isolation, and external webhook cryptographic signature verification.

---

## Detailed Results by Category

### 1. Authentication & Session Management

All endpoints were tested with authentic application-issued JWT tokens against `/auth/login` and `/auth/me`.

| # | Test Scenario | Method | Endpoint | Expected | Actual Status | Verdict | Evidence / Notes |
|---|---|---|---|---|---|---|---|
| 1.1 | Admin login with valid credentials | POST | `/auth/login` | 200 | 200 | **PASS** | Valid JWT `accessToken` issued, role `ADMIN` |
| 1.2 | Host A login with valid credentials | POST | `/auth/login` | 200 | 200 | **PASS** | Valid JWT `accessToken` issued, role `HOST` |
| 1.3 | Host B login with valid credentials | POST | `/auth/login` | 200 | 200 | **PASS** | Valid JWT `accessToken` issued, role `HOST` |
| 1.4 | Co-Host login with valid credentials | POST | `/auth/login` | 200 | 200 | **PASS** | Valid JWT `accessToken` issued, role `HOST` |
| 1.5 | Guest login with valid credentials | POST | `/auth/login` | 200 | 200 | **PASS** | Valid JWT `accessToken` issued, role `USER` |
| 1.6 | Invalid password rejection | POST | `/auth/login` | 401 | 401 | **PASS** | `{"statusCode": 401, "message": "Invalid credentials"}` |
| 1.7 | Non-existent email rejection | POST | `/auth/login` | 401 | 401 | **PASS** | `{"statusCode": 401, "message": "Invalid credentials"}` |
| 1.8 | Protected profile access | GET | `/auth/me` | 200 | 200 | **PASS** | Returns authenticated profile `guest.qa@fairbnb.test` |
| 1.9 | Missing token protection | GET | `/auth/me` | 401 | 401 | **PASS** | `{"statusCode": 401, "message": "Unauthorized"}` |
| 1.10 | Tampered token protection | GET | `/auth/me` | 401 | 401 | **PASS** | `{"statusCode": 401, "message": "Unauthorized"}` |

---

### 2. Role-Based Access Control (RBAC)

Tested role barriers separating administrative controls from unprivileged guests and hosts.

| # | Test Scenario | Method | Endpoint | Role Tested | Expected | Actual | Verdict |
|---|---|---|---|---|---|---|---|
| 2.1 | Admin access to administration metrics | GET | `/admin/overview` | `ADMIN` | 200 | 200 | **PASS** |
| 2.2 | Guest access blocked to administration metrics | GET | `/admin/overview` | `USER` | 403 | 403 | **PASS** |
| 2.3 | Host access blocked to administration metrics | GET | `/admin/overview` | `HOST` | 403 | 403 | **PASS** |
| 2.4 | Admin access to settlements management | GET | `/admin/settlements` | `ADMIN` | 200 | 200 | **PASS** |
| 2.5 | Guest access blocked to settlements management | GET | `/admin/settlements` | `USER` | 403 | 403 | **PASS** |

---

### 3. Property Catalog & Multi-Tenant Data Isolation

Tested public property discovery and cross-tenant boundary isolation between Host A and Host B.

| # | Test Scenario | Method | Endpoint | Expected | Actual | Verdict | Evidence / Notes |
|---|---|---|---|---|---|---|---|
| 3.1 | Public catalog discovery | GET | `/properties` | 200 | 200 | **PASS** | Returns published listings array |
| 3.2 | Property details by slug | GET | `/properties/:slug` | 200 | 200 | **PASS** | Returns `QA Sunset Villa Candolim` |
| 3.3 | Non-existent property slug | GET | `/properties/:slug` | 404 | 404 | **PASS** | `{"statusCode": 404, "message": "Property not found"}` |
| 3.4 | Host A views owned inventory | GET | `/properties/my-properties` | 200 | 200 | **PASS** | Host A sees `prop_qa_villa_run-20260921-1150` |
| 3.5 | Host B tenant boundary leak check | GET | `/properties/my-properties` | 200 | 200 | **PASS** | Host B does **not** see Host A's villa (Zero cross-leakage) |
| 3.6 | Cross-tenant mutation rejection | PATCH | `/properties/:id` | 403/404 | 403 | **PASS** | Host B modifying Host A's property rejected with 403 Forbidden |

---

### 4. Coupon Engine Business Logic

Tested validation rules including minimum order amounts, expiration dates, and usage limits.

| # | Test Scenario | Method | Endpoint | Expected | Actual | Verdict | Business Rule Observed |
|---|---|---|---|---|---|---|---|
| 4.1 | Valid flat discount coupon | POST | `/coupons/validate` | 200/201 | 201 | **PASS** | `QAFLAT500` applied flat ₹500 discount on ₹10,000 order |
| 4.2 | Order amount below minimum threshold | POST | `/coupons/validate` | 400 | 400 | **PASS** | Order ₹1,500 < minimum ₹2,000 correctly rejected |
| 4.3 | Expired coupon rejection | POST | `/coupons/validate` | 400 | 400 | **PASS** | `QAEXPIRED` (validUntil in past) rejected with 400 |
| 4.4 | Max usage limit reached | POST | `/coupons/validate` | 400 | 400 | **PASS** | `QAMAXED` (`timesUsed >= usageLimit`) rejected with 400 |
| 4.5 | Admin coupon creation | POST | `/coupons` | 201 | 201 | **PASS** | `ADMIN` role creates valid promotional coupon |
| 4.6 | Guest coupon creation blocked | POST | `/coupons` | 403 | 403 | **PASS** | `USER` role prevented from provisioning unauthorized discounts |

---

### 5. Booking Availability & Conflicts

| # | Test Scenario | Method | Endpoint | Expected | Actual | Verdict | Observations |
|---|---|---|---|---|---|---|---|
| 5.1 | Pricing quote calculation | POST | `/bookings/quote` | 200 | 200 | **PASS** | Accurate base, cleaning, service fee, and tax breakdown |
| 5.2 | Inverted checkout date check | POST | `/bookings/quote` | `available: false` | `available: false` | **PASS** | Returns `{ available: false, reason: 'CHECKOUT_MUST_BE_AFTER_CHECKIN' }` |
| 5.3 | Overlapping double-booking conflict | POST | `/bookings` | 400/409 | 400 | **PASS** | Dates overlapping with existing booking rejected (`Dates not available`) |

---

### 6. Settlement Engine & Payout Route Security

Financial state machine and two-recipient disbursement pipeline verification.

| # | Test Scenario | Method | Endpoint | Expected | Actual | Verdict | Financial Pipeline Validation |
|---|---|---|---|---|---|---|---|
| 6.1 | Unapproved execution guard | POST | `/admin/settlements/:id/execute` | 409 | 409 | **PASS** | Status `READY` rejected: cannot execute before admin authorization |
| 6.2 | Admin authorization | POST | `/admin/settlements/:id/authorize` | 201 | 201 | **PASS** | Revision #1 authorized; settlement transitions `READY` -> `APPROVED` |
| 6.3 | Execution of approved settlement | POST | `/admin/settlements/:id/execute` | 201 | 201 | **PASS** | **Dispatches exactly 2 transfer intents**: Host (₹17,000) & Co-Host (₹4,000). Platform & Tax retained as accounting allocations with zero external disbursement calls |
| 6.4 | Duplicate execution prevention | POST | `/admin/settlements/:id/execute` | 409 | 409 | **PASS** | Re-executing `SETTLED` revision safely blocked with 409 Conflict |
| 6.5 | Cross-recipient earnings isolation | GET | `/payouts/me/bookings/:id` | 403/404 | 403 | **PASS** | Host B denied access to Host A's payout statement |
| 6.6 | Co-Host entitlement access | GET | `/payouts/me/bookings/:id` | 200 | 200 | **PASS** | Co-Host accesses their own 20% entitlement (₹4,000) |

---

### 7. Cashfree Webhook Security & HMAC Verification

| # | Test Scenario | Method | Endpoint | Expected | Actual | Verdict | Cryptographic Security |
|---|---|---|---|---|---|---|---|
| 7.1 | Missing HMAC signature header | POST | `/payouts/cashfree/webhook` | 400 | 400 | **PASS** | Rejected with `Missing signature or timestamp header` |
| 7.2 | Tampered / forged HMAC signature | POST | `/payouts/cashfree/webhook` | 400 | 400 | **PASS** | Cryptographic mismatch rejected with 400 Bad Request |

---

## Output Artifacts Generated
- Machine-readable results: `qa-audit/runs/run-20260921-1150/api_test_results.json`
- Test Runner: `qa-audit/tests/api/api_test_suite.cjs`
