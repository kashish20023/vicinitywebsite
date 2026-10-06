# DELIVERABLE 8 — AUDIT & TRACEABILITY REVIEW

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Audit Trail Completeness & Traceability Review  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Existing Audit Architecture

The platform currently operates two dedicated audit mechanisms:
1. **`AuditLog` Table (`backend/src/audit-logs/`):** General-purpose operational log table storing:
   - `actorId` (String): ID of the user executing the action
   - `actorRole` (String): Role of the actor
   - `action` (String): Verb (e.g. `USER_STATUS_UPDATE`, `PROPERTY_VERIFICATION`, `COHOST_INVITATION_SENT`)
   - `entityType` (String): Target domain (e.g. `User`, `Property`, `Booking`)
   - `entityId` (String, nullable): Target primary key
   - `details` (JSON, nullable): Contextual payload (previous value, new value, reason)
   - `ipAddress` (String, nullable): Client IP
   - `createdAt` (DateTime): Immutable timestamp
2. **`FinancialAuditEvent` Table (`backend/src/payouts/`):** Dedicated, tamper-evident financial ledger tracking split calculations, payouts, manual adjustments, and provider transaction references.

---

## 2. Audit Trail Coverage Matrix

| Critical Administrative Action | Logged to Audit Trail? | Target Table | Records Previous vs New Value? | Records Reason / Notes? | Records Request / Trace ID? | Identified Gap |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **User Block / Unblock** | ✅ Yes | `AuditLog` | ✅ Yes | ✅ Yes (`blockReason`) | ❌ No | Missing Request ID |
| **User KYC Verification** | ✅ Yes | `AuditLog` | ✅ Yes | ✅ Yes (`kycNote`) | ❌ No | Missing Request ID |
| **Property Approval / Rejection** | ✅ Yes | `AuditLog` | ✅ Yes | ✅ Yes (`rejectionReason`) | ❌ No | Missing Request ID |
| **Property Ownership Transfer** | ✅ Yes | `AuditLog` | ✅ Yes | ⚠️ Partial | ❌ No | Missing Request ID |
| **Co-Host Status Override** | ✅ Yes | `AuditLog` | ✅ Yes | ⚠️ Partial | ❌ No | Missing Request ID |
| **Host Payout Approval** | ✅ Yes | `FinancialAuditEvent` | ✅ Yes | ✅ Yes | ⚠️ Provider Ref | Adequate |
| **Co-Host Split Recalculation**| ✅ Yes | `FinancialAuditEvent` | ✅ Yes | ✅ Yes (`revisionNumber`) | ⚠️ Yes | Adequate |
| **Booking Status Override** | ✅ Yes | `AuditLog` | ✅ Yes | ⚠️ Partial | ❌ No | Missing Request ID |
| **Host Impersonation Trigger** | 🔴 **NO** | None | ❌ No | ❌ No | ❌ No | **CRITICAL GAP:** Impersonation is not logged |
| **System Feature Flag Update**| 🔴 **NO** | None | ❌ No | ❌ No | ❌ No | **CRITICAL GAP:** SystemSetting changes not logged |
| **Reel UGC Takedown** | 🟡 Partial | `ReelReport` | ⚠️ Status only | ⚠️ Resolution notes | ❌ No | Missing unified `AuditLog` entry |
| **Banner Creation / Deletion** | 🔴 **NO** | None | ❌ No | ❌ No | ❌ No | Banner marketing changes not logged |

---

## 3. High-Priority Audit Gaps

1. **Host Impersonation Untracked:** When an admin calls `POST /admin/hosts/:id/impersonate`, no entry is created in `AuditLog`. For compliance and security oversight, every host impersonation event must be recorded with actor ID, target host ID, and timestamp.
2. **System Configuration Mutations Untracked:** In `AdminSettingsService.updateSetting(...)`, the `SystemSetting` table is upserted directly without calling `auditLogService.logAction(...)`. An admin can toggle `REELS_FEATURE_ENABLED` or adjust `defaultServiceFeeRate` with zero audit accountability.
3. **Absence of Distributed Request / Correlation ID:** No HTTP request correlation ID (`X-Request-ID`) is attached to audit log records. When an administrative operation fails or produces side effects, tracing logs across frontend and backend requires manual timestamp correlation.

---

## 4. Preservation Directive

- **Do NOT create a third audit table.**
- All identified gaps can and must be resolved simply by calling the existing `AuditLogService.logAction(...)` in `AdminSettingsService` and `impersonateHost`.
