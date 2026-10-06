# FairBnB Reels — Baseline Architecture & Runtime Audit (Chunk 0)

**Date**: 24 September 2026  
**Auditor**: Senior Video-Streaming & Product Architect (Antigravity AI)  
**Target Repository**: `fairbnb--new` (c:\Users\shubham\fairbnb--new)  
**Execution Phase**: Chunk 0 (Read-Only Audit and Baseline)

---

## 1. Executive Summary & Verification Context

This document establishes the empirical baseline for the FairBnB Reels ecosystem prior to implementing Chunk 1. As mandated by the non-negotiable preservation rules, this audit was conducted in a read-only manner without modifying existing application source code, Prisma schema migrations, production media assets, or existing database records.

### Environment & Process Identity
- **Repository**: `c:\Users\shubham\fairbnb--new` (origin: `https://github.com/nikhilk070/fairbnb--new.git`)
- **Git Branch**: `main`
- **Git HEAD**: `9436646299946b367a825fc23684b357df0c2c1b`
- **Git Working Tree**: Clean except for previously verified and documented modifications in `docs/brain.md` and `frontend/src/app/admin/settlements/page.tsx`
- **Application Ports & Process Status**:
  - Frontend: `http://localhost:3000` (Next.js 16.3.1, PID: 4680, Listening on 0.0.0.0:3000)
  - Backend: `http://localhost:5000` (NestJS 11.0.1 on Express 5.0.0, PID: 20152, Listening on 0.0.0.0:5000)
  - Database: PostgreSQL 16 on `localhost:5432` (Docker) and `127.0.0.1:5433` (Local Dev Cluster `dev-db`, PID: 21420)
- **Test Harness Availability**:
  - Backend Jest Runner: Operational (`Jest 30.0.0`, `ts-jest`)
  - Frontend Vitest Runner: Operational (`Vitest 5.0.1`, `jsdom 30.1.0`)
  - System Browser Subagent: Playwright manager driver download failed (HTTP 404 from upstream Azure/Akamai driver mirrors: `playwright-1.57.0-win32_x64.zip`). Live runtime verification executed via Node.js HTTP/SSR client harness, component test runners, and curl.

---

## 2. End-to-End Reels Lifecycle & Trace Analysis

### 2.1 Direct Signed Upload & Ingestion
1. **Initiation**: Creator (Host or active Co-Host with `EDIT_LISTING`) invokes `POST /reels/upload-signature` (or `/api/reels/upload-signature`).
2. **Authorization Guards**:
   - `JwtAuthGuard`: Decodes Bearer token.
   - `ReelsFeatureGuard`: Validates feature flag toggle.
   - `ReelRateLimitGuard` with `@ReelThrottle(10, 60)`: Throttles to max 10 requests per minute per IP/user.
   - User Role Check: Rejects `USER` (Guests) with `403 Forbidden`. If `ADMIN` without property context, rejects with `403 Forbidden`.
   - Property Check: Verifies `property.hostId === user.id` OR active `CoHostRelationship` with `EDIT_LISTING` permission.
3. **Database Pre-allocation**:
   - Creates a new record in `model Reel` with status `DRAFT`.
   - Creates join record in `model ReelListing` if `propertyId` is provided.
4. **Cloudinary Signature Generation**:
   - Computes SHA-1 signature over `{ eager: 'sp_hd/m3u8', eager_async: true, folder: 'fairbnb/reels', public_id, timestamp }` using `CLOUDINARY_API_SECRET`.
   - Returns parameters to client without exposing the secret.

### 2.2 Client-to-CDN Transfer & Webhook Processing
1. **Direct Upload**: Browser posts video file directly to `https://api.cloudinary.com/v1_1/<cloudName>/video/upload`.
2. **Webhook Callback**: Cloudinary sends notification to `POST /reels/webhook`.
3. **Verification & State Machine**:
   - HMAC SHA-256 signature verification over `rawBodyString + timestamp + apiSecret`.
   - Validates `payload.resource_type === 'video'`.
   - Status transition:
     - `upload_failed` / `eager_failed` / `status === 'failed'` $\to$ `FAILED`.
     - Raw upload received (no eager HLS yet) $\to$ `PROCESSING`.
     - Eager HLS completed (variant `m3u8` present or `eager_status === 'complete'`) $\to$ `PUBLISHED`.
   - Replay safety: If already `PUBLISHED`, returns HTTP 200 idempotently. If `REJECTED` or `ARCHIVED`, forbids mutation.

### 2.3 Discovery & Feed Delivery
1. **Feed Endpoint**: `GET /reels?limit=10&cursor=<id>`.
2. **Database Query**:
   - Filters strictly for `status: 'PUBLISHED'`.
   - Applies deterministic V1 ranking order: `[{ rankingScore: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }]`.
   - Cursor pagination: `take: limit + 1`, `cursor: { id }`, `skip: 1`.
3. **Payload Sanitization**: Strips internal fields; maps creator profile and tagged property summary (`id`, `title`, `city`, `pricePerNight`, `thumbnailUrl`).

### 2.4 Playback & Player Lifecycle
1. **Container**: `ReelsFeed.tsx` renders full-screen snap container (`snap-y snap-mandatory overflow-y-auto`).
2. **Intersection Detection**: `ReelPlayer.tsx` monitors visibility using `IntersectionObserver` with threshold `[0, 0.5, 1.0]`. When intersection ratio $\ge 0.5$:
   - Coordinates single active playback via global event bus (`emitReelPlay(reel.id)` / `subscribeReelPlay`).
   - Initializes HLS stream lazily.
   - Triggers `video.play()` muted inline.
3. **Streaming Engine**:
   - Native HLS: Checks `video.canPlayType('application/vnd.apple.mpegurl')` for Safari/iOS.
   - HLS.js: Used on Chrome/Firefox/Edge/Android with worker and low-latency mode.
   - Network fallback: After 2 fatal network errors on HLS, falls back to direct MP4 `reel.videoUrl`.
4. **Cleanup**: On unmount or scroll-out, `destroyHls()` terminates HLS instance, clears media references, and pauses video.

### 2.5 Engagement & Interactivity
1. **Likes**: `POST /reels/:id/like` and `DELETE /reels/:id/like` with 30/minute rate limit. Unique constraint on `ReelLike(reelId, userId)`.
2. **Comments**: `POST /reels/:id/comments` with 3/15-minute rate limit.
3. **Reporting**: `POST /reels/:id/report` with 5/minute rate limit.
4. **Sharing**: `POST /reels/:id/share` for non-blocking analytics + native navigator.share / clipboard copy.

### 2.6 Property Handoff & Booking Attribution
1. **Property Link**: Property badge in `ReelFeedCard` links to `/properties/${property.id}`.
2. **Click Event**: Emits non-blocking `LISTING_CLICK` event to `POST /reels/:id/events`.
3. **Current Attribution Gap**: Does not carry `ref_reel_id` or date parameters in the property navigation URL.

---

## 3. Media & Stream Quality Analysis

### 3.1 Cloudinary Adaptive Bitrate (ABR) Status
- **Target Profile**: `sp_hd/m3u8` specified in `cloudinary.service.ts:53`.
- **Eager Generation Flag**: `eager_async: true`.
- **Verified Cloudinary Environment**:
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are not set in local `.env` (`cloudinaryConfigured: false` in `/health`).
  - Fallback Cloud Name: `'demo'`.
  - Fallback HLS URL: `https://res.cloudinary.com/demo/video/upload/sp_hd/v1/test.m3u8`.
  - **Empirical Check Result**: `https://res.cloudinary.com/demo/video/upload/sp_hd/v1/test.m3u8` returns **HTTP 404 Not Found**.
  - **Direct MP4 Check Result**: `https://res.cloudinary.com/demo/video/upload/v1/test.mp4` returns **HTTP 404 Not Found**.
  - **Impact**: Without genuine Cloudinary credentials or pre-transcoded demo assets, synthetic Cloudinary URLs fail and trigger the player's 2-retry network error before stalling.

### 3.2 Local Video Storage & Delivery
- **Local Assets Present**:
  - `frontend/public/videos/26118.mp4`: 8,978,729 bytes (8.56 MB), HTTP 200, `Accept-Ranges: bytes` supported.
  - `frontend/public/videos/26120.mp4`: 7,171,706 bytes (6.84 MB), HTTP 200, `Accept-Ranges: bytes` supported.
- **Delivery Protocol**: Local static HTTP byte-range serving via Next.js web server. Verified capable of chunked streaming and rapid seeking.
- **Format**: MP4 / H.264 video with AAC audio.

---

## 4. Test Harness & Baseline Measurements

### 4.1 Backend Unit & Integration Tests (Jest)
Command: `npm test -- backend/src/reels/`
- **Total Test Suites**: 12
- **Passed Suites**: 11
- **Failed Suites**: 1 (`reels-schema.spec.ts` timed out at default 5000ms during live PostgreSQL connect)
- **Total Tests**: 84
- **Passed Tests**: 83
- **Failed Tests**: 1
- **Execution Duration**: 133.9s

| Test Suite File | Tests | Status | Duration |
| :--- | :--- | :--- | :--- |
| `reels-feature-flag.spec.ts` | 5 | PASS | 1.8s |
| `reels-upload-signature.spec.ts` | 9 | PASS | 2.1s |
| `reels-webhook.spec.ts` | 8 | PASS | 119.5s |
| `reels-feed.spec.ts` | 8 | PASS | 2.4s |
| `reels-ranking.spec.ts` | 10 | PASS | 1.9s |
| `reels-engagement.spec.ts` | 8 | PASS | 2.5s |
| `reels-analytics.spec.ts` | 7 | PASS | 2.2s |
| `reels-profile.spec.ts` | 7 | PASS | 123.1s |
| `reels-moderation.spec.ts` | 8 | PASS | 95.9s |
| `reels-rate-limit.spec.ts` | 8 | PASS | 2.0s |
| `reels-observability.spec.ts` | 5 | PASS | 1.7s |
| `reels-schema.spec.ts` | 1 | FAIL (timeout 5s) | 23.3s |

### 4.2 Frontend Unit & Component Tests (Vitest)
Command: `npm test -- src/components/reels`
- **Total Test Suites**: 9
- **Passed Suites**: 9 (100%)
- **Total Tests**: 37
- **Passed Tests**: 37 (100%)
- **Execution Duration**: 88.5s

| Test File | Tests | Status | Focus Area |
| :--- | :--- | :--- | :--- |
| `ReelPlayer.test.tsx` | 6 | PASS | Video mounting, poster, mute toggle, error states |
| `ReelModeration.test.tsx` | 4 | PASS | Report modal reasons, submission, dismiss |
| `ReelEngagement.test.tsx` | 8 | PASS | Comments modal, share clipboard, button a11y |
| `ReelRateLimits.test.tsx` | 2 | PASS | 429 Too Many Requests toast presentation |
| `ReelAnalytics.test.tsx` | 4 | PASS | Session tracking, milestone progression (25/50/75/100) |
| `ReelAttribution.test.tsx` | 3 | PASS | Tagged listing card rendering, standard property URL |
| `ReelsFeed.test.tsx` | 4 | PASS | Skeleton loader, empty state, infinite scroll sentinel |
| `ReelPerformance.test.tsx` | 2 | PASS | Poster-first rendering, lazy video loading |
| `CreatorProfile.test.tsx` | 4 | PASS | Host tab switching, bio, superhost badge |

### 4.3 Live HTTP Endpoint Benchmarks
All endpoints executed against running backend on `http://localhost:5000`:

| Endpoint | Method | Response Status | Observed Payload / Behavior |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | 200 OK | `{ status: 'ok', reels: { database: 'connected', cloudinaryConfigured: false } }` |
| `/reels?limit=5` | `GET` | 200 OK | Returns `{ items: [ 1 item ], nextCursor: null }` in 18ms |
| `/reels/creator/:id` | `GET` | **500 Error** | **CONFIRMED BUG**: Prisma error due to invalid field `userId` |
| `/api/reels?limit=5` | `GET` | **404 Not Found**| **CONFIRMED BUG**: Controller nesting creates `/reels/api/reels` |
| `/reels/:id/like` | `POST` | 401 Unauthorized| Expected (requires Bearer JWT) |
| `/reels/:id/share` | `POST` | 200 OK | Increments share telemetry count |
| `/reels/:id/events` | `POST` | 200 OK | Accepts non-blocking playback session events |

---

## 5. Comprehensive Audit Findings & Classification

In accordance with Section 2 Evidence & Accuracy rules:

### Category 1: Reproduced Bugs

1. **`reels.service.ts:417` — Creator Filter Database Query Crash (HTTP 500)**
   - **Source Location**: `backend/src/reels/reels.service.ts` line 417.
   - **Reproduction**: Request `GET http://localhost:5000/reels/creator/any-id` or `GET /reels?creatorId=any-id`.
   - **Expected**: Return published reels matching `creatorId` (or empty array if none found) with HTTP 200.
   - **Actual**: Backend throws an unhandled Prisma exception resulting in HTTP 500 Internal Server Error.
   - **Root Cause**: The query condition writes `...(query.creatorId ? { userId: query.creatorId } : {})`. The `model Reel` in Prisma schema defines `creatorId String`, NOT `userId`.
   - **Smallest Justified Fix**: Change `{ userId: query.creatorId }` to `{ creatorId: query.creatorId }`.
   - **Regression Verification**: Add unit test in `reels-feed.spec.ts` asserting `creatorId` filter executes without error.

2. **`ReelFeedCard.tsx` — Like Button Missing from Rendered UI**
   - **Source Location**: `frontend/src/components/reels/ReelFeedCard.tsx` lines 40–96 and 234–263.
   - **Reproduction**: Navigate to `/reels` feed and inspect the action column on the right.
   - **Expected**: Interactive Like button with heart icon, like counter, and toggle handler.
   - **Actual**: State variables (`isLiked`, `likeCount`, `handleToggleLike`) exist in the component, but the Like button is omitted from the JSX in the side action column. Only Comment and Share buttons are rendered.
   - **Root Cause**: Accidental omission during component refactoring.
   - **Smallest Justified Fix**: Insert the Like button JSX with `Heart` icon, `likeCount`, and `handleToggleLike` in the side action column alongside Comment and Share.
   - **Regression Verification**: Add assertion in `ReelEngagement.test.tsx` verifying Like button render, count, and click behavior.

3. **`reels.controller.ts` — Redundant Nested Route Prefixes (`/reels/api/reels`)**
   - **Source Location**: `backend/src/reels/reels.controller.ts` lines 58, 102, 127, 154, 183, 208, 235, 262, 295, 322, 348, 369, 392, 417, 445, 490.
   - **Reproduction**: Issue `GET http://localhost:5000/api/reels`.
   - **Expected**: Direct access to `/api/reels` route if alias is intended.
   - **Actual**: Returns HTTP 404 because `@Controller('reels')` prefixes all sub-routes, producing `/reels/api/reels`.
   - **Root Cause**: Route decorators mistakenly prepended `api/reels` inside a controller already scoped to `'reels'`.
   - **Smallest Justified Fix**: Standardize on canonical `@Controller('reels')` routes. Clean up redundant pseudo-aliases that generate dead `/reels/api/reels` paths.
   - **Regression Verification**: Verify canonical routes pass via `reels.controller.spec.ts`.

---

### Category 2: Code-Confirmed Gaps

1. **Synthetic HLS Manifest 404 Failure Mode**
   - **Evidence**: `cloudinary.service.ts:165` synthesizes `https://res.cloudinary.com/${cloudName}/video/upload/sp_hd/v1/${publicId}.m3u8` when eager HLS is not returned by Cloudinary. When Cloudinary is not configured or eager generation has not executed, this URL is a 404, causing HLS.js fatal network errors and stalling before player fallback.
   - **Remediation**: Publish reels with `hlsUrl` ONLY when Cloudinary webhook confirms eager transcoding completion with an explicit valid `m3u8` variant URL. In dev/unconfigured environments, fall back directly to available MP4 assets.

2. **Booking Flow Referral Attribution Gap**
   - **Evidence**: `ReelFeedCard.tsx:196` links directly to `/properties/${item.property.id}` without preserving `ref_reel_id` or date/guest query parameters.
   - **Remediation**: Append `?ref_reel_id=${item.id}` to the property link and verify that checkout metadata records reel attribution.

3. **Return-to-Feed Position Loss**
   - **Evidence**: `ReelsFeed.tsx:36-46` supports deep-linking via `?reel=<id>`, but navigating to a property and clicking browser Back does not restore the user's exact scroll position in the vertical feed.

---

### Category 3: Documented Capabilities Not Yet Runtime-Verified

1. **Multi-Rendition Adaptive Bitrate Ladder Under Cellular Throttling**
   - **Status**: Eager profile `sp_hd` is defined in code, but live multi-bitrate ladder switching (1080p $\to$ 720p $\to$ 480p $\to$ 360p) requires an active Cloudinary account with video assets.
2. **Native iOS Safari HLS Inline Playback**
   - **Status**: Native HLS code branch `video.canPlayType('application/vnd.apple.mpegurl')` verified via Vitest mocks, but unverified on a physical iPhone in Chunk 0 due to local environment constraints.

---

### Category 4: Risks Requiring Investigation

1. **Cloudinary Webhook Replay Window Length (86,400s / 24 Hours)**
   - `cloudinary.service.ts:107` permits webhooks with timestamps up to 24 hours old. While protected by HMAC-SHA256, a 24-hour replay window is unusually wide; standard security guidance recommends $\le 300$ seconds (5 minutes).
2. **Comment Rate Limit Strictness (3 per 15 Minutes)**
   - `reels.controller.ts:144` restricts authenticated comments to 3 every 900 seconds. This is very restrictive for genuine user engagement. Should be reviewed in Chunk 5.

---

### Category 5: Optional Enhancements

1. **Dynamic Indicative Price Clarification**: Qualify `₹{pricePerNight}/night` with "From ₹..." or "Indicative rate" when no booking dates are selected.
2. **Background Tab Audio Mute**: Automatically pause video when `document.visibilityState === 'hidden'`.
3. **Data-Saver Toggle**: Add explicit low-bandwidth setting in player controls.

---

*Baseline Audit completed in full compliance with Chunk 0 instructions.*
