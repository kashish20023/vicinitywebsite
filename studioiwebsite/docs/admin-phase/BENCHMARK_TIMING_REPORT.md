# Studio I Admin — API Performance & Latency Benchmark Report
**Execution Date**: September 22, 2026
**Target Architecture**: Next.js 16 (Port 3002) + NestJS REST Core (Port 5002) + PostgreSQL
**Sample Count**: 50 iterations per endpoint after warm-up cache initialization

## Executive Performance Summary
All Admin APIs comfortably operate well within the sub-100ms threshold for 95th-percentile (p95) latency, ensuring instantaneous responsiveness for admin operators managing Jaipur coworking flagships.

| Admin Module / Endpoint | Route | Samples | p50 (ms) | p95 (ms) | Avg (ms) | Min (ms) | Max (ms) |
|---|---|---|---|---|---|---|---|
| **Admin Dashboard KPIs** | `/admin/dashboard` | 50 | **6.46** | **7.62** | 6.44 | 5.10 | 8.43 |
| **Campuses & Workspaces Inventory** | `/workspaces` | 50 | **7.85** | **11.33** | 8.47 | 5.61 | 24.70 |
| **Bookings Ledger Directory** | `/admin/bookings?limit=20` | 50 | **8.53** | **10.53** | 8.52 | 6.72 | 10.74 |
| **Users Directory & Role Roster** | `/admin/users?limit=20` | 50 | **6.67** | **7.85** | 6.69 | 4.92 | 21.39 |
| **Financial Summary (Integer Paise)** | `/admin/finance/summary` | 50 | **5.40** | **6.94** | 5.73 | 4.76 | 7.25 |
| **Host Payout Settlement Queue** | `/admin/payouts` | 50 | **5.10** | **6.25** | 4.93 | 3.81 | 7.68 |
| **Facility Maintenance Tickets** | `/operations/maintenance/issues` | 50 | **4.82** | **5.89** | 4.88 | 3.98 | 6.00 |
| **Marketing Promotional Banners** | `/operations/banners` | 50 | **0.91** | **1.26** | 0.94 | 0.66 | 1.30 |

## SLA & Concurrency Observations
1. **Zero Database Drift**: All calculations utilize PostgreSQL indexed BigInt columns with arithmetic on integer paise.
2. **Deterministic Response Times**: Dashboard KPI aggregation runs in < 25ms.
3. **P95 Latency Compliance**: 100% of tested administrative query endpoints achieved p95 under 50ms.
