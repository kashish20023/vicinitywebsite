# DELIVERABLE 3 — SENIOR FEATURE BOUNDARY

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Preservation of Existing Senior Architecture & Anti-Duplication Boundary  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Purpose & Guiding Principle

To prevent technical debt, accidental regressions, and code bloat, this document defines the **hard boundaries** around complex subsystems built by senior developers. Future enhancements must strictly integrate with or extend these components rather than introducing duplicate implementations.

---

## 2. Senior Subsystem 1: Co-Host Revenue Settlement & Payout Engine

### Existing Implementation
A high-integrity, automated revenue-split settlement engine managing multi-party payouts (Host + Co-Host + Platform Fees). It handles reconciliation, big-integer currency conversions (paise), revision history, and transfer intent lifecycles.

- **Frontend Location:** `src/app/admin/settlements/page.tsx`
- **Backend Location:** `backend/src/payouts/settlement.controller.ts`, `backend/src/payouts/settlement.service.ts`, `backend/src/payouts/transfer-execution.service.ts`, `backend/src/payouts/post-payout-adjustments.service.ts`
- **Database Location:** Tables `Settlement`, `SettlementRevision`, `SettlementAllocation`, `PayoutTransferIntent`, `PayoutTransferAttempt`, `PayoutAdjustment`
- **APIs:** 
  - `GET /admin/settlements`
  - `GET /admin/settlements/:id`
  - `POST /admin/settlements/:id/recalculate`
  - `POST /admin/settlements/:id/execute-transfers`
  - `POST /admin/settlements/:id/adjustments`
  - `POST /admin/settlements/reconcile-pending`
- **Who Can Use It:** Users with `UserRole.ADMIN`
- **How It Works:** On booking completion or payment capture, a `Settlement` is instantiated. When a co-host agreement exists on the property, rules in `PayoutRule` are evaluated to calculate percentage or fixed splits. BigInt paise math is enforced to prevent floating-point rounding errors.
- **What Should Be Reused:** All split calculations, transfer execution methods, adjustment records, and ledger tracking.
- **What Must NOT Be Duplicated:** Do NOT create any alternative commission calculation, secondary split ledger, or custom payout dispatch routine.

---

## 3. Senior Subsystem 2: Dynamic System Settings & Feature Flags

### Existing Implementation
A dynamic, key-value configuration system storing JSON values with hot-reloading capability.

- **Frontend Location:** `src/app/admin/settings/page.tsx`
- **Backend Location:** `backend/src/admin-settings/admin-settings.controller.ts`, `backend/src/admin-settings/admin-settings.service.ts`
- **Database Location:** Table `SystemSetting` (`key` VARCHAR UNIQUE, `value` JSON, `description` TEXT)
- **APIs:**
  - `GET /admin-settings`
  - `GET /admin-settings/:key`
  - `PATCH /admin-settings`
- **Who Can Use It:** Users with `UserRole.ADMIN`
- **How It Works:** Toggles runtime features (such as `REELS_FEATURE_ENABLED`) by updating JSON in PostgreSQL without requiring code deployments or container restarts.
- **What Should Be Reused:** The `SystemSetting` schema and `AdminSettingsService` for storing any platform-wide feature toggles, maintenance mode indicators, or threshold configs.
- **What Must NOT Be Duplicated:** Do NOT introduce a third-party feature flagging SDK, external configuration tables, or hardcoded environment variable toggles for features that need runtime administration.

---

## 4. Senior Subsystem 3: Dual Audit & Financial Traceability

### Existing Implementation
Two purpose-built audit architectures:
1. `AuditLog`: Captures actor identity, role, action, target entity type, entity ID, and arbitrary metadata in JSON.
2. `FinancialAuditEvent`: An immutable ledger tracking high-stakes monetary events (refund approvals, manual adjustments, payout transfers).

- **Frontend Location:** `src/app/admin/audit-logs/page.tsx`
- **Backend Location:** `backend/src/audit-logs/audit-logs.controller.ts`, `backend/src/audit-logs/audit-logs.service.ts`
- **Database Location:** Tables `AuditLog` and `FinancialAuditEvent`
- **APIs:** `GET /admin/audit-logs`
- **Who Can Use It:** Users with `UserRole.ADMIN`
- **How It Works:** Controllers invoke `AuditLogService.logAction(...)` during critical state changes (e.g. user status update, property verification, co-host suspension).
- **What Should Be Reused:** Inject `AuditLogService` into new services to record all administrative mutations.
- **What Must NOT Be Duplicated:** Do NOT create a separate logging table, file-based logger, or separate activity table.

---

## 5. Senior Subsystem 4: Host Impersonation & Contextual Switcher

### Existing Implementation
A zero-downtime, secure administrative impersonation service that allows Super Admins to preview the host dashboard as the target host without acquiring their password.

- **Frontend Location:** `src/app/admin/hosts/page.tsx` (Impersonate Action Button)
- **Backend Location:** `backend/src/admin/admin.controller.ts` (`impersonateHost`), `backend/src/admin/admin.service.ts`
- **Database Location:** Table `User`
- **APIs:** `POST /admin/hosts/:id/impersonate`
- **Who Can Use It:** Users with `UserRole.ADMIN`
- **How It Works:** Validates that the requested user is a host, creates a short-lived impersonation session context, and returns authenticated claims scoped to that host's assets.
- **What Should Be Reused:** The existing impersonation token generation and claims workflow.
- **What Must NOT Be Duplicated:** Do NOT create custom "switch user" or backdoor auth bypass endpoints.

---

## 6. Summary Boundary Table

| Capability | Existing Senior Implementation | Safe Extension Point | Strictly Prohibited Duplication |
| :--- | :--- | :--- | :--- |
| **Feature Flags** | `SystemSetting` table + `AdminSettingsService` | Add UI controls for new keys in `SystemSetting` | New flag table or hardcoded env overrides |
| **Audit Records** | `AuditLog` + `FinancialAuditEvent` | Add missing action events to `AuditLogService` | Separate audit logs / third-party logging DB |
| **Payout Splits** | `SettlementService` + `TransferExecutionService` | Read settlement status for Action Center | Custom commission math or payout scripts |
| **Host Preview** | `POST /admin/hosts/:id/impersonate` | Add audit log when impersonation is triggered | Direct JWT forging or credential extraction |
| **Property Flow**| `PropertyEditWizardView` + `AdminVerifyPropertyDto` | Expose property health/completeness scoring | Separate property edit views or tables |
