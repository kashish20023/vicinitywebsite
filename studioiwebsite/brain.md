# Studio i — Full-Stack Architecture & Knowledge Base (`brain.md`)

> **Single Source of Truth (SSOT)** for the **Studio i** Coworking Platform & Portals.  
> **Last Updated:** September 24, 2026  
> **Status:** Active & Production-Ready (Verified on Next.js 16 + NestJS + Prisma + PostgreSQL)

---

## 1. Executive Summary & Brand Identity

### 1.1 Overview
**Studio i** is a premium coworking and managed workspace ecosystem operating across Rajasthan (Jaipur & Alwar), India. The platform consists of:
- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, TypeScript, Lucide Icons, Turbopack.
- **Backend**: NestJS, Prisma ORM (v6.19.3), PostgreSQL, Passport JWT, RBAC + Contextual Delegation.
- **Portals**:
  1. **Public Showcase & Booking**: Workspace catalog, 2D floor plans, checkout, instant digital QR pass.
  2. **Member Dashboard** (`/my-bookings`): Active bookings, check-in history, digital access passes.
  3. **Host Portal** (`/host`): Property listings, inventory management, occupancy calendar, payouts, and co-host team management.
  4. **Co-Host Portal** (`/co-host`): Delegated workspaces, check-ins, maintenance ticket tracking, guest messages, split earnings.
  5. **Admin Console** (`/admin`): Super administrator governance, KYC approvals, global booking control, co-host oversight, financial reconciliations.

### 1.2 Brand Tokens & Aesthetics
- **Headline**: *"A Workspace for Every You"*
- **Tagline**: *"Your Space. Your Work. Your Way."*
- **Color Palette Tokens**:
  - Primary Accent: `#FF007A` (Brand Magenta)
  - Dark Accent: `#E0006C` (Deep Magenta)
  - Core Obsidian: `#000000` (Pure Black), `#0A0A0A`, `#0C0C0E` (Titanium Dark)
  - Neutral Canvas: `#FFFFFF` (Pure White), `#F9FAFB` (Neutral 50), `#F2ECE2` (Warm Beige Accent)
  - Border Accents: `#E5E7EB` (Neutral 200), `#262626` (Dark Charcoal)
- **Typography Stack**: `Plus Jakarta Sans` (`next/font/google`) with weights `300` to `800`.

---

## 2. Updates Completed on September 24, 2026

### 2.1 Co-Host Role & Backend Data Storage Architecture (FairBnb RBAC Model)
1. **Contextual RBAC Design**:
   - In Studio i, **`CO-HOST` is NOT a flat user-level enum role**. The `UserRole` enum strictly remains `['USER', 'HOST', 'ADMIN']`.
   - Co-hosting is handled as a **Workspace-Scoped Relationship (Contextual RBAC)** via `CohostPermission` and `CohostInvitation`.
   - When a host invites an existing user, the user's base account role remains unchanged (e.g. `USER`), but they gain co-host privileges scoped strictly to that specific workspace.
   - When inviting a brand-new email (auto-provisioned), the user account is created with `role: HOST` so they have platform portal authorization, and the `CohostPermission` row is immediately activated.

2. **Schema Enhancements (Migration: `20260924103517_add_contact_fields_to_cohost`)**:
   - **`CohostPermission`**: Added direct contact fields:
     - `name`: `String?` (synced from User at invitation acceptance)
     - `email`: `String?` (synced from User/invite)
     - `mobileNo`: `String?` (synced from `User.phone`)
   - **`CohostInvitation`**: Added invitee contact details:
     - `inviteeName`: `String?` (host-specified display name at invite time)
     - `inviteeMobileNo`: `String?` (host-specified contact number at invite time)

3. **Backend Service & Controller Layer Updates**:
   - `co-host.service.ts`:
     - `inviteCoHost`: Accepts optional `name` and `mobileNo`, creates `CohostInvitation` with contact metadata, falls back to `User` profile or email prefix, and auto-provisions if user doesn't exist.
     - `acceptInvitation`: Upserts `CohostPermission` and synchronizes `name`, `email`, and `mobileNo` directly from the authenticated `User` record.
   - `co-host.controller.ts`: Accepts `name` and `mobileNo` in `POST /workspaces/:workspaceId/co-hosts/invite`.
   - `RolesGuard` (`roles.guard.ts`): Updated to verify contextual co-host permissions so co-hosts can seamlessly access authorized host workspace endpoints.

### 2.2 Admin & Host Portals Co-Host Visibility
1. **Admin Co-Host Governance (`/admin/co-hosts`)**:
   - **Brand new full governance page** with KPI metric cards: Total Co-Hosts, Active Workspaces, Pending Invitations, Split Agreements.
   - Tabbed view: `All`, `Active Delegates`, and `Pending Invites`.
   - Permission Inspector modal displaying granular flags (`canManageListing`, `canViewFinances`, `canManageBookings`, `canManageCalendar`, `canManageMaintenance`, `canMessageGuests`).
   - Clickable host and property links for fast administrative auditing.
2. **Admin Navigation & Sidebar (`AdminSidebar.tsx`)**:
   - Added **"Co-Host Governance"** navigation link with a dedicated "Delegates" badge.
3. **Admin User Directory (`/admin/users`)**:
   - Added **Role Filter Tabs**: `All`, `Co-Hosts`, `Hosts`, `Members`, `Admins`.
   - Users with active co-host permissions display a prominent purple **`CO-HOST`** status badge with their delegated workspace count.
4. **Admin Host Directory (`/admin/hosts`)**:
   - Added interactive co-host badge in host table directing admins to the co-host governance console.
5. **Host Dashboard (`/host`)**:
   - Added **"Co-Host Team"** quick action button in the hero header.
   - Added a **5th Dedicated KPI Card** showing total active delegates and pending invites with direct links to `/host/co-hosts`.
6. **Co-Host Earnings Page (`/co-host/earnings`)**:
   - Refined responsive property split agreement table, displaying primary host, split type, share percentage, total earned rupees, and payout status.

### 2.3 Mobile & Desktop Responsive Design Overhaul
1. **`HeroSection.tsx`**:
   - Fluid responsive typography with `text-3xl sm:text-5xl lg:text-7xl` clamp.
   - Dynamic absolute positioning and z-indexing for hand-drawn stickers (`doodle-left-complete.png`, `doodle-right-complete.png`).
   - Mobile-first vertical spacing preventing overflow on small viewports.
2. **`WorkspaceInfiniteSlider.tsx`**:
   - 3D iPhone hardware chassis calibrated with exact 9:18.5 natural aspect ratio.
   - Seamless 24-item infinite reel with live synchronizer detecting active cards.
   - Floating CTA button *"Find Your Perfect Workspace"* aligned with bottom frame.
3. **`BrandBanner.tsx`**:
   - Responsive centering, typography, and padding adjustments for mobile and desktop screens.
4. **`HeroSearch.tsx`**:
   - Fully responsive pill search bar with clean dropdowns for location, date, and workspace types.
5. **`TestimonialsSection.tsx`**:
   - Responsive card grid and horizontal scroll support for mobile devices.
   - Integrated custom realistic avatar assets (`avatar-amit.jpg`, `avatar-neha.jpg`, `avatar-priya.jpg`).

---

## 3. Database Schema Overview (`prisma/schema.prisma`)

```
=============================================================================
                              SCHEMA SUMMARY
=============================================================================

1. User (Identity & RBAC)
   ├── id, email, passwordHash, name, phone, role (USER | HOST | ADMIN)
   ├── avatarUrl, companyName, gstin, billingAddress, isBlocked, blockReason
   └── Relations: hostedWorkspaces, cohostPermissions, bookings, passes, ...

2. Workspace (Property / Building)
   ├── id, hostId, name, slug, city, address, latitude, longitude
   ├── isPublished, pricingRules, buildings, floors, amenities, media
   └── Relations: cohostPermissions, cohostInvitations, bookings

3. CohostInvitation (Delegation Lifecycle)
   ├── id, workspaceId, hostId, token, permissions (JSON), status, expiresAt
   ├── inviteeEmail    : String
   ├── inviteeName     : String?  [NEW - Sep 24]
   └── inviteeMobileNo : String?  [NEW - Sep 24]

4. CohostPermission (Contextual Co-Host Scope & Contact)
   ├── id, workspaceId, userId
   ├── name                 : String?  [NEW - Sep 24]
   ├── email                : String?  [NEW - Sep 24]
   ├── mobileNo             : String?  [NEW - Sep 24]
   ├── canManageListing     : Boolean (default: true)
   ├── canViewFinances      : Boolean (default: false)
   ├── canManageBookings    : Boolean (default: true)
   ├── canManageCalendar    : Boolean (default: true)
   ├── canManageMaintenance : Boolean (default: true)
   ├── canMessageGuests     : Boolean (default: true)
   └── @@unique([workspaceId, userId])

5. Bookings & Inventory
   ├── Booking, BookingPlan, Unit, Floor, FloorLayoutVersion, InventoryHold
   └── DigitalPass, AccessSession, PaymentOrder, RefundRecord

6. Operations & Engagement
   ├── MaintenanceIssue, ChatMessage, AutomatedMessageRule, Dispute, Review
   └── Coupon, CouponUsage, Banner, AuditLog, PayoutRequest
```

---

## 4. Multi-Portal Routing Tree (`frontend/src/app/`)

```
src/app/
├── (public)
│   ├── page.tsx                     # Landing Page (Hero, Slider, Banner, Testimonials)
│   ├── explore/page.tsx             # Workspace Search & Location Filters
│   ├── workspaces/[slug]/page.tsx   # Property Profile, Unit Selection & 2D Viewer
│   ├── checkout/page.tsx            # Payment & Booking Confirmation
│   └── bookings/[id]/pass/page.tsx  # Digital QR Access Pass
├── my-bookings/page.tsx             # Member Bookings & Check-In History
│
├── host/                            # Host Portal
│   ├── page.tsx                     # Host Dashboard (KPIs, Co-Host quick action)
│   ├── properties/page.tsx          # Buildings & Units
│   ├── listings/page.tsx            # Inventory & Room Creation
│   ├── bookings/page.tsx            # Booking Schedule & Guest Check-Ins
│   ├── calendar/page.tsx            # Live Availability Calendar
│   ├── earnings/page.tsx            # Revenue & Payouts
│   ├── co-hosts/page.tsx            # Co-Host Delegation Manager
│   ├── invites/page.tsx             # Active & Pending Invites
│   └── messages/page.tsx            # Guest Communications
│
├── co-host/                         # Co-Host Delegated Portal
│   ├── page.tsx                     # Co-Host Executive Dashboard
│   ├── properties/page.tsx          # Assigned Properties
│   ├── bookings/page.tsx            # Check-In Verification
│   ├── calendar/page.tsx            # Daily Operations Calendar
│   ├── earnings/page.tsx            # Property Split Agreements & Ledgers
│   ├── maintenance/page.tsx         # Desk & Room Maintenance Tickets
│   ├── hosts/page.tsx               # Primary Host Relationships
│   └── messages/page.tsx            # Operational Messaging
│
└── admin/                           # Super Admin Control Console
    ├── dashboard/page.tsx           # Global Metrics & Yield
    ├── co-hosts/page.tsx            # Co-Host Governance & Audit [NEW - Sep 24]
    ├── users/page.tsx               # Member & Role Directory (with Co-Host tab)
    ├── hosts/page.tsx               # Host Governance & Co-Host badges
    ├── bookings/page.tsx            # Global Booking Operations
    ├── finance/page.tsx             # System Financial Summaries
    ├── settlements/page.tsx         # Split Payout Settlements
    ├── coupons/page.tsx             # Discount Engine
    ├── audit-logs/page.tsx          # Activity Trail
    └── moderation/page.tsx          # Property Approval Queue
```

---

## 5. Seed Personas & Default Credentials

Following database reset or re-seeding (`node prisma/seed.cjs`):

| Persona | Role | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `ADMIN` | `admin@studioi.in` | `Admin@123` | Global Platform |
| **Primary Host** | `HOST` | `host@studioi.in` | `Host@123` | Lehariya & Horizon Workspaces |
| **Co-Host Delegate**| `HOST` | `cohost@studioi.in` | `CoHost@123` | Lehariya Campus Operations |
| **Member** | `USER` | `member@studioi.in` | `Member@123` | Coworking Bookings & Passes |

---

## 6. Verification & Run Commands

### Backend (`/backend`)
```bash
# Start backend in development mode
npm run start:dev

# Run database migrations
npx prisma migrate dev

# Seed database with sample personas, properties, units & banners
node prisma/seed.cjs

# Verify build
npm run build
```

### Frontend (`/frontend`)
```bash
# Start Next.js development server (Port 3000)
npm run dev

# Run full Next.js production build (Turbopack)
npm run build
```

---

*Document maintained automatically. For further architecture details, consult `docs/studio-i/API_CONTRACTS.md` and `docs/studio-i/CURRENT_STATE.md`.*
Now added everything in this file.
