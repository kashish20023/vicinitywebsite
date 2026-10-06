# 👑 FAIRBNB — ADMIN + HOST + CO-HOST COMPLETE AUTHORITY & VISIBILITY AUDIT

Document Generated: **September 17, 2026**  
Target Workspace: `Fairbnb Multi-Host & Co-Host Governance Portal`  
Audit Scope: End-to-End Deep Codebase Verification (`Prisma Schema` ➔ `NestJS Controllers/Guards` ➔ `API Layer` ➔ `Next.js 14 App Router UI`)

---

## 📌 A. Executive Summary

| System / Area | Backend Implementation | API Endpoint Coverage | Frontend UI Connection | Overall Status |
| :--- | :---: | :---: | :---: | :---: |
| **Authentication & RBAC** | 100% | 100% | 100% | 🟢 **Fully Working** |
| **Host System & Listing Management** | 95% | 95% | 90% | 🟢 **Fully Working** |
| **Host ↔ Co-Host System** | 95% | 95% | 90% | 🟢 **Fully Working** |
| **Admin Overview & User Admin** | 90% | 90% | 90% | 🟢 **Fully Working** |
| **Admin Property Moderation** | 95% | 95% | 90% | 🟢 **Fully Working** |
| **Admin Bookings & Refunds** | 90% | 90% | **0% (Mock UI)** | 🟡 **Partial (Frontend Mock)** |
| **Admin Finance & Collections** | 80% | 75% | **0% (Mock UI)** | 🟡 **Partial (Frontend Mock)** |
| **Audit Log System** | 70% | 70% | **0% (No UI)** | 🟡 **Partial (Frontend Missing)** |
| **Admin Co-Host Supervision** | 50% (Via Ownership Guard Bypass) | 0% (No Admin endpoint) | 0% (No Admin UI) | 🟡 **Partial (No Admin UI)** |
| **Analytics Engine** | 80% | 80% | **0% (Placeholder UI)** | 🟡 **Partial (Frontend Placeholder)** |

### Key Executive Finding:
The **Backend API and Database foundations are exceptionally strong** (90%+ implemented with NestJS, Prisma, and JWT/RBAC security). However, several key Admin screens (`/admin/bookings`, `/admin/finance`, `/admin/verification`) currently render **hardcoded static mock data** despite real backend endpoints existing. Furthermore, `FinancialTransaction` logging is not yet wired into the payment completion lifecycle, and Admin currently lacks a dedicated system-wide Co-Host supervision view.

---

## 🟢 B. What Is Already Working (Verified End-to-End)

| Feature | DB Model | Backend Service / Controller | Frontend Route / Component | Auth / RBAC Guard | Working Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Auth & Role Login** | `User` | [auth.service.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/auth/auth.service.ts) | [login/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/login/page.tsx) | `JwtAuthGuard` | 🟢 **100% Working** |
| **Host Listing Creation & Mgmt** | `Property` | [properties.service.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/properties/properties.service.ts) | `/host/listings` | `RolesGuard(HOST)` | 🟢 **100% Working** |
| **Co-Host Invitation & Token Hashing** | `CoHostInvitation` | [co-host.service.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/co-host/co-host.service.ts) | [InviteCoHostModal.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/host/properties/%5BpropertyId%5D/co-hosts/components/InviteCoHostModal.tsx) | `JwtAuthGuard` | 🟢 **100% Working** |
| **Co-Host Invite Accept/Decline** | `CoHostRelationship` | `CoHostService.acceptInvitation()` | `/co-hosts/invitations/[token]` | `JwtAuthGuard` | 🟢 **100% Working** |
| **Co-Host 17-Permission Enforcement** | `CoHostPermission` | [cohost-permission.guard.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/co-host/guards/cohost-permission.guard.ts) | `/co-host/properties/[propertyId]` | `CoHostPermissionGuard` | 🟢 **100% Working** |
| **Co-Host Payout Rule & India Scope (Max 1)** | `PayoutRule` | `CoHostService.configurePayoutRule()` | [CoHostCard.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/host/properties/%5BpropertyId%5D/co-hosts/components/CoHostCard.tsx) | `JwtAuthGuard` | 🟢 **100% Working** |
| **Co-Host Suspension / Reactivation** | `CoHostRelationship` | `CoHostService.suspendCoHost()` | [CoHostCard.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/host/properties/%5BpropertyId%5D/co-hosts/components/CoHostCard.tsx) | `JwtAuthGuard` | 🟢 **100% Working** |
| **Admin Platform Overview** | `User`, `Property` | [admin.service.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/admin/admin.service.ts) | [admin/dashboard/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/dashboard/page.tsx) | `RolesGuard(ADMIN)` | 🟢 **100% Working** |
| **Admin User Directory & Role Switch** | `User` | `AdminService.getAllUsers()` | [admin/users/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/users/page.tsx) | `RolesGuard(ADMIN)` | 🟢 **100% Working** |
| **Admin Account Block / Unblock** | `User` | `AdminService.updateUserStatus()` | [admin/users/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/users/page.tsx) | `RolesGuard(ADMIN)` | 🟢 **100% Working** |
| **Admin Property Moderation & Approve/Reject** | `Property` | `AdminService.verifyProperty()` | [admin/listings/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/listings/page.tsx) | `RolesGuard(ADMIN)` | 🟢 **100% Working** |
| **Admin Property Ownership Transfer** | `Property` | `AdminService.transferPropertyOwnership()` | `POST /admin/properties/:id/transfer` | `RolesGuard(ADMIN)` | 🟢 **Backend Working** |
| **Admin Host Impersonation** | `User` | `AdminService.impersonateHost()` | `POST /admin/hosts/:id/impersonate` | `RolesGuard(ADMIN)` | 🟢 **Backend Working** |

---

## 📊 C. Admin Authority Matrix

| Area | Admin Can View | Admin Can Modify | Backend Protected | UI Available | Working Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Users** | YES | YES | YES | YES | 🟢 **Fully Working** |
| **Hosts** | YES | YES | YES | YES | 🟢 **Fully Working** |
| **Co-Hosts** | NO (No global view) | NO | YES | NO | 🔴 **Missing Admin View** |
| **Properties** | YES | YES | YES | YES | 🟢 **Fully Working** |
| **Bookings** | YES (API) | YES (API) | YES | NO (Mock UI) | 🟡 **API Working, UI Mock** |
| **Guests Hub** | YES (API) | YES (Block) | YES | NO (Integrated in Users) | 🟡 **API Working, UI Partial** |
| **Operations (Maintenance/Disputes)** | YES (API) | YES (Resolve) | YES | NO (Host/CoHost UI only) | 🟡 **API Working, Admin UI Missing** |
| **Finance & Platform Revenue** | YES (API) | NO | YES | NO (Mock UI) | 🟡 **API Working, UI Mock** |
| **Host Payouts** | YES (API) | YES (Approve) | YES | NO (Mock UI) | 🟡 **API Working, UI Mock** |
| **Co-Host Payouts & Revenue Splits** | YES (DB) | NO | YES | NO | 🔴 **Missing Admin View** |
| **Refunds Processing** | YES (API) | YES (Process/Fail)| YES | NO (Mock UI) | 🟡 **API Working, UI Mock** |
| **KYC Identity Verification** | YES (API) | YES (Approve) | YES | NO (Mock UI) | 🟡 **API Working, UI Mock** |
| **Account Suspensions** | YES | YES | YES | YES | 🟢 **Fully Working** |
| **Audit Logs** | YES (API) | NO (Immutable) | YES | NO (No UI) | 🟡 **API Working, UI Missing** |

---

## 👥 D. Host ↔ Co-Host Permission & Matrix

| Feature | Host Authority | Co-Host Authority | Admin Authority | Enforced Location & Status |
| :--- | :---: | :---: | :---: | :--- |
| **Assign / Invite Co-Host** | YES | NO | YES (Via DB) | 🟢 Server-side (`InviteCoHostDto`) |
| **Remove / Revoke Co-Host** | YES | NO | YES (Via DB) | 🟢 Server-side (`CoHostService.removeCoHost`) |
| **Suspend / Reactivate Co-Host** | YES | NO | YES (Via DB) | 🟢 Server-side (`CoHostService.suspendCoHost`) |
| **Set Payout Split (Max 1 Paid Rule)** | YES | Must Confirm | YES (Via DB) | 🟢 Server-side (`validateMaxOnePaidCoHostRule`) |
| **View Assigned Property** | YES | Allowed if `VIEW_PROPERTY` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **Edit Property Listing** | YES | Allowed if `EDIT_LISTING` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **View / Sync Calendar** | YES | Allowed if `VIEW_CALENDAR` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **Manage Pricing & Discounts** | YES | Allowed if `MANAGE_PRICING` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **View Guest Bookings** | YES | Allowed if `VIEW_BOOKINGS` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **Cancel Guest Bookings** | YES | Allowed if `CANCEL_BOOKINGS` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **Message Guests (Chat)** | YES | Allowed if `MESSAGE_GUESTS` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **Manage Maintenance / Cleaning** | YES | Allowed if `MANAGE_MAINTENANCE` | YES (Bypass) | 🟢 Guard (`CoHostPermissionGuard`) |
| **View Host Private Payouts / Bank Details**| YES (Own) | 🔒 **BLOCKED (Forbidden)** | YES (Bypass) | 🟢 Guard (`CoHostService` DTO Sanitizer) |

---

## 🗄️ E. Database Audit (`prisma/schema.prisma`)

| Model Name | Table Purpose | Relations Correct? | Used in Services? | Status / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `User` | User accounts, roles, KYC, profiles | YES | YES | 🟢 Fully active (`USER`, `HOST`, `ADMIN`) |
| `Property` | Listing details, host reference, location | YES | YES | 🟢 Fully active |
| `Booking` | Reservations, dates, pricing breakdowns | YES | YES | 🟢 Fully active |
| `CoHostRelationship` | Permanent host-property-cohost link | YES | YES | 🟢 Fully active (Status: `ACTIVE`, `SUSPENDED`) |
| `CoHostPermission` | Granular 17 permission codes | YES | YES | 🟢 Fully active |
| `CoHostInvitation` | 7-day SHA-256 hashed invite tokens | YES | YES | 🟢 Fully active |
| `PayoutRule` | Split configuration per property listing | YES | YES | 🟢 Fully active (Max 1 paid co-host enforced) |
| `FinancialTransaction` | Immutable financial ledger | YES | ⚠️ Partial | 🟡 Model exists, but `recordFinancialTransaction()` is not called during booking payments |
| `AuditLog` | System governance log | YES | ⚠️ Partial | 🟡 Called for cohost & property approve/reject, missing on user block & refunds |
| `Refund` | Booking refund records | YES | YES | 🟢 Fully active in `BookingsService` |
| `PayoutRequest` | Host payout withdrawal queue | YES | YES | 🟢 Fully active in `AdminService` |
| `Dispute` | Guest-Host reservation disputes | YES | YES | 🟢 Fully active in `DisputesService` |
| `MaintenanceRequest` | Property maintenance/cleaning tickets | YES | YES | 🟢 Fully active in `MaintenanceService` |

---

## 🔌 F. Backend API Audit

```text
ADMIN ENDPOINTS
🟢 GET    /admin/overview                 -> Platform stats & metrics overview
🟢 GET    /admin/users                    -> All users with role & status filters
🟢 GET    /admin/users/hosts              -> Hosts list with property counts
🟢 GET    /admin/users/verification       -> Pending phone/email verification queue
🟢 PATCH  /admin/users/:id/verify         -> Verify user phone/email
🟢 GET    /admin/users/blocked            -> Blocked/suspended accounts
🟢 PATCH  /admin/users/:id/status         -> Block or activate user account
🟢 GET    /admin/properties               -> All properties with filters
🟢 GET    /admin/properties/pending       -> Properties awaiting approval
🟢 GET    /admin/properties/approved      -> Approved live properties
🟢 GET    /admin/properties/rejected      -> Rejected listings
🟢 PATCH  /admin/properties/:id/verify    -> 1-Click Approve or Reject listing
🟢 GET    /admin/guests                   -> Guests directory with lifetime stats
🟢 PATCH  /admin/guests/:id/block         -> Block/unblock guest
🟢 GET    /admin/hosts                    -> Hosts directory with active counts
🟢 POST   /admin/hosts/:id/impersonate    -> Generate Admin Host impersonation token
🟢 POST   /admin/properties/:id/transfer  -> Transfer property ownership between hosts
🟢 GET    /admin/stats                    -> Unified platform operational stats
🟢 GET    /admin/analytics/overview       -> Revenue time-series, GBV, ADR, Occupancy
🟢 GET    /admin/verifications/pending    -> KYC verification queue
🟢 PUT    /admin/users/:id/verify         -> Update KYC verification status
🟢 GET    /admin/collections              -> Platform financial collection & invoices
🟢 POST   /admin/messages/send            -> Send administrative direct message
🟢 GET    /admin/bookings                 -> All bookings (AdminBookingsController)
🟢 GET    /admin/bookings/summary         -> Aggregated booking metrics
🟢 GET    /admin/bookings/cancelled       -> Cancelled bookings queue
🟢 PATCH  /admin/bookings/:id/status      -> Force booking status update
🟢 PATCH  /admin/bookings/:id/cancel      -> Administrative booking cancellation
🟢 GET    /admin/refunds                  -> All refunds queue
🟢 POST   /admin/bookings/:id/refund      -> Admin initiated refund
🟢 PATCH  /admin/refunds/:id/process      -> Process refund to COMPLETED
🟢 GET    /admin/audit-logs               -> Audit logs query endpoint

HOST & CO-HOST ENDPOINTS
🟢 POST   /properties/:id/co-hosts/invite -> Host invites co-host with permissions
🟢 GET    /properties/:id/co-hosts        -> Host lists property co-hosts
🟢 PATCH  /co-hosts/:id/permissions       -> Host updates co-host permissions
🟢 PATCH  /co-hosts/:id/payout            -> Host sets co-host commission payout
🟢 POST   /co-hosts/:id/suspend           -> Host suspends co-host
🟢 POST   /co-hosts/:id/reactivate        -> Host reactivates co-host
🟢 DELETE /co-hosts/:id                   -> Host removes co-host
🟢 GET    /co-hosts/invitations/:token    -> Public view invitation details
🟢 POST   /co-hosts/invitations/:token/accept  -> Co-Host accepts invitation
🟢 GET    /co-host/me/properties          -> Co-Host lists assigned properties
🟢 GET    /co-host/properties/:id/dashboard -> Co-Host property workspace
```

---

## 💻 G. Frontend UI Connection Audit

| Page / Route | Component Path | Backend API Endpoint | Connected Status | Data Source |
| :--- | :--- | :--- | :---: | :--- |
| **Admin Overview** | `app/admin/dashboard/page.tsx` | `GET /admin/overview` | ✅ Connected | **Real DB Data** |
| **Admin Users** | `app/admin/users/page.tsx` | `GET /users`, `PATCH /users/:id/status` | ✅ Connected | **Real DB Data** |
| **Admin Listings Moderation** | `app/admin/listings/page.tsx` | `GET /properties/admin/all`, `PATCH /properties/:id/approve` | ✅ Connected | **Real DB Data** |
| **Admin Property Moderation** | `app/admin/moderation/page.tsx` | `GET /properties/admin/all?verificationStatus=PENDING` | ✅ Connected | **Real DB Data** |
| **Admin Bookings** | `app/admin/bookings/page.tsx` | `GET /admin/bookings` | ❌ **Disconnected** | 🛑 **Hardcoded Static HTML Table** |
| **Admin Finance** | `app/admin/finance/page.tsx` | `GET /admin/collections` | ❌ **Disconnected** | 🛑 **Hardcoded Mock Cards (`₹24.8L`)** |
| **Admin Verification** | `app/admin/verification/page.tsx` | `GET /admin/verifications/pending` | ❌ **Disconnected** | 🛑 **Hardcoded Mock Table (`Rahul Sharma`)** |
| **Admin Analytics** | `app/admin/analytics/page.tsx` | `GET /admin/analytics/overview` | ❌ **Disconnected** | 🛑 **Empty Placeholder Text** |
| **Admin Audit Logs** | `app/admin/audit-logs/` | `GET /admin/audit-logs` | ❌ **Page Missing** | 🛑 **No UI Page Created** |
| **Admin Co-Hosts Directory** | `app/admin/co-hosts/` | None | ❌ **Page Missing** | 🛑 **No UI Page Created** |
| **Host Co-Host Management** | `app/host/properties/[id]/co-hosts/` | `GET /properties/:id/co-hosts` | ✅ Connected | **Real DB Data** |
| **Co-Host Portal Dashboard** | `app/co-host/page.tsx` | `GET /co-host/me/properties` | ✅ Connected | **Real DB Data** |
| **Co-Host Property Workspace** | `app/co-host/properties/[id]/` | `GET /co-host/properties/:id/dashboard` | ✅ Connected | **Real DB Data** |

---

## 🚨 H. Security & Authorization Audit Findings

### 1. `RolesGuard` Strictness Bug (Potential Admin Lockout)
- **Location**: [roles.guard.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/auth/guards/roles.guard.ts#L33)
- **Issue**: `RolesGuard` evaluates `requiredRoles.includes(user.role)`. If a route specifies `@Roles(UserRole.HOST)`, an `ADMIN` user will be rejected with `403 Forbidden` because `RolesGuard` does **NOT** contain a top-level `if (user.role === 'ADMIN') return true;` bypass check.
- **Contrast**: `OwnershipGuard` and `CoHostPermissionGuard` **DO** explicitly contain `if (user.role === 'ADMIN') return true;`.

### 2. Missing Server-Side Audit Log Calls
- **Location**: [admin.service.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/admin/admin.service.ts)
- **Issue**: While `CoHostService` logs all co-host actions, `AdminService` only logs property approvals/rejections. Actions such as **User Block/Unblock**, **Property Transfer**, **KYC Verification**, and **Refund Processing** do NOT invoke `AuditLogService.logAction()`.

### 3. Financial Transaction Disconnect
- **Location**: [co-host.service.ts](file:///Users/ideaind/Desktop/tech/fairbnb/backend/src/co-host/co-host.service.ts#L991)
- **Issue**: `recordFinancialTransaction()` is defined in `CoHostService`, but is **never invoked** when bookings are created or payments are confirmed in `BookingsService` or `PaymentsService`. The `FinancialTransaction` table remains empty during normal booking flows.

---

## 📋 I. Missing Features & Deficit Inventory

### 🔴 P0 — Critical (Security & Core Integrity)
1. **RolesGuard Admin Bypass**: Add `if (user.role === 'ADMIN') return true;` to `RolesGuard` so Admins can access all Host-level management routes seamlessly.
2. **Financial Ledger Integration**: Wire `recordFinancialTransaction()` into `BookingsService.confirmBooking()` and payout workflows to ensure real ledger entries (`BOOKING_PAYMENT`, `PLATFORM_FEE`, `HOST_PAYOUT`, `COHOST_PAYOUT`).

### 🟠 P1 — Required (Admin Dashboard Connection)
1. **Connect Admin Bookings UI**: Wire [admin/bookings/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/bookings/page.tsx) to `GET /admin/bookings` with working filters and detail drawer.
2. **Connect Admin Finance UI**: Wire [admin/finance/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/finance/page.tsx) to `GET /admin/collections` and `GET /admin/stats`.
3. **Connect Admin Verification UI**: Wire [admin/verification/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/verification/page.tsx) to `GET /admin/verifications/pending` and `PUT /admin/users/:id/verify`.
4. **Connect Admin Analytics UI**: Build real time-series chart components in [admin/analytics/page.tsx](file:///Users/ideaind/Desktop/tech/fairbnb/frontend/src/app/admin/analytics/page.tsx) consuming `GET /admin/analytics/overview`.

### 🟡 P2 — Important (Admin Visibility & Governance)
1. **Admin Co-Host Supervision Hub**: Build `/admin/co-hosts` backend API (`GET /admin/co-hosts`) and frontend UI page to allow Admins to monitor all Host ↔ Co-Host relationships, status (`ACTIVE`/`SUSPENDED`), granted permission packages, and commission splits across the entire platform.
2. **Admin Audit Logs UI Page**: Build `frontend/src/app/admin/audit-logs/page.tsx` connected to `GET /admin/audit-logs` for system-wide activity auditability.

---

## 🛠️ J. Recommended Implementation Order

When you are ready to proceed with building, the safest step-by-step sequence is:

```text
1. 🛡️ FIX AUTHORIZATION:
   Add ADMIN bypass check to RolesGuard to ensure zero admin lockouts on host endpoints.

2. 🔌 CONNECT ADMIN BOOKINGS UI:
   Replace static mock table in /admin/bookings/page.tsx with real data from GET /admin/bookings.

3. 💰 CONNECT ADMIN FINANCE UI:
   Replace static mock numbers in /admin/finance/page.tsx with real metrics from GET /admin/collections.

4. 🪪 CONNECT ADMIN VERIFICATION QUEUE UI:
   Replace static mock list in /admin/verification/page.tsx with real KYC queue from GET /admin/verifications/pending.

5. 📈 CONNECT ADMIN ANALYTICS UI:
   Build time-series charts in /admin/analytics/page.tsx connected to GET /admin/analytics/overview.

6. 👥 BUILD ADMIN CO-HOST SUPERVISION HUB:
   Create GET /admin/co-hosts API and build /admin/co-hosts frontend page to view all host-cohost relationships & commission splits.

7. 📜 BUILD ADMIN AUDIT LOGS UI PAGE:
   Create /admin/audit-logs page connected to GET /admin/audit-logs and expand logAction() coverage across all admin operations.

8. 💳 FINANCIAL TRANSACTION LEDGER AUTOMATION:
   Call recordFinancialTransaction() automatically on booking payments and payout completions.
```
