# FairBnB QA Audit — Phase 4: API Latency & Frontend Performance Report

**Run Identifier**: `run-20260921-1150`  
**Execution Timestamp**: 2026-09-21T12:11:45+05:30  
**Environment Mode**: Isolated Local QA Environment (`NODE_ENV=production` build mode, isolated DB on port 5433)  
**Provider Latency Context**: Mock provider contracts active (`CASHFREE_ENV=MOCK`). Latency metrics reflect core database and application processing, excluding third-party network transit delays.

---

## 1. Executive Summary

- **API Responsiveness**: All 6 representative core endpoints demonstrated sub-20ms median (p50) response times under warmed testing conditions.
- **Cold vs. Warmed Differential**: Cold starts for heavier administrative routes (such as `/admin/settlements` and `/payouts/me/bookings/:id`) exhibited initial execution latencies between 34ms and 64ms due to cold database query planning and schema hydration, dropping to 8ms - 18ms once warmed.
- **Throughput & Concurrency Scalability**: Bounded concurrency testing on public catalog discovery (`GET /properties`) demonstrated throughput scaling from **239.3 req/s** at Concurrency 1 up to a peak of **465.9 req/s** at Concurrency 3, with **0% error rates** and p95 latency remaining under 28ms up to Concurrency 5.
- **Frontend Page Performance**: Page loads across core desktop views (Home, Search, Details, Admin Settlements) achieved sub-350ms DOMContentLoaded timings with zero uncaught console crashes.

---

## 2. API Response Timing Benchmark (30 Warmed Samples per Route)

| Endpoint | Method | Role / Scenario | Cold Latency | Warmed Min | Warmed p50 (Median) | Warmed p95 | Warmed Max | Avg Payload | Success / Error |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/me` | `GET` | Authenticated Guest Session | 4.11 ms | 3.24 ms | **3.54 ms** | 4.82 ms | 5.83 ms | 623 B | 30 / 0 |
| `/properties` | `GET` | Public Catalog Discovery | 5.76 ms | 3.84 ms | **5.22 ms** | 10.54 ms | 10.86 ms | 3,076 B | 30 / 0 |
| `/properties/:slug` | `GET` | Public Listing Details | 16.93 ms | 5.03 ms | **6.86 ms** | 18.60 ms | 19.23 ms | 1,461 B | 30 / 0 |
| `/bookings/quote` | `POST` | Pricing Breakdown Engine | 9.62 ms | 6.94 ms | **13.27 ms** | 24.93 ms | 25.07 ms | 329 B | 30 / 0 |
| `/admin/settlements` | `GET` | Financial Administration List | 63.56 ms | 5.62 ms | **8.16 ms** | 12.17 ms | 22.92 ms | 2,453 B | 30 / 0 |
| `/payouts/me/bookings/:id` | `GET` | Host Entitlement Statement | 34.64 ms | 6.86 ms | **18.17 ms** | 27.39 ms | 43.29 ms | 1,679 B | 30 / 0 |

*Note: All samples gathered with a 20ms inter-request interval to ensure realistic warming without artificial CPU starvation.*

---

## 3. Bounded Concurrency Scalability (`GET /properties`)

Bounded concurrency benchmarking was executed starting at Concurrency 1 and incremented to Concurrency 5 to assess thread pool saturation and connection stability.

| Concurrency Level | Total Requests | Completed | Errors | Total Time | Throughput | Latency p50 | Latency p95 | Max Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C=1** | 20 | 20 | 0 | 0.08 s | **239.31 req/s** | 4.09 ms | 4.94 ms | 5.78 ms |
| **C=2** | 40 | 40 | 0 | 0.13 s | **307.98 req/s** | 5.19 ms | 13.73 ms | 14.15 ms |
| **C=3** | 60 | 60 | 0 | 0.13 s | **465.90 req/s** | 5.71 ms | 8.94 ms | 9.57 ms |
| **C=5** | 100 | 100 | 0 | 0.26 s | **381.27 req/s** | 10.38 ms | 27.03 ms | 32.86 ms |

### Concurrency Observations
- No database connection pool exhaustions or timeouts were encountered.
- Concurrency 3 delivered optimal throughput (465.9 req/s) with very low latency variance (p95: 8.94ms).
- At Concurrency 5, throughput normalized around 381 req/s while p95 rose moderately to 27ms, indicating linear CPU scaling on the local host.

---

## 4. Frontend Web Page Performance & Navigation Timings

Lab measurements collected via Chrome Navigation Timing API on production-compiled frontend assets:

| Page Route | Page Purpose | Total Load Time | TTFB | DOMContentLoaded (DCL) | First Contentful Paint (FCP) | Total Network Requests | Console Errors |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Landing / Hero Experience | 298 ms | 5 ms | 284 ms | ~200 ms | 18 | 0 |
| `/search` | Property Catalog & Filters | 208 ms | 5 ms | 197 ms | ~180 ms | 20 | 0 |
| `/properties/[slug]` | Listing Detail & Booking Widget | 342 ms | 28 ms | 329 ms | 260 ms | 20 | 0 |
| `/admin/settlements` | Admin Financial Management | 207 ms | 5 ms | 198 ms | ~190 ms | 50 | 0 |

### Frontend Observations
- Time to First Byte (TTFB) remained exceptionally low (5ms - 28ms) served directly from the local Next.js standalone process.
- No layout thrashing or broken client-side hydration errors occurred during navigation.
- Administrative tables successfully render complex settlement line items in under 210ms total page load time.

---

## Output Artifacts
- Raw Benchmark Samples & Metrics: `qa-audit/runs/run-20260921-1150/performance_data.json`
- Benchmarking Scripts:
  - `qa-audit/scripts/measure_performance.cjs`
  - `qa-audit/scripts/measure_frontend_perf.cjs`
