# DELIVERABLE 2 — ADMIN FEATURE MATRIX

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Admin Feature Inventory & Verification Matrix  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Methodology

Every capability listed below was traced through the entire stack:
$$\text{Frontend UI Route} \longrightarrow \text{API Endpoint} \longrightarrow \text{NestJS Service} \longrightarrow \text{Prisma Schema / Database}$$

Status definitions:
- **Existing:** Present and fully functional end-to-end.
- **Partial:** UI or API exists, but some workflows/capabilities are incomplete.
- **Missing:** Neither UI nor backend API currently implements this feature.
- **Needs Improvement:** Implemented, but suffers from performance, UX friction, or missing granularity.

---

## 2. Complete Admin Feature Matrix

| Feature Module | Route | API Endpoint | DB Model | Role Access | Existing? | Quality | Enhancement Needed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Overview Dashboard** | `/admin/dashboard` | `GET /admin/overview`, `GET /admin/stats` | `User`, `Property`, `Booking` | `ADMIN` | Existing | Good | Consolidated Action Center for quick triaging |
| **User Directory** | `/admin/users` | `GET /admin/users` | `User` | `ADMIN` | Existing | Good | User Activity Timeline & multi-filter search |
| **User Status Override** | `/admin/users` | `PATCH /admin/users/:id/status` | `User` | `ADMIN` | Existing | Good | Add confirmation modal & reason logging |
| **Host Directory** | `/admin/hosts` | `GET /admin/hosts` | `User` | `ADMIN` | Existing | Good | None (Well-developed with Superhost indicators) |
| **Host Detail Profile** | `/admin/hosts/[id]` | `GET /admin/hosts/:id` | `User`, `Property` | `ADMIN` | Existing | Good | Show active payout rules directly |
| **Host Impersonation** | `/admin/hosts` | `POST /admin/hosts/:id/impersonate`| `User` | `ADMIN` | Existing | Excellent | Add audit logging for session start/stop |
| **Co-Host Supervision** | `/admin/co-hosts` | `GET /admin/co-hosts` | `CoHostRelationship`| `ADMIN` | Existing | Good | Filter by preset permission level |
| **Co-Host Detail** | `/admin/co-hosts/[id]` | `GET /admin/co-hosts/:id` | `CoHostRelationship`| `ADMIN` | Existing | Good | Display split settlement historical payout |
| **Co-Host Status Override**| `/admin/co-hosts` | `PATCH /admin/co-hosts/:id/status` | `CoHostRelationship`| `ADMIN` | Existing | Good | Add prompt for reason on suspension |
| **Broker Management** | `/broker/*` (Broker Hub)| `GET /leads`, `GET /broker/listings` | `Lead`, `Property` | `USER` (Broker) | Partial | Needs Improvement| Broker view exists in separate portal; lacks Admin-specific supervision tab |
| **Listings Catalog** | `/admin/listings` | `GET /admin/properties` | `Property` | `ADMIN` | Existing | Good | Listing Completeness Score & Property Health |
| **Property Detail** | `/admin/properties/[id]` | `GET /properties/:id` | `Property` | `ADMIN` | Existing | Good | Display recent bookings & dispute history |
| **Property Edit Wizard** | `/admin/properties/[id]/edit`| `PUT /properties/:id` | `Property` | `ADMIN` | Existing | Good | Add revision history / change diffs |
| **Property Transfer** | `/admin/listings` | `POST /admin/properties/:id/transfer`| `Property`, `User` | `ADMIN` | Existing | Good | Modal UI integration into listings table |
| **Listing Moderation** | `/admin/verification` | `PATCH /admin/properties/:id/verify`| `Property` | `ADMIN` | Existing | Excellent | Reason prompt when rejecting is already present |
| **Identity / KYC Queue**| `/admin/verification` | `PUT /admin/users/:id/verify` | `User` | `ADMIN` | Existing | Excellent | Document zoom & viewer already integrated |
| **Reel UGC Moderation**| `/admin/moderation` | `GET /reels/admin/moderation`, `PATCH /reels/admin/:id/status` | `Reel`, `ReelReport` | `ADMIN` | Existing | Good | Add batch resolution for mass spam reports |
| **Bookings Supervision**| `/admin/bookings` | `GET /admin/bookings`, `PATCH /admin/bookings/:id/status` | `Booking` | `ADMIN` | Existing | Good | Add Anomaly Alert (e.g. repeated cancellations) |
| **Admin Forced Refund**| `/admin/bookings` | `POST /admin/bookings/:bookingId/refund`, `PATCH /admin/refunds/:id/process` | `Refund`, `Booking` | `ADMIN` | Existing | Good | 2-step confirmation with financial warning |
| **Finance Collections** | `/admin/finance` | `GET /admin/collections` | `Payment`, `Booking`| `ADMIN` | Existing | Good | Add payment gateway anomaly alerts |
| **Payout Approvals** | `/admin/finance` | `PATCH /admin/payouts/:id/approve` | `PayoutRequest`, `FinancialTransaction` | `ADMIN` | Existing | Good | Integrate payout limit warnings |
| **Settlement Engine** | `/admin/settlements`| `GET /admin/settlements`, `POST /admin/settlements/:id/recalculate` | `Settlement`, `SettlementAllocation` | `ADMIN` | Existing | Excellent | Senior-developed resilient payout split engine |
| **Coupon Campaigns** | `/admin/coupons` | `GET /coupons`, `POST /coupons`, `DELETE /coupons/:id` | `Coupon` | `ADMIN` | Existing | Good | Add coupon performance / ROI metrics |
| **Marketing Banners** | `/admin/marketing/banners` | `GET /banners`, `POST /banners`, `DELETE /banners/:id` | `Banner` | `ADMIN` | Existing | Good | Impression click-through rate (CTR) tracking |
| **Platform Analytics** | `/admin/analytics` | `GET /admin/analytics/overview` | `Booking`, `Property`| `ADMIN` | Existing | Good | Time-series comparison (e.g. YoY or MoM) |
| **Audit Logs** | `/admin/audit-logs`| `GET /admin/audit-logs` | `AuditLog` | `ADMIN` | Existing | Good | Add actor IP geolocation & diff view |
| **Feature Management** | `/admin/settings` | `GET /admin-settings`, `PATCH /admin-settings` | `SystemSetting` | `ADMIN` | Existing | Partial | UI only controls Reels flag; lacks multi-flag control |
| **Developer Controls** | None | None | None | None | Missing | Missing | Needs a dedicated technical diagnostics hub |
| **Release Management** | None | None | None | None | Missing | Missing | Version/deployment metadata display missing |
| **Error Notifications**| None | None | None | None | Missing | Missing | Operational alert feed / webhook notification missing |
| **Global Search** | Header input placeholder | None (search is per-page)| None | `ADMIN` | Partial | Needs Improvement| Header has input UI, but no global search API |

---

## 3. Key Observations

1. **Substantial Existing Foundation:** The core marketplace operations (User, Host, Co-host, Property, Booking, Settlement, Verification, Finance, and UGC Moderation) are **already fully built and operational**.
2. **True Operational Gaps:** 
   - Lack of a centralized **Action Center** on the Overview Dashboard to aggregate urgent pending tasks across queues (KYC, Listing Approvals, Flagged Reels, Failed Payouts).
   - Lack of **Developer / Platform Health Controls** (diagnostics, database health, API latency, cache inspection).
   - Lack of **Global Search** (the header input currently does not query across users, properties, and bookings).
   - Lack of **System Anomaly Detection** (flags for sudden payment failure spikes or high cancellation rates).
