# Studio I Coworking Platform — API & Runtime Performance Report
**Execution Timestamp:** 2026-09-22T09:04:11.748Z  
**Environment:** Local Development (PostgreSQL 16, NestJS 11, Next.js 16)  
**Sample Window:** 100 Samples Per Endpoint (Total: 800 HTTP Samples)

---

## 1. Executive Summary
All core operational routes demonstrate sub-50ms median (p50) latency, with sub-100ms 95th percentile (p95) response times across catalog discovery, floor availability calculation, authoritative pricing quotes, and admin dashboards. Zero HTTP errors were observed during benchmark runs (0.0% error rate).

---

## 2. Benchmark Latency Measurements (100 Samples Each)

| Endpoint | Method | Samples | Min (ms) | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Error Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Health Liveness Probe** | `GET` | 100 | 1 | 11.66 | **15** | **17** | 18 | 18 | `0.0%` |
| **Explore Workspaces Catalog** | `GET` | 100 | 7 | 15.41 | **16** | **21** | 28 | 28 | `0.0%` |
| **Workspace Detail by Slug** | `GET` | 100 | 10 | 16.86 | **16** | **27** | 44 | 44 | `0.0%` |
| **Floor Plan Live Availability** | `GET` | 100 | 9 | 16.73 | **16** | **27** | 28 | 28 | `0.0%` |
| **Authoritative Price Quote Calculation** | `POST` | 100 | 7 | 15.27 | **16** | **20** | 34 | 34 | `0.0%` |
| **Member Bookings Stream** | `GET` | 100 | 7 | 15.62 | **16** | **20** | 23 | 23 | `0.0%` |
| **Admin KPI Dashboard** | `GET` | 100 | 6 | 15.32 | **16** | **18** | 19 | 19 | `0.0%` |
| **Admin Financial Reconciliation** | `GET` | 100 | 5 | 15.34 | **16** | **19** | 22 | 22 | `0.0%` |

---

## 3. Frontend SSR Route Verification (HTTP 200 OK)

All 12 Next.js frontend routes were exercised via HTTP SSR requests:

| Route Path | Type | HTTP Status | Verdict |
| :--- | :---: | :---: | :---: |
| `/` | SSR / Client Component | 200 | ✅ Verified OK |
| `/explore` | SSR / Client Component | 200 | ✅ Verified OK |
| `/workspaces/lehariya-jaipur` | SSR / Client Component | 200 | ✅ Verified OK |
| `/workspaces/horizon-jaipur` | SSR / Client Component | 200 | ✅ Verified OK |
| `/checkout` | SSR / Client Component | 200 | ✅ Verified OK |
| `/my-bookings` | SSR / Client Component | 200 | ✅ Verified OK |
| `/admin` | SSR / Client Component | 200 | ✅ Verified OK |
| `/admin/spaces` | SSR / Client Component | 200 | ✅ Verified OK |
| `/admin/spaces/a6e921cb-2d1d-4d83-86c4-781d7694ec96/floor-plan` | SSR / Client Component | 200 | ✅ Verified OK |
| `/admin/bookings` | SSR / Client Component | 200 | ✅ Verified OK |
| `/admin/finance` | SSR / Client Component | 200 | ✅ Verified OK |
| `/admin/users` | SSR / Client Component | 200 | ✅ Verified OK |

---

## 4. Concurrency Invariant & Double-Booking Verification
- **Test Condition:** 20 distinct synthetic authenticated users simultaneously attempting to hold the exact same desk unit (`LH-01-D02`) within the same second (`Promise.all`).
- **Observed Behavior:**
  - Successful Holds: **1** (HTTP 201 Created)
  - Conflicting Holds Safely Blocked: **19** (HTTP 409 Conflict)
  - Invariant Violation Rate: **0.00%**
- **Architectural Safeguard:** PostgreSQL advisory locking & transactional isolation on `InventoryHold` ensures strict atomicity.
