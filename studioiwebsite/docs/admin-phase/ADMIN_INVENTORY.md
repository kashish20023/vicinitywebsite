# Studio I — Complete FairBnB Admin Screen & API Inventory

**Date**: 2026-09-22  
**Source Reference**: `C:\Users\shubham\OneDrive\Desktop\fairbnb--new\`  
**Target Repository**: `C:\Users\shubham\OneDrive\Desktop\studio i\studio-i-complete\`  
**Theme Invariant**: Pink-and-White LIGHT Theme (`#FF007A`, `#FFFFFF`, `#F8F9FA`). Zero dark Admin surfaces.  

---

## 1. System & Runtime Identification

| Item | Reference Source (`fairbnb--new`) | Target Platform (`studio-i-complete`) |
| :--- | :--- | :--- |
| **Frontend Runtime** | Next.js 16 (`http://localhost:3001`) | Next.js 16 (`http://localhost:3000`) |
| **Backend Runtime** | NestJS (`http://localhost:5000`) | NestJS (`http://localhost:5002/api/v1`) |
| **Database** | PostgreSQL `fairbnb_db` (port 5433) | PostgreSQL `studioi_complete_dev` (port 5432) |
| **Theme** | Light theme with Rose (`#F43F5E`) | Light theme with Studio I Hot Pink (`#FF007A`) |
| **Typography** | Poppins | Plus Jakarta Sans / Inter |
| **Monetary Model** | Integer Rupees | Strict Integer Paise (`BigInt` / integer paise) |

---

## 2. FairBnB Admin Screen Inventory & Coworking Adaptation

| Route | Source Screen & Functionality | Adapted Coworking Studio I Capability |
| :--- | :--- | :--- |
| `/admin/dashboard` | Platform overview KPIs (Users, Hosts, Guests, Listings, Bookings, Revenue), quick action shortcuts, live transaction stream | Overview with Jaipur flagships, active desks, occupancy rate, live bookings feed, revenue in INR |
| `/admin/listings` | Property directory table, status, pricing, verification status, approve/reject/suspend actions | Coworking Workspaces, Buildings, Floors, and direct launcher for the **2D Floor Plan Editor/Viewer** |
| `/admin/spaces/[id]/floor-plan` | Coworking extension | Interactive 2D layout canvas editor with unit positioning, rotation, capacity, and live publication |
| `/admin/bookings` | Bookings table with filters (search by ID, guest, host, status), tab filters | Coworking bookings across Day Pass, Hourly, and Monthly plans, with **Manual Booking Creation Modal** |
| `/admin/users` | Users management table with role filter (`ALL`, `USER`, `HOST`, `COHOST`, `ADMIN`), block/unblock, phone/email verify | Complete member & host directory with 1-click account suspension and verification |
| `/admin/verification` | KYC document verification queue, identity reviews | Host and enterprise client verification queue |
| `/admin/finance` | Gross Booking Value, Host Payouts, Platform Commissions, Refunds | Coworking revenue analytics, Host Payout Requests with single-click **NEFT Approval Workflow**, and refund processing |
| `/admin/moderation` | Property moderation queue, review requests, verify/reject with notes | Workspace approval & compliance review queue |
| `/admin/marketing/banners` | Full banner and promotion manager with coupon linkage, priority, toggle live | Promotional banner manager with `STUDIO10` coupon linkage, target URL, and priority ranking |
| `/admin/support` | Support tickets & customer disputes queue | Member booking disputes queue with admin resolution notes and refund authorization |
| `/admin/analytics` | Revenue analytics, GBV, ADR, Occupancy Rate | Real-time seat occupancy trends, revenue by plan type (Hot Desk vs Dedicated Desk vs Cabin) |
| `/admin/settings` | Platform fee configuration, cancellation policy defaults | Coworking platform fees, GST rates (18%), commitment minimums (2 months) |
| `/admin/settings/amenities-tags` | Amenities & Tags CRUD manager with categories, icons, and color selectors | Coworking facilities (Ergonomic Desks, Fiber WiFi, Soundproof Booths, Coffee Bar) |

---

## 3. Canonical Admin APIs Mapped to Target

1. `GET /api/v1/admin/dashboard` — Platform overview metrics & recent bookings
2. `GET /api/v1/admin/bookings` — Comprehensive bookings list with search & filters
3. `POST /api/v1/admin/bookings/manual` — Create manual booking on behalf of member
4. `GET /api/v1/admin/users` — User directory with role filters
5. `PATCH /api/v1/admin/users/:id/block` — 1-click user suspension/reactivation
6. `PATCH /api/v1/admin/users/:id/verify` — Update KYC / verification status
7. `GET /api/v1/admin/properties` (or `/workspaces`) — Workspace inventory
8. `POST /api/v1/admin/floors/:id/publish-layout` — Publish 2D layout version
9. `GET /api/v1/admin/payouts` — Host payout requests queue
10. `POST /api/v1/admin/payouts/:id/process` — Approve or reject host payout
11. `GET /api/v1/operations/disputes` — Dispute resolution queue
12. `POST /api/v1/operations/disputes/:id/resolve` — Resolve member dispute
13. `GET /api/v1/operations/banners` — Marketing banners list
14. `POST /api/v1/admin/marketing/banners` — Create/update/delete banner
15. `GET /api/v1/admin/finance/summary` — High-level financial collections

---

## 4. Chunk 0 Verification Checkpoint
- [x] Identified reference source (`fairbnb--new` on ports 3001/5000).
- [x] Identified target repository (`studio-i-complete` on ports 3000/5002).
- [x] Complete 12-screen FairBnB Admin inventory mapped.
- [x] Theme direction locked: Studio I Hot Pink `#FF007A` + Crisp White `#FFFFFF` / `#F8F9FA` LIGHT theme.
- [x] Existing public homepage, animations, and assets protected.
