# Studio I Coworking Platform — Integrated Smoke Test Report

**Run ID**: `2026-09-22-final-run`  
**Execution Date**: September 22, 2026  
**Environment**: Local Isolated Windows 11 (`localhost:3000` Next.js 16 + `localhost:5002/api/v1` NestJS 11 + PostgreSQL 16 `studioi_dev`)  
**Overall Status**: **PASS**

---

## 1. Route Verification Matrix

| Route | Method | Layer | Expected Status | Actual Status | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/explore` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/workspaces/:slug` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/checkout` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/bookings/:id/pass` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/my-bookings` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/admin` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/admin/spaces` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/admin/spaces/:id/floor-plan` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/admin/bookings` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/admin/users` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |
| `/admin/finance` | GET | Frontend SSR | 200 OK | 200 OK | **PASS** |

---

## 2. End-to-End Coworking Lifecycle Verification

1. **Catalog & Search**:
   - `GET /api/v1/workspaces?city=Jaipur` returned Lehariya and Horizon Tower campuses.
   - Filtering by `HOT_DESK`, `DEDICATED_DESK`, `PRIVATE_CABIN` correctly scoped available inventories.

2. **Floor Plan Live Availability**:
   - `GET /api/v1/workspaces/floors/:id/availability` returned units with coordinates, type, and live interval statuses (`AVAILABLE` vs `BOOKED`).
   - Booked unit `LH-01-CAB1` correctly displayed unavailable status.

3. **Anti-Double-Booking Hold Invariant**:
   - Competing 20 holds for the same interval yielded **1 SUCCESS (HTTP 201)** and **19 REJECTIONS (HTTP 409 Conflict)**.
   - Unit row lock and interval query safely guarded race conditions.

4. **Authoritative Pricing & Coupons**:
   - `POST /api/v1/bookings/quote` with `STUDIO10` deducted 10% from base fee.
   - GST (18%) and Security Deposit (2-month minimum commitment for cabins/dedicated desks) computed strictly in integer paise.

5. **Direct Payment & Instant Confirmation**:
   - `POST /api/v1/bookings/create` issued order in `PENDING_PAYMENT`.
   - `POST /api/v1/payments/verify` confirmed booking, stored immutable `BookingFinanceSnapshot`, generated signed `DigitalPass`.

6. **Digital Pass & Reception Check-In**:
   - Digital pass displayed signed token `SI-PASS-XXXXXXXXXXXXXXXX` with interactive QR pattern.
   - `POST /api/v1/access/checkin` and `/access/checkout` verified arrival and exit sessions without errors.

7. **Admin Operations Hub**:
   - Dashboard KPI metrics updated in real-time (`GET /api/v1/admin/dashboard`).
   - Bookings table displayed live reservations with manual check-in and cancel buttons.
   - User directory supported immediate account blocking and unblocking.
   - Financial ledger displayed reconciled gross collections, GST reserves, and disabled-by-default beneficiary simulation.
