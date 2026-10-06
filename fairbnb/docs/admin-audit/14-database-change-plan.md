# DELIVERABLE 14 — DATABASE CHANGE PLAN

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Database Schema Evaluation & Optimization Plan  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Guiding Schema Policy

$$\textbf{Zero Unnecessary Tables} \quad | \quad \textbf{Maximize Existing Model Reuse} \quad | \quad \textbf{Zero Downtime}$$

A critical finding from Deliverable 6 (Data Availability Matrix) is that **every data attribute required for the proposed operational enhancements already exists** in PostgreSQL across Prisma models `User`, `Property`, `Booking`, `Payment`, `Refund`, `Settlement`, `AuditLog`, `SystemSetting`, `ReelReport`, and `Dispute`.

Therefore, **NO new database tables are created or required**.

---

## 2. Reused Tables & Column Mapping

| Capability | Reused Existing Table | Existing Columns Leveraged | New Columns Needed? |
| :--- | :--- | :--- | :---: |
| **Action Center** | `Property` | `id`, `title`, `verificationStatus`, `createdAt` | **None** |
| | `User` | `id`, `name`, `kycStatus`, `kycDocumentUrl` | **None** |
| | `ReelReport` | `id`, `reelId`, `reason`, `status`, `createdAt` | **None** |
| | `PayoutRequest` | `id`, `amount`, `status`, `createdAt` | **None** |
| | `Dispute` | `id`, `bookingId`, `status`, `createdAt` | **None** |
| **Platform Health** | None (Node runtime & connection ping) | `PrismaService.$queryRaw("SELECT 1")` | **None** |
| **Global Search** | `User` | `name`, `email`, `phone` | **None** |
| | `Property` | `title`, `city`, `slug` | **None** |
| | `Booking` | `id`, `externalId` | **None** |
| **Property Completeness** | `Property` | `images`, `wifiNetwork`, `houseRules`, `checkInInstructions` | **None** |
| **Audit Instrumentation** | `AuditLog` | `actorId`, `actorRole`, `action`, `entityType`, `details` | **None** |
| **Feature Rollouts** | `SystemSetting` | `key`, `value` (JSON) | **None** |

---

## 3. Recommended Performance Indexes (Non-Breaking)

To ensure that the newly proposed multi-queue Action Center and Global Search execute in **< 15ms**, the following database indexes are recommended for verification against the active PostgreSQL database:

```prisma
// Recommended composite index on User for fast name/email prefix search
@@index([name, email])

// Recommended index on Property for verification queue filtering
@@index([verificationStatus, createdAt])

// Recommended index on PayoutRequest for pending queue triage
@@index([status, createdAt])
```

### Index Safety & Migration Risk:
- Adding indexes in PostgreSQL via Prisma uses non-locking `CREATE INDEX CONCURRENTLY` in production migrations.
- Risk level: **Zero / Negligible**. No table locks, no data transformation, and no downtime.

---

## 4. Policy for Audit Phase

**Rule:** Per the audit charter, **NO Prisma schema files, database tables, or indexes have been modified** during this audit phase.
