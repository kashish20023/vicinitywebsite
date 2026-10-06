# Studio I Coworking Platform — API Performance & Benchmark Report

**Run ID**: `2026-09-22-final-run`  
**Benchmark Iterations**: 100 samples per endpoint after warm-up  
**Environment**: Localhost Windows 11, Node.js 22, NestJS 11 + Prisma 6 + PostgreSQL 16  
**Reference CSV**: [API_TIMINGS.csv](file:///c:/Users/shubham/OneDrive/Desktop/studioiwebsite/qa/studio-i/reports/2026-09-22-final-run/API_TIMINGS.csv)

---

## 1. Latency & Timing Summary Table

| Endpoint | Method | Samples | Min (ms) | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Error Rate | Target (p95) | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Health Liveness** | GET | 100 | 12 | 14.8 | 15 | 17 | 17 | 18 | 0.0% | <= 500 ms | **PASS** |
| **Explore Workspaces** | GET | 100 | 13 | 15.6 | 15 | 22 | 28 | 32 | 0.0% | <= 500 ms | **PASS** |
| **Workspace Detail** | GET | 100 | 13 | 15.4 | 15 | 21 | 24 | 29 | 0.0% | <= 500 ms | **PASS** |
| **Floor Live Availability** | GET | 100 | 13 | 16.1 | 16 | 23 | 25 | 31 | 0.0% | <= 800 ms | **PASS** |
| **Price Quote Calculation** | POST | 100 | 14 | 16.8 | 16 | 23 | 28 | 34 | 0.0% | <= 800 ms | **PASS** |
| **Member Bookings Stream** | GET | 100 | 13 | 16.2 | 16 | 23 | 27 | 30 | 0.0% | <= 500 ms | **PASS** |
| **Admin Operations KPI** | GET | 100 | 14 | 19.5 | 16 | 23 | 92 | 104 | 0.0% | <= 800 ms | **PASS** |
| **Admin Finance Summary** | GET | 100 | 13 | 15.2 | 15 | 18 | 23 | 26 | 0.0% | <= 800 ms | **PASS** |

---

## 2. Observations & Analysis

1. **High Throughput & Low Latency**:
   - Every single endpoint exhibited a **p50 between 15 ms and 16 ms**.
   - The highest observed **p95 was 23 ms**, dramatically faster than the engineering target of <= 500 ms - 800 ms.
   - Zero HTTP 5xx responses were observed during the entire 100-sample benchmark run (0.0% error rate).

2. **Database Optimization**:
   - Compound indexes on `Booking(workspaceId, startDateTime, endDateTime, status)` and `InventoryHold(unitId, expiresAt, status)` prevent table scans during interval conflict queries.
   - Native Prisma connection pooling handles concurrent requests without pool exhaustion.
