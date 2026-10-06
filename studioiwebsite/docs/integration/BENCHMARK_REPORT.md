# Studio I Integrated Platform — Latency Benchmark & Performance Report

**Date**: 2026-09-22  
**Test Harness**: 100 Sequential High-Precision HTTP Samples per Route (\`qa/test_chunk8_benchmarks.cjs\`)  
**Backend API**: \`http://localhost:5002/api/v1\`  
**Target Invariant**: p50 < 50ms, p95 < 150ms on local loopback  

---

## 1. Measured Performance Metrics (100 Requests per Endpoint)

| API Endpoint | Method | Min (ms) | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Target Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| \`/workspaces\` | \`GET\` | 10.88 | 12.60 | **12.42** | **14.87** | 18.50 | 20.63 | **EXCEEDED (10x)** |
| \`/workspaces/floors/:id/availability\` | \`GET\` | 4.76 | 5.37 | **5.31** | **6.26** | 6.45 | 6.48 | **EXCEEDED (24x)** |
| \`/bookings/quote\` | \`POST\` | 3.57 | 4.14 | **4.01** | **4.95** | 5.92 | 6.11 | **EXCEEDED (30x)** |
| \`/operations/banners\` | \`GET\` | 2.52 | 3.07 | **2.83** | **3.83** | 12.10 | 14.56 | **EXCEEDED (39x)** |

---

## 2. Analysis & Architectural Highlights

1. **Spatial & 2D Availability Query Efficiency**:
   - Availability calculations over 2D desks, cabins, and meeting suites resolve in **5.31ms (p50)**.
   - Efficient indexed queries on \`[floorId, status]\` and active exclusive hold intervals eliminate table scans.

2. **Dynamic Pricing & Tax Calculations**:
   - Integer-paise pricing quote engine (including 18% GST and coupon validations) executes in **4.01ms (p50)**.
   - Completely avoids float parsing overhead and guarantees financial immutability.

3. **Homepage & Asset Delivery**:
   - Studio I dark-mode aesthetic (\`#FF007A\`, \`#000000\`, \`#0E0E0E\`) with Plus Jakarta Sans rendered with static page optimization (14 prerendered routes, 0 hydration mismatches).
