# DELIVERABLE 1 — EXISTING SYSTEM INVENTORY

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Admin Dashboard & Platform Operations  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  
**Status:** Complete — Non-Destructive Codebase Inventory

---

## 1. Executive Overview

This inventory captures the complete surface area of the existing Fairbnb Admin subsystem across the Frontend (Next.js 16 App Router), Backend (NestJS 11 + Prisma ORM), and Database (PostgreSQL via Prisma with 46 schema models). It serves as the baseline to prevent accidental re-implementation of existing features and establish precise boundaries.

---

## 2. Frontend Inventory

### 2.1 Admin Routes & Pages

All admin routes reside in `frontend/src/app/admin/` and share a persistent shell defined in `frontend/src/app/admin/layout.tsx`.

| Route | Page File | Purpose | Key Components / Features | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | Executive KPI dashboard & overview | `PageHeader`, `StatCard`, `DashboardSkeleton`, KPI metrics grid, recent users/properties | Fully Operational |
| `/admin/moderation` | `src/app/admin/moderation/page.tsx` | Moderation queue for Reels & UGC | Filter tabs (PENDING, RESOLVED, REJECTED), report reason badges, content card previews | Fully Operational |
| `/admin/users` | `src/app/admin/users/page.tsx` | User directory, guest & host management | Search, role filter (`USER`, `HOST`, `ADMIN`), block/unblock action with modal, KYC indicator | Fully Operational |
| `/admin/hosts` | `src/app/admin/hosts/page.tsx` | Dedicated host directory | Listings counter, revenue stats, Superhost badge, Host Impersonation launcher | Fully Operational |
| `/admin/hosts/[id]` | `src/app/admin/hosts/[id]/page.tsx` | Host detail profile & analytics | Host properties list, revenue breakdown, payout details, direct message trigger | Fully Operational |
| `/admin/co-hosts` | `src/app/admin/co-hosts/page.tsx` | Co-Host supervision & status override | Co-host relationship table, assigned properties, permission level tag, status override (SUSPEND/ACTIVE) | Fully Operational |
| `/admin/co-hosts/[id]` | `src/app/admin/co-hosts/[id]/page.tsx` | Co-Host detail & assigned listings | Direct breakdown of co-host permissions, commission percentage, payout rules | Fully Operational |
| `/admin/listings` | `src/app/admin/listings/page.tsx` | Listings hub & catalog overview | Search, status filters (PUBLISHED, DRAFT, PENDING, REJECTED), category tags, quick edit link | Fully Operational |
| `/admin/properties/[id]` | `src/app/admin/properties/[id]/page.tsx` | Listing detail view for admins | Photo gallery, host information, pricing breakdown, amenities list | Fully Operational |
| `/admin/properties/[id]/edit` | `src/app/admin/properties/[id]/edit/page.tsx` | Admin property edit wizard | Multi-step property wizard (`PropertyEditWizardView`), override pricing, photos, tags | Fully Operational |
| `/admin/bookings` | `src/app/admin/bookings/page.tsx` | Platform reservations & booking ledger | Booking status filters, guest/host details, cancellation status, refund action trigger | Fully Operational |
| `/admin/coupons` | `src/app/admin/coupons/page.tsx` | Discount codes & campaign management | Coupon table, creation modal (`CreateCouponModal`), metrics calculation (times used, discount total) | Fully Operational |
| `/admin/verification` | `src/app/admin/verification/page.tsx` | Host KYC & listing approval queue | Split view (Property Approvals vs User KYC), document viewer modal, approve/reject feedback | Fully Operational |
| `/admin/finance` | `src/app/admin/finance/page.tsx` | Financial collections & host payouts | Gross Booking Value (GBV), platform fee collections, payout queue, 1-click approve payout | Fully Operational |
| `/admin/settlements` | `src/app/admin/settlements/page.tsx` | Co-Host revenue split settlements | Automated settlement engine ledger, allocation status, recalculation trigger, transfer intents | Fully Operational |
| `/admin/support` | `src/app/admin/support/page.tsx` | User dispute resolution & admin messaging | Disputes list, priority tags, dispute resolve modal, direct message composer | Fully Operational |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Visual time-series analytics | Revenue charts, ADR, Occupancy Rate curves, date-range selectors (7d, 30d, 90d, 1y) | Fully Operational |
| `/admin/audit-logs` | `src/app/admin/audit-logs/page.tsx` | Administrative audit trail | Searchable and filterable log feed (actor, action, entity, timestamp, JSON payload inspector) | Fully Operational |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | Platform feature flags & system config | Reels enable/disable toggle, feature flags, global configuration parameters | Fully Operational |
| `/admin/settings/amenities-tags` | `src/app/admin/settings/amenities-tags/page.tsx` | Taxonomy management | Amenities & tags CRUD, icon picker, category grouping | Fully Operational |
| `/admin/marketing/banners` | `src/app/admin/marketing/banners/page.tsx` | Promotional banners & exit popups | Banner creation, page route target targeting, coupon unlock configuration, impression counters | Fully Operational |

---

### 2.2 Shared Frontend Components & UI Library

* **Shell & Navigation:**
  - `AdminSidebar.tsx` (`src/components/layout/AdminSidebar.tsx`): Left navigation shell, active route highlights, collapsible state, mobile drawer.
  - `AdminHeader.tsx` (`src/components/layout/AdminHeader.tsx`): Breadcrumbs, search input placeholder, notification bell, admin profile drop-down.
  - `navigation.tsx` (`src/components/dashboard/navigation.tsx`): Navigation context, motion animations, drawer helpers.
* **KPI & Data Displays:**
  - `StatCard.tsx` (`src/components/ui/StatCard.tsx`): Metric display cards with trend indicator (+/-%), subtitle, and optional sparkline/icon.
  - `PageHeader.tsx` (`src/components/ui/PageHeader.tsx`): Uniform title, description, and primary action container.
  - `StatusBadge.tsx` (`src/components/ui/StatusBadge.tsx`): Standardized color-coded badges for PENDING, ACTIVE, SUSPENDED, REJECTED, APPROVED.
  - `DashboardSkeleton.tsx` (`src/components/dashboard/DashboardSkeleton.tsx`): Uniform loading shimmer for administrative screens.
* **Modals & Wizards:**
  - `CreateCouponModal.tsx` (`src/app/admin/coupons/CreateCouponModal.tsx`): Comprehensive modal for creating discount campaigns.
  - `PropertyEditWizardView.tsx` (`src/components/property/PropertyEditWizardView.tsx`): 7-step wizard for property modifications.
  - `EditPropertyModal.tsx` (`src/components/property/EditPropertyModal.tsx`): Fast-access property configuration modal.
  - `BannerModal.tsx` (`src/components/ui/BannerModal.tsx`): Public & admin banner renderer.

### 2.3 Frontend State, Guards & Networking

* **Networking Client:** `src/lib/api-client.ts` (`api.get`, `api.post`, `api.patch`, `api.put`, `api.delete`). Automatically reads `fairbnb_token` from `localStorage` and appends `Bearer` authorization headers.
* **Auth Context:** `src/context/auth-context.tsx` provides `user`, `role`, `isAuthenticated`, `login`, and `logout`.
* **Current Route Guard Status:**
  - Currently enforced **in-component** (client-side `useAuth` checks).
  - No Edge `middleware.ts` is currently present (identified as a security gap).

---

## 3. Backend Inventory (NestJS)

The backend provides 78 distinct administrative endpoints distributed across 11 controller modules, all protected by `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.ADMIN)`.

### 3.1 Backend Controller & Service Map

```text
backend/src/
├── admin/
│   ├── admin.controller.ts        # 31 endpoints (Overview, Users, Hosts, Properties, KYC, Finance)
│   ├── admin.service.ts           # 1,200+ LOC core business logic service
│   └── dto/                       # DTOs for verification, block, transfer, messaging
├── bookings/
│   ├── admin-bookings.controller.ts # 11 endpoints (Bookings lifecycle, refunds, cancellations)
│   └── bookings.service.ts
├── payouts/
│   ├── settlement.controller.ts   # 6 endpoints (Settlements, recalculations, transfer intents)
│   ├── settlement.service.ts
│   ├── transfer-execution.service.ts
│   └── post-payout-adjustments.service.ts
├── admin-settings/
│   ├── admin-settings.controller.ts # 3 endpoints (SystemSetting key-value CRUD)
│   └── admin-settings.service.ts
├── audit-logs/
│   ├── audit-logs.controller.ts   # 1 endpoint (Audit log query & pagination)
│   └── audit-logs.service.ts
├── coupons/
│   └── coupons.controller.ts      # 4 endpoints (Coupon lifecycle)
├── banners/
│   └── banners.controller.ts      # 5 endpoints (Marketing banners)
├── reels/
│   └── reels.controller.ts        # 6 admin endpoints (UGC Moderation & resolution)
├── disputes/
│   └── disputes.controller.ts     # 2 endpoints (Dispute management & resolution)
├── amenities/ & tags/
│   ├── amenities.controller.ts    # 3 admin endpoints
│   └── tags.controller.ts         # 3 admin endpoints
└── users/
    └── users.controller.ts        # 3 admin endpoints (Role assignment, status override)
```

---

## 4. Database Inventory (Prisma & PostgreSQL)

The schema defines **46 models** and **4 enums**. The primary entities utilized by the administrative subsystem are:

| Model | Table | Key Columns | Administrative Usage |
| :--- | :--- | :--- | :--- |
| `User` | `"User"` | `id`, `name`, `email`, `phone`, `role`, `isActive`, `kycStatus`, `kycDocumentUrl`, `blockReason` | User directory, host/guest management, KYC verification queue, 1-click account suspension |
| `Property` | `"Property"` | `id`, `title`, `status`, `verificationStatus`, `basePrice`, `hostId`, `rejectionReason`, `adminTags` | Listing reviews, approval/rejection workflows, ownership transfers, catalog management |
| `Booking` | `"Booking"` | `id`, `propertyId`, `guestId`, `totalAmount`, `status`, `paymentStatus`, `refundStatus` | Booking supervision, dispute tracking, forced cancellations |
| `Payment` | `"Payment"` | `id`, `bookingId`, `amount`, `status`, `provider`, `providerPaymentId`, `idempotencyKey` | Payment ledger verification, gateway reconciliations |
| `Refund` | `"Refund"` | `id`, `bookingId`, `paymentId`, `amount`, `status`, `reservationStatus`, `processedById` | Processing guest cancellations and partial refund claims |
| `PayoutRequest` | `"PayoutRequest"` | `id`, `hostId`, `amount`, `status`, `processedAt` | Host payout authorization and tracking |
| `Settlement` | `"Settlement"` | `id`, `bookingId`, `grossAmountPaise`, `status`, `revisions` | Co-host/host automated revenue split calculation and transfer execution |
| `SettlementAllocation`| `"SettlementAllocation"` | `settlementId`, `recipientUserId`, `allocatedAmountPaise`, `role` | Distribution breakdown per co-host agreement |
| `SystemSetting` | `"SystemSetting"` | `id`, `key`, `value` (JSON), `description` | Global runtime feature flags (e.g. `REELS_FEATURE_ENABLED`) |
| `AuditLog` | `"AuditLog"` | `id`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `details`, `ipAddress` | Administrative audit trail records |
| `FinancialAuditEvent`| `"FinancialAuditEvent"` | `id`, `eventType`, `bookingId`, `actorId`, `metadata` | Strict tamper-evident financial transaction trail |
| `Reel` | `"Reel"` | `id`, `creatorId`, `status`, `videoUrl`, `reports` | UGC moderation, automated flag resolution, content takedowns |
| `ReelReport` | `"ReelReport"` | `id`, `reelId`, `reporterId`, `reason`, `status`, `resolution` | Community user reports queue |
| `Coupon` | `"Coupon"` | `id`, `code`, `discountType`, `discountValue`, `usageLimit`, `timesUsed`, `isActive` | Promotional campaigns & revenue discount analytics |
| `Banner` | `"Banner"` | `id`, `title`, `imageUrl`, `targetPage`, `actionType`, `isActive` | Promotional site-wide banners and lead-capture popups |
| `Dispute` | `"Dispute"` | `id`, `bookingId`, `initiatorId`, `reason`, `status`, `resolutionNotes` | Guest/host reservation disputes |

---

## 5. Architectural Findings & Dependencies

1. **Service Reusability:** The existing `AdminService` (`backend/src/admin/admin.service.ts`) already encapsulates high-performance metric aggregations (`getOverviewMetrics`, `getPlatformStats`, `getFinancialCollections`). Any proposed action center or health monitor can directly leverage these methods.
2. **Audit Dual-Stack:** The system possesses two audit tables: `AuditLog` (general administrative operations) and `FinancialAuditEvent` (financial operations). They are complementary and must be preserved without creating a redundant third audit table.
3. **Feature Flag Architecture:** Runtime feature toggles are stored in `SystemSetting` with JSON values, managed via `/admin-settings`. This existing mechanism must be used for future feature rollout controls.
