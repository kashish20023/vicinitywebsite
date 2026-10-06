# FairBnB Reels — Production Implementation Plan

**Date**: 24 September 2026  
**Auditor & Architect**: Senior Video-Streaming & Product Architect (Antigravity AI)  
**Roadmap Framework**: Aligned with `FAIRBNB_REELS_PRODUCTION_PLAN.md` proposal and `BASELINE_AUDIT.md` empirical findings.

---

## 1. Prioritized Roadmap & Chunk Architecture

Based on the empirical baseline established in Chunk 0, the following prioritized backlog maps verified findings to execution chunks:

```
[Chunk 0: Audit & Baseline] (COMPLETED)
       │
       ▼
[Chunk 1: Processing & Publication Reliability] ◄── NEXT FOCUS
  ├─ Fix Creator Query Crash in Feed Service
  ├─ Normalize Route Aliases in Controller
  ├─ Enforce Strict Eager HLS Verification before Status PUBLISHED
  ├─ Bounded Fallback to Verified Local/CDN MP4 Assets
  └─ Tighten Webhook Timestamp Replay Window
       │
       ▼
[Chunk 2: Playback Correctness & Lifecycle]
  ├─ Restore Missing Like Button in ReelFeedCard UI
  ├─ Guarantee Single-Active Audio/Video Playback
  ├─ Drawer & Modal Visibility Pause Handlers
  ├─ Background VisibilityState Auto-Pause
  └─ Bounded Error Recovery UI
       │
       ▼
[Chunk 3: Adaptive Delivery & Controlled Prefetch]
  ├─ Validate Cloudinary ABR Streaming Ladder
  ├─ Bounded Next-Reel Prefetch (Metadata + First Segment only)
  ├─ Network Information API / Data-Saver Mode
  └─ Stale Prefetch Cancellation on Fast Swipe
       │
       ▼
[Chunk 4: User Experience & Booking Accuracy]
  ├─ Append `ref_reel_id` & Listing Attribution to Property Navigation
  ├─ Indicative Price Qualification ("From ₹.../night")
  ├─ Date/Guest Selection Handoff into Existing Booking Flow
  ├─ Feed Scroll Position Restoration on Return
  └─ Safe-Area & Contrast Polish
       │
       ▼
[Chunk 5: Feed, Engagement & Business Measurement]
  ├─ Idempotent Likes & Comments Under Concurrency
  ├─ Calibration of Comment Rate Limit (900s window relaxation)
  ├─ Non-blocking View Session Telemetry Deduplication
  └─ Moderation Status Integrity Guards
       │
       ▼
[Chunk 6: Production Qualification & Handoff]
  ├─ Full End-to-End Automated Regression Suite
  ├─ Performance Gate Validation (p95 Cold Start ≤ 1.5s, Warm ≤ 500ms)
  ├─ Operational Rollback Runbook & Feature Flag Gate
  └─ Handover Documentation
```

---

## 2. Detailed Chunk Specifications

### CHUNK 1 — Processing & Publication Reliability
- **Goal**: Ensure that video uploads, processing webhooks, feed queries, and publication states are bulletproof, reproducible, and incapable of crashing backend endpoints or generating dead 404 streaming URLs.
- **Scope of Work**:
  1. Fix `reels.service.ts:417` query bug: Change `{ userId: query.creatorId }` to `{ creatorId: query.creatorId }`.
  2. Standardize controller routes: Remove dead nested `/reels/api/reels` aliases in `reels.controller.ts`.
  3. Strict Eager Completion Gate: Do NOT set `status: 'PUBLISHED'` with a synthetic `hlsUrl` if Cloudinary has not confirmed actual eager transcoding. Keep in `PROCESSING` until confirmed, or publish with verified fallback `videoUrl`.
  4. Webhook Security Replay Window: Reduce acceptable timestamp skew from 86,400s (24 hours) to 300s (5 minutes) with non-production test allowance.
  5. Fallback Asset Verification: In development/offline environments where Cloudinary is unconfigured (`cloudinaryConfigured: false`), allow seed scripts and test creators to use local verified assets (`/videos/26118.mp4`, `/videos/26120.mp4`).
- **Gating Criteria**:
  - `GET /reels/creator/:id` returns 200 (not 500).
  - Webhook processing with invalid signature is rejected (401).
  - Duplicate webhooks execute idempotently without changing timestamps or resetting counters.
  - No synthetic 404 HLS URLs are stored as `hlsUrl`.

---

### CHUNK 2 — Playback Correctness & Lifecycle
- **Goal**: Guarantee a glitch-free, single-active video player experience with complete interactive controls.
- **Scope of Work**:
  1. Restore missing Like button in `ReelFeedCard.tsx` side action column with optimistic counter update, active heart state, and rate-limit error rollback.
  2. Ensure background/foreground pause: Add `document.addEventListener('visibilitychange')` so switching browser tabs instantly pauses playback and audio.
  3. Drawer pause: When `ReelCommentsModal` or `ReelReportModal` opens, pause the active video; resume when closed.
  4. Single active reel: Refine `reel-registry.ts` subscription to guarantee zero overlapping audio during rapid scrolling.
  5. Player Error States: Refine retry loop and provide user-friendly retry button instead of endless buffering spinner.
- **Gating Criteria**:
  - Like button renders and toggles like state with optimistic UI and backend persistence.
  - Exactly one audio source plays at any time.
  - Opening comments pauses video.
  - Switching tabs pauses video.

---

### CHUNK 3 — Adaptive Delivery & Controlled Prefetch
- **Goal**: Smooth playback startup across varying network conditions without runaway bandwidth consumption.
- **Scope of Work**:
  1. Bounded Prefetch: Prefetch only the next immediate reel poster and HLS manifest header; never pre-download full video segments for unseen reels.
  2. Cancel Stale Prefetch: On rapid swipe, cancel inflight prefetch requests.
  3. Data-Saver Mode: Detect `navigator.connection.saveData` or effective connection type (`2g`/`3g`) and constrain HLS buffer length and resolution.
  4. Audio Preference: Remember user's unmute preference across feed navigation via session storage without violating browser autoplay policies.
- **Gating Criteria**:
  - Rapid swiping does not queue unbounded downloads.
  - Startup time on warm prefetch $\le 500\text{ms}$.
  - Data saver mode restricts max buffer length.

---

### CHUNK 4 — User Experience & Booking Accuracy
- **Goal**: Transform passive video viewing into actionable, accurate accommodation bookings.
- **Scope of Work**:
  1. Attribution Parameters: Append `?ref_reel_id=${reel.id}` to tagged listing link.
  2. Deep Link & Return Context: Update URL query param `?reel=${reel.id}` as user scrolls; restore exact reel on return.
  3. Price Honesty: Display indicative rate badge ("From ₹.../night") clarifying that final total depends on selected dates and guests.
  4. Direct Booking Drawer: Provide "Check Availability" sheet opening date picker for the tagged property directly from the reel.
- **Gating Criteria**:
  - Clicking tagged listing passes `ref_reel_id`.
  - Navigating back to `/reels?reel=<id>` restores feed position.
  - Price label accurately represents base price.

---

### CHUNK 5 — Feed, Engagement & Business Measurement
- **Goal**: High-integrity engagement metrics, feed freshness, and abuse protection.
- **Scope of Work**:
  1. Calibrate comment rate limiting: Relax 3 comments per 15 mins to a more practical window (e.g., 5 per 60s) with clear 429 UI feedback.
  2. Non-blocking analytics batching: Deduplicate view session events and debounce milestone updates (25/50/75/100%).
  3. Admin Moderation: Ensure admin status changes (`HIDDEN`, `REJECTED`, `ARCHIVED`) immediately purge reel from public feed cache and active view sessions.
- **Gating Criteria**:
  - Concurrent like/unlike operations maintain correct DB counter consistency.
  - Hidden or rejected reels never appear in `GET /reels`.

---

### CHUNK 6 — Production Qualification & Handoff
- **Goal**: Comprehensive regression validation, operational runbooks, and gradual release readiness.
- **Scope of Work**:
  1. Full test execution (Jest backend + Vitest frontend + E2E integration).
  2. Performance benchmark report against proposed goals (Startup p95, rebuffer ratio).
  3. Rollback instructions and runbook for operations.
- **Gating Criteria**:
  - 100% test pass rate across all reels test suites.
  - Zero regressions on existing booking, payout, host, and co-host modules.

---

*Implementation Plan established. Awaiting explicit instruction before executing Chunk 1.*
