# DELIVERABLE 4 — CURRENT USER JOURNEY AUDIT

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Admin User Journeys, Operational Workflows & Friction Analysis  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Persona Overview

While the database currently has a single `UserRole.ADMIN` enum, the real-world administrative operations at Fairbnb are executed across 4 distinct operational personas:
1. **Super Admin:** Executive oversight, platform configuration, strategic dispute resolution, high-level approvals.
2. **Developer / DevOps:** Technical health monitoring, release verification, error inspection, third-party gateway diagnostics.
3. **Content & Community Moderator:** Verification of properties, KYC document reviews, user report triage, UGC/Reel moderation.
4. **Finance Operations:** Payout approvals, split settlement tracking, refund management, fee reconciliation.

---

## 2. Journey 1: Super Admin (Executive & Exception Handling)

### Current Workflow
```text
Login 
  ↓ 
/admin/dashboard (Inspect top-level KPI counters)
  ↓ 
Spot potential bottleneck (e.g. pending properties counter shows "12")
  ↓ 
Navigate via Sidebar to /admin/verification
  ↓ 
Review listing documents, check host identity
  ↓ 
Approve listing or issue rejection reason
  ↓ 
Return to /admin/dashboard to check next counter
```

### Identified Operational Friction
1. **Lack of an Action Center:** The Super Admin must manually visit 4 separate pages (`/admin/verification`, `/admin/moderation`, `/admin/finance`, and `/admin/support`) every morning to check what requires immediate sign-off.
2. **Context Switching:** Reviewing a property in `/admin/verification` does not show the host's existing track record (e.g. how many listings they already operate, past cancellation rate). The admin must open a second tab to `/admin/hosts/[id]`.
3. **No Batch Operations:** Approving multiple verified properties from established Superhosts requires clicking into each listing one by one.

---

## 3. Journey 2: Developer / DevOps (Platform Health & Diagnostics)

### Current Workflow
```text
Login 
  ↓ 
/admin/dashboard (No technical metrics available)
  ↓ 
Navigate to /admin/settings (Only Reels feature flag toggle present)
  ↓ 
Navigate to /admin/audit-logs (Browse unstructured log entries)
  ↓ 
Open external cloud terminal/logs to diagnose backend errors or database pressure
```

### Identified Operational Friction
1. **Zero Runtime Observability in Admin:** No system metrics for database connection pool, Redis cache status, background job queues, or external API latency (Razorpay, Cashfree, AWS S3).
2. **Missing Version & Release Telemetry:** No indicator of current git commit hash, build timestamp, active environment (`production` vs `staging`), or Node.js/NestJS runtime version.
3. **No Error Incident Feed:** Server 500 errors, failed webhook callbacks (Razorpay/Cashfree), and cron failures are invisible in the Admin UI; developers are forced to inspect raw terminal logs.

---

## 4. Journey 3: Moderator (KYC, Listings & UGC Queue)

### Current Workflow
```text
Login 
  ↓ 
Navigate to /admin/verification (Properties & User KYC)
  ↓ 
Inspect identity document / property images
  ↓ 
Select Approve or Reject with comment
  ↓ 
Navigate to /admin/moderation (Flagged Reels queue)
  ↓ 
Play flagged reel, evaluate reported reason
  ↓ 
Resolve report or take down reel
```

### Identified Operational Friction
1. **Split Queues:** Property verification and Reel moderation are separated into two distinct pages with different UI paradigms (`/admin/verification` uses a split tab, while `/admin/moderation` uses a card grid).
2. **Missing History on Reporter:** When evaluating a flagged Reel, the moderator cannot see if the reporting user is a repeat false reporter or a verified guest.
3. **Lack of Keyboard Shortcuts:** For high-volume moderation, having to click through modals without keyboard shortcuts (`A` for Approve, `R` for Reject, `N` for Next) slows down throughput by 60%.

---

## 5. Journey 4: Finance Operations (Collections, Payouts & Settlements)

### Current Workflow
```text
Login 
  ↓ 
Navigate to /admin/finance (Review GBV and collections)
  ↓ 
Inspect Pending Payout Requests table
  ↓ 
Approve payout for host
  ↓ 
Navigate to /admin/settlements (Review co-host revenue splits)
  ↓ 
Search for booking ID to verify allocation
  ↓ 
Navigate to /admin/bookings (If a refund needs to be processed)
```

### Identified Operational Friction
1. **Three Disconnected Financial Pages:** Collections are on `/admin/finance`, splits are on `/admin/settlements`, and refunds are on `/admin/bookings`. When reconciling a cancelled stay with co-host payouts, the finance operator must cross-reference 3 browser tabs.
2. **Missing Anomaly Warnings:** High-risk financial operations (e.g. payout amount exceeding host's lifetime earnings or multiple refunds on the same booking) do not display prominent alert flags.
3. **No Export to CSV/Excel:** Generating financial reports for external accounting requires manual screen copying; there is no 1-click export of settlement ledgers.

---

## 6. Summary Friction & Priority Scorecard

| Persona | Primary Friction | Productivity Impact | Recommended Audit Solution |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Fragmented task queues | High | **Consolidated Action Center** on Dashboard |
| **Developer** | Zero system health & error visibility | Critical | **Platform Health & Diagnostics Hub** |
| **Moderator** | Disconnected queues & lack of context | Medium | **Unified Moderation Hub & Listing Health Signals** |
| **Finance** | Disjointed financial pages & no CSV export | High | **Unified Financial Hub & Anomaly Detection** |
