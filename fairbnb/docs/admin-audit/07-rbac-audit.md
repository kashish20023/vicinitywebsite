# DELIVERABLE 7 — RBAC AUDIT

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Role-Based Access Control (RBAC) & Authorization Review  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Existing Roles & Enum Architecture

In the database schema (`schema.prisma`), platform roles are defined as:
```prisma
enum UserRole {
  USER
  HOST
  ADMIN
}
```

### Critical Findings:
1. **Single Database Admin Enum:** Currently, **all** administrators share the same database enum value: `UserRole.ADMIN`. There are no database-level sub-roles for `DEVELOPER`, `MODERATOR`, or `FINANCE`.
2. **Co-Host Subsystem Separation:** Note that "Co-Host" is **not** an enum value in `UserRole`. A user remains `USER` or `HOST` with assigned permissions recorded in `CoHostRelationship` and `CoHostPermission` tables.
3. **Backend Authorization Guards:**
   - Protected endpoints utilize:
     ```typescript
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.ADMIN)
     ```
   - In `RolesGuard` (`backend/src/auth/guards/roles.guard.ts`):
     ```typescript
     if (user.role === UserRole.ADMIN || String(user.role).toUpperCase() === 'ADMIN') {
       return true;
     }
     ```
     Any user with `role === 'ADMIN'` currently has unrestricted access to all 78 administrative endpoints.

---

## 2. Capability vs Persona Matrix (Current vs Recommended)

The table below shows what access each persona currently has (Current: all `ADMIN` users can do everything) vs what access they *should* have once sub-role claims or granular permissions are introduced.

| Administrative Capability | Current Access | Super Admin | Developer | Moderator | Finance | Current Enforcement Location |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **System Settings & Feature Flags** | All ADMINs | ✅ Allowed | ✅ Allowed | ❌ Restricted | ❌ Restricted | Backend (`@Roles(UserRole.ADMIN)`) |
| **Platform Diagnostics & Health** | All ADMINs | ✅ Allowed | ✅ Allowed | ❌ Restricted | ❌ Restricted | Backend (Proposed) |
| **Host Impersonation** | All ADMINs | ✅ Allowed | ⚠️ Read-only | ❌ Restricted | ❌ Restricted | Backend (`POST /admin/hosts/:id/impersonate`) |
| **User Block / Unblock** | All ADMINs | ✅ Allowed | ❌ Restricted | ✅ Allowed | ❌ Restricted | Backend (`PATCH /admin/users/:id/status`) |
| **Property Approve / Reject** | All ADMINs | ✅ Allowed | ❌ Restricted | ✅ Allowed | ❌ Restricted | Backend (`PATCH /admin/properties/:id/verify`) |
| **Reel UGC Moderation** | All ADMINs | ✅ Allowed | ❌ Restricted | ✅ Allowed | ❌ Restricted | Backend (`PATCH /reels/admin/:id/status`) |
| **Host Payout Approval** | All ADMINs | ✅ Allowed | ❌ Restricted | ❌ Restricted | ✅ Allowed | Backend (`PATCH /admin/payouts/:id/approve`) |
| **Settlement Recalculation** | All ADMINs | ✅ Allowed | ❌ Restricted | ❌ Restricted | ✅ Allowed | Backend (`POST /admin/settlements/:id/recalculate`) |
| **Forced Booking Cancellation**| All ADMINs | ✅ Allowed | ❌ Restricted | ❌ Restricted | ✅ Allowed | Backend (`PATCH /admin/bookings/:id/cancel`) |
| **Dispute Resolution** | All ADMINs | ✅ Allowed | ❌ Restricted | ✅ Allowed | ⚠️ Financial only | Backend (`PATCH /disputes/:id/resolve`) |
| **Audit Log Inspection** | All ADMINs | ✅ Allowed | ✅ Allowed | ❌ Restricted | ⚠️ Financial only | Backend (`GET /admin/audit-logs`) |

---

## 3. High-Risk Security Findings

### Finding 1: Over-Permissioned Role
Because all admin team members share the `ADMIN` role, any employee granted access to moderate UGC or review KYC documents automatically has full backend permission to approve payouts, trigger forced refunds, recalculate settlements, and alter system feature flags.

### Finding 2: Missing Edge Middleware Enforcement
In `frontend/src/app/admin/`, there is no Next.js Edge `middleware.ts`. While the backend API securely returns `401/403` for all unauthorized requests, an unauthenticated user or normal guest navigating to `/admin/dashboard` renders the client shell and layout before the client-side `useEffect` catches the API error.

### Finding 3: Sensitive Operations Requiring Step-Up Verification
The following destructive or high-liability operations currently do not require confirmation prompts or secondary authentication:
- Host Impersonation (`POST /admin/hosts/:id/impersonate`)
- Property Ownership Transfer (`POST /admin/properties/:id/transfer`)
- Mass Payout Execution (`POST /admin/settlements/:id/execute-transfers`)
- System Feature Toggle (`PATCH /admin-settings`)

---

## 4. Policy for Audit Phase

**Rule:** As mandated by the audit instructions, **NO RBAC permissions or guards have been altered** in production code during this audit. Granular permissions will be introduced in phased, backward-compatible steps upon user approval.
