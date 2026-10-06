# MILESTONE 1 IMPLEMENTATION PLAN

**Milestone Name:** Admin Operational Action Center + Audit Gap Remediation + Route Guard Hardening  
**Document Status:** Pre-Code Approval Gate Document  
**Date:** September 2026  
**Auditor:** Senior Engineering Team  

---

## A. Files To Create

1. `frontend/src/app/admin/dashboard/components/ActionCenter.tsx`
   - **Purpose:** Presentation component displaying prioritized pending operational cards (KYC, Listings, Flagged Reels, Payouts, Disputes) with 1-click review and triage links.
2. `frontend/src/middleware.ts`
   - **Purpose:** Next.js Edge route guard protecting `/admin/:path*` from unauthorized client-side layout rendering by inspecting session presence and redirecting unauthenticated traffic to `/login?redirect=/admin`.
3. `backend/src/admin/action-center.spec.ts`
   - **Purpose:** Automated unit and regression test suite verifying the aggregation logic, ordering, and error resilience of `getActionCenter()`.

---

## B. Files To Modify

### 1. `frontend/src/app/admin/dashboard/page.tsx`
- **Current Purpose:** Main overview dashboard rendering KPI metrics cards, platform stats, and recent user/property lists.
- **Why It Needs Modification:** Needs to render the new `ActionCenter` component prominently between the PageHeader/KPI cards and the secondary overview tables.
- **Exact Intended Change:** Import `ActionCenter` and mount `<ActionCenter />` in the dashboard layout.
- **Risk:** **Low.** Purely visual container change; does not alter existing state or API calls on this page.

### 2. `backend/src/admin/admin.controller.ts`
- **Current Purpose:** Primary administrative controller exposing routes for users, hosts, properties, stats, and finance.
- **Why It Needs Modification:** Needs to expose the new `GET /admin/operations/action-center` endpoint.
- **Exact Intended Change:** Add `@Get('operations/action-center')` with `@Roles(UserRole.ADMIN)`.
- **Risk:** **Low.** New route addition; does not mutate any existing controller method signatures.

### 3. `backend/src/admin/admin.service.ts`
- **Current Purpose:** Core administrative business logic service handling aggregations, property verification, and host impersonation.
- **Why It Needs Modification:** 
  1. Needs to implement `getActionCenter()` aggregating the top pending items across `Property`, `User`, `ReelReport`, `PayoutRequest`, and `Dispute`.
  2. Needs to log `HOST_IMPERSONATION_STARTED` inside `impersonateHost(...)` via `AuditLogService`.
- **Exact Intended Change:**
  - Add `getActionCenter()` method using Prisma `findMany` queries with `take: 5` and `orderBy: { createdAt: 'desc' }`.
  - In `impersonateHost(hostId, adminUserId)`, call `this.auditLogService.logAction(...)`.
- **Risk:** **Low to Medium.** Modifies `impersonateHost`; mitigated by non-blocking audit logging that does not interrupt the impersonation token generation.

### 4. `backend/src/admin-settings/admin-settings.service.ts`
- **Current Purpose:** Manages dynamic key-value system settings in the `SystemSetting` table.
- **Why It Needs Modification:** Configuration changes (e.g. toggling `REELS_FEATURE_ENABLED` or fee rates) currently execute without an audit record.
- **Exact Intended Change:** Inject `AuditLogService` and call `this.auditLogService.logAction(...)` inside `updateSetting(...)` recording `SYSTEM_SETTING_CHANGED`, previous value, new value, and actor ID.
- **Risk:** **Low.** Reuses existing `AuditLogService`.

### 5. `backend/src/admin-settings/admin-settings.module.ts`
- **Current Purpose:** NestJS module declaring `AdminSettingsController` and `AdminSettingsService`.
- **Why It Needs Modification:** Needs to import `AuditLogModule` to satisfy dependency injection for `AuditLogService`.
- **Exact Intended Change:** Add `AuditLogModule` to the `imports` array.
- **Risk:** **Low.** Standard NestJS dependency wiring.

---

## C. APIs

| Method | Route | Purpose | Status | Authorization | Data Source |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/admin/operations/action-center` | Returns top prioritized pending action items across KYC, Listings, Reels, Payouts, and Disputes | **New** | `JwtAuthGuard` + `@Roles(UserRole.ADMIN)` | `Property`, `User`, `ReelReport`, `PayoutRequest`, `Dispute` |

---

## D. Database Schema Verification

```text
New Tables:     0 (Zero)
New Columns:    0 (Zero)
New Migrations: 0 (Zero)
```

*Verification:* All required data is already stored in existing PostgreSQL tables (`Property`, `User`, `ReelReport`, `PayoutRequest`, `Dispute`, `AuditLog`, `SystemSetting`). No database modifications or Prisma migrations are required.

---

## E. Role-Based Access Control (RBAC)

- **Action Center Access:** Restricted strictly to users with `role: UserRole.ADMIN`.
- **API Guard:** Protected with NestJS `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.ADMIN)`.
- **Preservation:** Non-admin roles (`USER`, `HOST`) receive `403 Forbidden` from the backend and are redirected by Edge middleware if attempting frontend access.
- **Existing Permissions:** No existing permissions or role definitions are modified or deleted.

---

## F. Audit Changes

The following specific audit events will be instrumented using the existing `AuditLogService`:

1. `HOST_IMPERSONATION_STARTED`:
   - Triggered when `POST /admin/hosts/:id/impersonate` is called.
   - Records: `actorId` (Admin), `action: 'HOST_IMPERSONATION_STARTED'`, `entityType: 'User'`, `entityId: host.id`, and `details: { hostEmail, hostName }`.
2. `SYSTEM_SETTING_CHANGED`:
   - Triggered when `PATCH /admin-settings` updates a key in `SystemSetting`.
   - Records: `actorId` (Admin), `action: 'SYSTEM_SETTING_CHANGED'`, `entityType: 'SystemSetting'`, `entityId: setting.key`, and `details: { key, previousValue, newValue }`.

---

## G. Route Guard & Edge Middleware

- **Current Mechanism:** Route protection is evaluated client-side inside individual page components (`useAuth` hook). Unauthenticated visitors experience a brief layout render before an API 401 triggers client redirection.
- **Proposed Route Protection:** Add `frontend/src/middleware.ts` using Next.js Edge runtime to intercept `/admin/:path*`.
  - Checks for auth token presence (in cookies or headers).
  - If token is absent or invalid, redirects immediately at the HTTP response level to `/login?redirect=/admin`.
- **Backend Authorization:** Unaltered. Every API route independently verifies the JWT cryptographic signature and `UserRole.ADMIN`.
- **Potential Regression Risks:** Ensuring static public assets (`/images`, `/_next`, `/favicon.ico`) and public auth routes (`/login`, `/register`) are excluded from the middleware matcher.

---

## H. Testing & Verification Plan

1. **Unit Tests:**
   - Execute `action-center.spec.ts` verifying that `getActionCenter()` returns empty arrays cleanly when no pending items exist, and correctly caps items at 5 per queue.
   - Verify that `updateSetting()` still succeeds if audit logging encounters an exception (graceful degradation).
2. **Integration & API Tests:**
   - Call `GET /admin/operations/action-center` with an Admin token: expect `200 OK` with valid JSON.
   - Call `GET /admin/operations/action-center` without a token: expect `401 Unauthorized`.
   - Call `GET /admin/operations/action-center` with a regular User token: expect `403 Forbidden`.
3. **Audit Log Verification:**
   - Trigger a setting update in `/admin/settings` -> verify a new row in `AuditLog` table with action `SYSTEM_SETTING_CHANGED`.
   - Trigger host impersonation -> verify a new row in `AuditLog` table with action `HOST_IMPERSONATION_STARTED`.
4. **Edge Route Guard Verification:**
   - Open an Incognito browser window and navigate directly to `http://localhost:3000/admin/dashboard`.
   - Verify immediate 307/308 redirect to `/login?redirect=/admin` without flashing the admin layout.
5. **Full Regression Suite:**
   - Run `npm run test` in frontend (Vitest: 37/37 passing).
   - Run `npm run build` in frontend (Next.js build: 0 errors).
   - Run `npm run build` in backend (NestJS build: 0 errors).

---

## I. Senior Feature Boundary Verification

The following senior systems are strictly untouched:
- **Settlement Split Engine:** Unchanged (`SettlementService`, `TransferExecutionService`).
- **Dynamic SystemSettings Feature Flags:** Unchanged (architecture preserved; only audit logging hook added).
- **Dual Audit Trails:** Unchanged (reuses existing `AuditLog` table without creating new tables).
- **Host Impersonation:** Unchanged (impersonation algorithm preserved; only audit logging hook added).
