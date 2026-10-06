# DELIVERABLE 6 — DATA AVAILABILITY MATRIX

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Data Availability & Schema Feasibility Verification  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Objective

Every proposed enhancement must be strictly grounded in existing, verifiable database tables, columns, and system events. This document verifies whether the data required to power each proposed enhancement is already present, partially available, or missing.

---

## 2. Comprehensive Data Availability Matrix

| Proposed Capability | Required Data Elements | Existing Database Source | Data Available in DB? | Backend API Currently Available? | New DB Table/Column Needed? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Action Center** | Pending listings, KYC docs, open disputes, pending payouts, flagged reels | `Property`, `User`, `Dispute`, `PayoutRequest`, `ReelReport` | **Yes (100%)** | Partial (Exists across 5 separate endpoints) | **No** (Direct aggregation query) |
| **Platform Health** | Node.js process uptime, memory, DB latency, active environment | Node runtime, Prisma `$queryRaw` ping, `process.env` | **Yes (100%)** | No (Needs dedicated health endpoint) | **No** (Runtime telemetry) |
| **Property Completeness** | Amenities count, Wi-Fi details, check-in instructions, photo count | `Property.images`, `Property.wifiNetwork`, `Property.checkInInstructions`, `PropertyAmenity` | **Yes (100%)** | Partial (Included in property detail, but not scored) | **No** (Calculated dynamically) |
| **User Activity Timeline** | Chronological record of user registrations, bookings, listings, reviews, and admin updates | `User`, `Booking`, `Property`, `Review`, `AuditLog` | **Yes (100%)** | Partial (Independent queries exist) | **No** (Relational join on `userId`) |
| **Payment Anomaly Detection** | Failed payment spikes, large refund totals, multi-booking cancellations | `Payment.status`, `Refund.amount`, `Booking.status`, `Booking.guestId` | **Yes (100%)** | No (Needs anomaly rules query) | **No** (SQL aggregations on existing tables) |
| **Global Quick Search** | Search hits across names, emails, property titles, booking IDs | `User` (name, email, phone), `Property` (title, slug), `Booking` (id, externalId) | **Yes (100%)** | Partial (Separate per-page search APIs exist) | **No** (Consolidated search query) |
| **Settlement Audit Trail** | Payout split revisions, recipient allocation history | `Settlement`, `SettlementRevision`, `SettlementAllocation`, `FinancialAuditEvent` | **Yes (100%)** | Yes (`GET /admin/settlements/:id`) | **No** |
| **Feature Rollout Controls** | Dynamic key-value feature toggles | `SystemSetting` table (`key`, `value` JSON) | **Yes (100%)** | Yes (`/admin-settings`) | **No** |
| **Release & Git Telemetry** | Git commit hash, build version, environment tag | `package.json` version, `process.env.GIT_COMMIT_SHA` / `process.env.BUILD_TIME` | **Yes (100%)** | No (Expose in health endpoint) | **No** |

---

## 3. Findings & Constraints

1. **Zero New Database Tables Required:** 100% of the recommended enhancements can be powered entirely by existing database tables (`User`, `Property`, `Booking`, `Payment`, `Refund`, `Settlement`, `AuditLog`, `SystemSetting`, `ReelReport`, `Dispute`).
2. **Zero Schema Migration Risk:** None of the proposed enhancements require destructive schema migrations, altering column types, or dropping constraints.
3. **Missing Telemetry Data Identified:**
   - Server-side error event logging (e.g. unhandled 500 exceptions) currently prints to stdout (`console.error`). To support real-time error incident alerts in the future without an external service like Sentry, error events should be recorded into `AuditLog` with `entityType: "SYSTEM_ERROR"`.
