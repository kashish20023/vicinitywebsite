# DELIVERABLE 12 — PROPOSED ARCHITECTURE

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Admin Target Architecture & Service Integration Design  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Architectural Philosophy: Anti-Duplication & Reuse

To preserve the stability of the existing Fairbnb production platform, the proposed architecture follows a strict rule:
$$\textbf{Zero Duplicate Services} \quad | \quad \textbf{Zero Duplicate Schemas} \quad | \quad \textbf{Extension via Composition}$$

All proposed enhancements integrate directly into existing controllers and services rather than establishing redundant parallel modules.

---

## 2. End-to-End Architectural Flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                           │
│  - Edge Guard Middleware (src/middleware.ts)                          │
│  - Action Center Widget (src/app/admin/dashboard/ActionCenter.tsx)     │
│  - Platform Health Tab (src/app/admin/settings/PlatformHealth.tsx)     │
│  - Global Command Palette (src/components/layout/AdminHeader.tsx)      │
│  - Property Health Indicators (src/app/admin/verification/...)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (Bearer JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API CONTROLLERS                         │
│  - AdminController (backend/src/admin/admin.controller.ts)             │
│  - AdminSettingsController (backend/src/admin-settings/...)           │
│  - AuditLogController (backend/src/audit-logs/...)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AUTHORIZATION & GUARDS                           │
│  - JwtAuthGuard (Validates cryptographic signature & expiry)          │
│  - RolesGuard (@Roles(UserRole.ADMIN) enforces administrative role)    │
│  - ThrottlerGuard (Rate limits administrative search & health pings)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                               │
│  - AdminService (Extends getActionCenter, getGlobalSearch, etc.)       │
│  - AuditLogService (Logs impersonation, settings mutations, audits)    │
│  - SettlementService (Reused for financial split ledgers)             │
│  - BookingsService (Reused for cancellations & refunds)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER (Prisma ORM)                       │
│  - Existing Tables: User, Property, Booking, Payment, Refund,          │
│    Settlement, AuditLog, SystemSetting, ReelReport, Dispute            │
│  - PostgreSQL Database Engine (Connection Pool & Relational Joins)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Placement of New Capabilities

| Capability | Recommended Frontend Location | Recommended Backend Location | Database Entities Utilized |
| :--- | :--- | :--- | :--- |
| **Action Center** | `src/app/admin/dashboard/` | Method in `AdminService` (`backend/src/admin/admin.service.ts`) | `Property`, `User`, `ReelReport`, `PayoutRequest`, `Dispute` |
| **Platform Health** | `src/app/admin/settings/` | Method in `AdminService` (`backend/src/admin/admin.service.ts`) | Runtime telemetry + `PrismaService.$queryRaw` |
| **Global Search** | `src/components/layout/` | Method in `AdminService` (`backend/src/admin/admin.service.ts`) | `User`, `Property`, `Booking` |
| **Property Completeness** | `src/app/admin/verification/` | Helper utility in `AdminService` | `Property` |
| **User Activity Timeline**| `src/app/admin/users/` | Method in `AdminService` (`backend/src/admin/admin.service.ts`) | `User`, `Booking`, `Property`, `Review`, `AuditLog` |
| **Impersonation Audit** | Existing button trigger | Method in `AdminService` (`impersonateHost`) | `AuditLog` |

---

## 4. Architectural Verification

1. **No Circular Dependencies:** Placing new aggregated query methods in `AdminService` prevents circular dependencies between modules since `AdminModule` already imports `PrismaModule` and `AuditLogModule`.
2. **Deterministic Response Times:** Aggregated queries (`ActionCenter`, `GlobalSearch`) utilize strict `take: 5` limits and database index lookups to ensure sub-50ms execution times.
3. **Stateless Scalability:** No sticky sessions or server-side in-memory caches are introduced; all state remains persisted in PostgreSQL and client JWT claims.
