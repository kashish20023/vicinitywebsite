# Studio I — Traceability & Requirements Coverage Matrix (`REQUIREMENTS_MATRIX.md`)

> **Traceability Matrix**: Maps every user and admin product requirement to its frontend route, backend endpoint, data model, authorization rule, automated test suite, and current status.

---

## 1. User Experience Matrix

| Requirement | Frontend Route | Backend API Endpoint | Model / Service | Authorization Rule | Test Scenario | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing & Preserved Home** | `/` | `GET /workspaces/featured` | `WorkspaceService` | Public | Verify preserved hero, doodles, search bar, and campus cards | `IN_PROGRESS` |
| **Quick Search Bar** | `/#search-bar` | `GET /search/options` | `SearchService` | Public | Location/When/Space selection navigates to `/explore` | `IN_PROGRESS` |
| **Explore Catalog & Filters** | `/explore` | `GET /workspaces/search` | `Workspace`, `Unit` | Public | Filter by city, type, price, rating, date/time, amenities | `PLANNED` |
| **Interactive Map View** | `/explore?view=map` | `GET /workspaces/locations` | `Workspace` | Public | Campus pins with popover details and coordinates | `PLANNED` |
| **Workspace Detail Page** | `/workspaces/[slug]` | `GET /workspaces/:slug` | `Workspace`, `Floor` | Public | Gallery, amenities, rules, campus specs, available plans | `PLANNED` |
| **Interactive Floor Plan Selection**| `/workspaces/[slug]/plan` | `GET /floors/:id/availability` | `FloorPlanVersion`, `Unit` | Public / Auth | Select available desk/cabin with instant status update | `PLANNED` |
| **Price Quote & Itemization** | `/checkout` | `POST /bookings/quote` | `QuoteService`, `Coupon` | Public / Auth | Exact integer paise breakdown, coupons, tax, deposits | `PLANNED` |
| **Atomic Inventory Hold** | `/checkout` | `POST /bookings/hold` | `InventoryHold` | `USER` | 10-min TTL hold with anti-hoarding cap (max 2 holds) | `PLANNED` |
| **Payment Order & Simulation**| `/checkout` | `POST /payments/order` | `PaymentOrder` | `USER` | Simulated provider order creation with UPI, Card, NetBanking | `PLANNED` |
| **Payment Verification & Confirm**| `/checkout/confirm`| `POST /payments/verify` | `BookingService` | `USER` | Transactional verification, seat confirmation, no overselling | `PLANNED` |
| **Booking Pass & Confirmation** | `/bookings/[id]/pass` | `GET /bookings/:id/pass` | `DigitalPass` | `USER` (Owner) | Signed digital pass, QR token, calendar `.ics` download | `PLANNED` |
| **My Bookings Dashboard** | `/my-bookings` | `GET /bookings/my` | `Booking` | `USER` (Owner) | Filter by Upcoming, Active, Completed, Cancelled | `PLANNED` |
| **Booking Reschedule & Extend** | `/my-bookings` | `POST /bookings/:id/reschedule` | `BookingChange` | `USER` (Owner) | Safe atomic re-allocation with preserved fallback | `PLANNED` |
| **Booking Cancellation & Refund** | `/my-bookings` | `POST /bookings/:id/cancel` | `RefundService` | `USER` (Owner) | Policy calculation, coupon restoration, refund snapshot | `PLANNED` |
| **Access QR Check-in & History**| `/access` | `POST /access/checkin` | `AccessSession` | `USER` (Owner) | QR scan, visit session tracking, check-out | `PLANNED` |
| **Membership & Credits** | `/memberships` | `GET /memberships/my` | `Membership`, `CreditLedger` | `USER` | Flexi plans, room credits, automated entitlement check | `PLANNED` |
| **User Profile & Billing** | `/profile` | `GET /profile`, `PUT /profile` | `User`, `Profile` | `USER` | Contact info, GSTIN, invoices, credit ledger | `PLANNED` |
| **Maintenance Issue Report** | `/maintenance` | `POST /maintenance/report` | `MaintenanceIssue` | `USER` | Submit issue with category, photo, timeline tracking | `PLANNED` |
| **Support Tickets** | `/support` | `POST /support/tickets` | `SupportTicket` | `USER` | User support inquiry with response conversation thread | `PLANNED` |
| **Verified Booking Reviews** | `/workspaces/[slug]` | `POST /reviews` | `Review` | `USER` (Verified) | 1-5 star review submitted only after verified visit | `PLANNED` |
| **Wishlist Bookmarks** | `/wishlist` | `GET/POST /wishlists` | `Wishlist` | `USER` | Bookmark favourite campuses and desks | `PLANNED` |

---

## 2. Admin Experience Matrix

| Requirement | Frontend Route | Backend API Endpoint | Model / Service | Authorization Rule | Test Scenario | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Overview Dashboard** | `/admin` | `GET /admin/dashboard` | `AdminService` | `ADMIN` | Total bookings, cash collected, occupancy %, active presence | `PLANNED` |
| **Workspace & Inventory Mgmt** | `/admin/spaces` | `GET/POST /admin/workspaces` | `Workspace`, `Floor` | `ADMIN` | Create, edit, pause, archive campuses, buildings, zones | `PLANNED` |
| **Floor Plan Visual Editor** | `/admin/spaces/[id]/floor-plan` | `POST /admin/floors/:id/publish` | `FloorPlanObject` | `ADMIN` | Add, position, resize, rotate desks/cabins, draft & publish | `PLANNED` |
| **Pricing & Opening Hours** | `/admin/pricing` | `POST /admin/pricing-rules` | `PricingRule`, `OpeningHours` | `ADMIN` | Hourly, daily, monthly rates, peak hours, holidays | `PLANNED` |
| **Bookings Administration** | `/admin/bookings` | `GET /admin/bookings` | `Booking` | `ADMIN` | View all, filter by date, manual booking, cancel/refund | `PLANNED` |
| **User Directory & Blocking** | `/admin/users` | `GET /admin/users`, `PATCH /block` | `User` | `ADMIN` | Profile review, block/unblock with explicit invariants | `PLANNED` |
| **Payments & Direct Finance** | `/admin/finance` | `GET /admin/finance/summary` | `BookingFinanceSnapshot` | `ADMIN` | Customer receipts, refunds, deposits, revenue reconciliation | `PLANNED` |
| **Beneficiary Payouts (Optional)**| `/admin/finance/beneficiaries`| `POST /admin/settlements/execute`| `SettlementAgreement` | `ADMIN` (Scoped) | Disabled-by-default, simulated transfer intents | `PLANNED` |
| **Maintenance Work Orders** | `/admin/maintenance` | `GET/PATCH /admin/maintenance/:id`| `MaintenanceIssue` | `ADMIN` | Assign staff, update status, create inventory block | `PLANNED` |
| **Coupons & Promotional Rules** | `/admin/coupons` | `GET/POST /admin/coupons` | `Coupon` | `ADMIN` | Flat/%, validity, usage caps, plan restrictions, history | `PLANNED` |
| **Memberships Administration** | `/admin/memberships` | `GET/POST /admin/memberships` | `MembershipPlan` | `ADMIN` | Plan setup, credit grants, user entitlements | `PLANNED` |
| **Analytics & Business Reports**| `/admin/reports` | `GET /admin/reports/occupancy` | `ReportService` | `ADMIN` | Occupancy %, revenue, CSV export | `PLANNED` |
| **Platform Settings & Audit** | `/admin/settings` | `GET/PUT /admin/settings` | `SystemSetting`, `AuditLog` | `ADMIN` | Opening hours, tax %, cancellation policy, audit logs | `PLANNED` |
| **Support & Dispute Desk** | `/admin/support` | `GET/POST /admin/support/:id/reply`| `SupportTicket` | `ADMIN` | Respond to member inquiries, ticket closure | `PLANNED` |
| **Review Moderation** | `/admin/reviews` | `PATCH /admin/reviews/:id` | `Review` | `ADMIN` | Approve, moderate, or hide reviews | `PLANNED` |
