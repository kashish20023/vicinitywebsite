# FairBnB Parity Matrix

**Requirement:** Full account of all FairBnB capabilities across User, Admin, Host, and Co-host roles, mapped to coworking requirements.

---

| FairBnB Capability | Source Module(s) | Coworking Translation | Role(s) | Target Implementation Path | Status & Acceptance Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth & Profile Management** | `backend/src/auth`, `profile`, `users` | Multi-role JWT authentication, KYC verification, profile details, OTP simulation | USER, HOST, ADMIN | `backend/src/auth`, `frontend/src/app/login`, `/register` | Login, role retrieval & protected profile test |
| **Host Onboarding & Workspace Setup** | `backend/src/hosts`, `properties` | Host campus listing wizard (locations, amenities, policies, opening hours) | HOST, ADMIN | `backend/src/hosts`, `frontend/src/app/host/listings/new` | Workspace creation & review flow |
| **Building/Floor/2D Setup**| `backend/src/properties`, Studio I | Buildings, floors, zones, 2D unit coordinate publication | HOST, COHOST, ADMIN | `backend/src/workspaces`, `frontend/src/app/host/properties/[id]` | 2D editor drag, drop & publish test |
| **Co-host Invitation & Delegation** | `backend/src/co-host` | Granular permission scoping (`canManageListing`, `canViewFinances`, `canManageBookings`) | HOST, COHOST | `backend/src/co-host`, `frontend/src/app/co-host` | Invite generation, accept & scoped access test |
| **Calendar & Availability**| `backend/src/calendar`, `ical` | Real-time interval `[start, end)` availability with coworking schedule hours | USER, HOST, ADMIN | `backend/src/workspaces`, `frontend/src/app/host/calendar` | Availability query & conflict block test |
| **Atomic Hold Engine** | Studio I + FairBnB | 10-minute transactional holds with PostgreSQL advisory locking | USER | `backend/src/bookings`, `frontend/src/features/floor-plan` | 20-thread concurrency invariant test |
| **Authoritative Pricing & Quotes** | `backend/src/properties`, Studio I | Base rate, duration multiplier, dynamic rules, coupon discounts, tax calculation in paise | USER | `backend/src/pricing`, `frontend/src/app/checkout` | Authoritative quote API calculation test |
| **Booking Lifecycle** | `backend/src/bookings` | Create from hold, confirm on payment, check-in, extension, reschedule, cancellation | USER, HOST, ADMIN | `backend/src/bookings`, `frontend/src/app/my-bookings` | Full lifecycle transition test |
| **Simulated Payment Gateway** | `backend/src/payments` | Mock order creation, verification, webhook idempotency, BigInt paise precision | USER, ADMIN | `backend/src/payments`, `frontend/src/app/checkout` | Payment order & webhook verification test |
| **Financial Ledger & Settlements** | `backend/src/payments`, `hosts` | Immutable snapshots, platform fee deduction, host earnings ledger, payout requests | HOST, ADMIN | `backend/src/finance`, `frontend/src/app/host/earnings`, `/admin/finance` | Earnings reconciliation & payout test |
| **Chat & Concierge Messaging** | `backend/src/chat` | Member <-> Host / Concierge real-time message stream | USER, HOST, ADMIN | `backend/src/chat`, `frontend/src/app/messages` | Message send, list & notification test |
| **Maintenance Requests** | `backend/src/maintenance` | Workstation/facility maintenance ticket creation, priority, status tracking | USER, HOST, ADMIN | `backend/src/maintenance`, `frontend/src/app/maintenance` | Ticket create, update & resolve test |
| **Dispute Resolution** | `backend/src/disputes` | Booking disputes, refund requests, administrative resolution | USER, HOST, ADMIN | `backend/src/disputes`, `frontend/src/app/disputes`, `/admin` | Dispute filing & resolution test |
| **Reviews & Wishlists** | `backend/src/reviews`, `wishlists` | Verified member reviews, rating breakdowns, saved favorite workspaces | USER, HOST | `backend/src/reviews`, `wishlists`, `frontend/src/app/wishlist` | Add to wishlist & review submission test |
| **Promotions & Banners** | `backend/src/banners`, `coupons` | Targeted announcement banners, promotional coupon codes | ADMIN, USER | `backend/src/banners`, `frontend/src/components/BrandBanner.tsx` | Banner fetch & coupon validation test |
| **Automated Reminders** | `backend/src/automated-messages` | Automated booking confirmations, access reminders, check-in instructions | HOST, ADMIN | `backend/src/automated-messages` | Rule trigger & message log test |
| **Admin Operations Hub** | `backend/src/admin`, `admin-settings` | Comprehensive KPI dashboard, moderation, financial auditing, audit logs | ADMIN | `backend/src/admin`, `frontend/src/app/admin` | Dashboard metrics & settings update test |
