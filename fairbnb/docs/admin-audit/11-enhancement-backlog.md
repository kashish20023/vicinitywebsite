# DELIVERABLE 11 — PROPOSED ENHANCEMENT BACKLOG

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Admin Engineering Enhancement Backlog  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Backlog Prioritization Framework

Items are prioritized based on technical criteria:
- **P0 — Critical:** Security risks, severe operational friction, or missing audit accountability.
- **P1 — High Value:** High operational productivity impact, cross-queue consolidation, immediate workflow acceleration.
- **P2 — Useful:** Operational ergonomics, visual enhancements, and non-blocking insights.
- **P3 — Future:** Advanced infrastructure enhancements requiring external integrations or substantial data volume.

---

## 2. Itemized Backlog

---

### ITEM 1: Operational Action Center (P0)

- **Feature:** Unified Operational Action Center on Overview Dashboard
- **Problem:** Admins must click through 4 different screens daily to discover pending KYC, pending listings, flagged reels, and pending payouts.
- **User:** Super Admin, Operations Lead.
- **Expected Benefit:** Reduces morning triage time by 75%; eliminates overlooked approvals.
- **Frontend Work:** Create `ActionCenter.tsx` widget on `/admin/dashboard` showing prioritized queue cards with 1-click review/approval buttons.
- **Backend Work:** Implement `GET /admin/operations/action-center` returning top 5 pending items per queue.
- **Database Work:** None (reads from existing `Property`, `User`, `ReelReport`, `PayoutRequest`).
- **Dependencies:** None.
- **Risk:** Low (read-only aggregation).
- **Estimated Complexity:** Small (1 day).
- **Priority:** **P0**

---

### ITEM 2: Next.js Edge Route Protection Middleware (P0)

- **Feature:** Edge-Level Route Guard Middleware (`src/middleware.ts`)
- **Problem:** `/admin/*` routes currently render client layout HTML before client-side API checks fail with 401/403.
- **User:** Security, Platform Integrity.
- **Expected Benefit:** Zero unauthorized layout rendering; instantaneous server-level redirects to login.
- **Frontend Work:** Add `src/middleware.ts` to check JWT presence/role claim on `/admin/:path*`.
- **Backend Work:** None.
- **Database Work:** None.
- **Dependencies:** None.
- **Risk:** Low (standard Next.js pattern).
- **Estimated Complexity:** Small (0.5 day).
- **Priority:** **P0**

---

### ITEM 3: Audit Trail Gap Remediation (P0)

- **Feature:** Mandatory Audit Logging for Host Impersonation and Feature Settings
- **Problem:** Host impersonation and system feature flag changes are currently executed with zero audit records.
- **User:** Security, Compliance.
- **Expected Benefit:** 100% accountability on high-stakes administrative mutations.
- **Frontend Work:** None.
- **Backend Work:** Call `auditLogService.logAction(...)` inside `impersonateHost` and `AdminSettingsService.updateSetting`.
- **Database Work:** None (records to existing `AuditLog` table).
- **Dependencies:** `AuditLogService`.
- **Risk:** None.
- **Estimated Complexity:** Small (0.5 day).
- **Priority:** **P0**

---

### ITEM 4: Platform Health & Technical Diagnostics Hub (P1)

- **Feature:** Platform Health & Environment Telemetry
- **Problem:** Developers and technical admins have no visibility into database latency, memory pressure, or build version within the Admin UI.
- **User:** Developer, DevOps, Super Admin.
- **Expected Benefit:** Instant incident triage; eliminates the need to access terminal logs for basic database connectivity checks.
- **Frontend Work:** Create `PlatformHealthCard.tsx` on `/admin/settings` displaying database ping, memory usage, environment tag, and provider status.
- **Backend Work:** Implement `GET /admin/system/health` returning safe runtime telemetry and Prisma latency.
- **Database Work:** None.
- **Dependencies:** None.
- **Risk:** Low (read-only diagnostics).
- **Estimated Complexity:** Small (1 day).
- **Priority:** **P1**

---

### ITEM 5: Global Multi-Entity Command Search (P1)

- **Feature:** Global Quick Search (`Cmd + K` / Search Input)
- **Problem:** Top navigation search bar is static; searching requires navigating to individual tables.
- **User:** All Admin Personas.
- **Expected Benefit:** Fast 1-second lookup of any user, property title, or booking confirmation code.
- **Frontend Work:** Wire `AdminHeader.tsx` search input to a Command Palette dropdown with keyboard navigation.
- **Backend Work:** Implement `GET /admin/search?q={query}` searching `User`, `Property`, and `Booking`.
- **Database Work:** Add composite indexes on `User(name, email, phone)` and `Property(title)` if needed.
- **Dependencies:** None.
- **Risk:** Low (query throttled and limited to `take: 5` per entity).
- **Estimated Complexity:** Medium (1.5 days).
- **Priority:** **P1**

---

### ITEM 6: Property Health & Listing Completeness Signals (P1)

- **Feature:** Property Quality & Completeness Scoring
- **Problem:** Reviewers approving listings in `/admin/verification` cannot quickly evaluate listing quality.
- **User:** Moderator, Super Admin.
- **Expected Benefit:** Standardizes listing quality; reduces review time per property from 5 minutes to 1 minute.
- **Frontend Work:** Add Completeness percentage badge and missing item tags (`NO_WIFI`, `LOW_PHOTOS`) on listing cards.
- **Backend Work:** Add a pure score calculation method in `admin.service.ts`.
- **Database Work:** None (uses existing columns in `Property`).
- **Dependencies:** None.
- **Risk:** None.
- **Estimated Complexity:** Small (1 day).
- **Priority:** **P1**

---

### ITEM 7: User Activity Chronological Timeline (P2)

- **Feature:** Consolidated User Activity Timeline
- **Problem:** Investigating suspicious accounts or verifying dispute context requires opening 4 separate pages.
- **User:** Dispute Resolver, Trust & Safety.
- **Expected Benefit:** Comprehensive 360-degree timeline of user events in a single view.
- **Frontend Work:** Build a vertical `UserTimelineDrawer.tsx` component.
- **Backend Work:** Implement `GET /admin/users/:id/timeline` merging historical events.
- **Database Work:** None (relational query on existing tables).
- **Dependencies:** None.
- **Risk:** Low (paginated query).
- **Estimated Complexity:** Medium (1.5 days).
- **Priority:** **P2**

---

### ITEM 8: Operational Anomaly Flags (P2)

- **Feature:** Payment Failure Spike & High Cancellation Alerts
- **Problem:** Financial anomalies are not caught until month-end ledger audits.
- **User:** Finance Operations, Super Admin.
- **Expected Benefit:** Proactive fraud and payment gateway failure detection.
- **Frontend Work:** Anomaly banner on `/admin/finance` and `/admin/dashboard`.
- **Backend Work:** Implement `GET /admin/operations/anomalies` checking 24h failure thresholds.
- **Database Work:** None.
- **Dependencies:** None.
- **Risk:** Low.
- **Estimated Complexity:** Medium (1.5 days).
- **Priority:** **P2**

---

### ITEM 9: Granular Sub-Role Permissions (P3)

- **Feature:** Persona-Based Fine-Grained Permissions (Developer, Moderator, Finance)
- **Problem:** All admins share the unrestricted `UserRole.ADMIN` role.
- **User:** Security, Enterprise Governance.
- **Expected Benefit:** Principle of least privilege; prevents accidental financial approvals by moderators.
- **Frontend Work:** Conditional navigation item rendering based on assigned permissions.
- **Backend Work:** Implement custom claims or permission guard middleware.
- **Database Work:** Optional `permissions` relation or sub-role field on `User`.
- **Dependencies:** Migration strategy for existing admin accounts.
- **Risk:** Medium (requires careful backward compatibility).
- **Estimated Complexity:** Large (3–4 days).
- **Priority:** **P3**
