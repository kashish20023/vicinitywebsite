# Pending External Gates & Environmental Prerequisites

**Date**: 2026-09-25  
**Branch**: `govind-temp`  
**Workspace**: `c:\Users\shubham\fairbnb--new`  

This document details the external gates that remain open due to environmental limitations outside the codebase, along with the exact steps required to close each gate once prerequisites are fulfilled.

---

## Gate 1: End-to-End Browser Automation (Playwright Driver)

### Status: BLOCKED (Upstream CDN 404 for Playwright Driver 1.57.0)

### Current Situation & Evidence:
- Automated browser testing subagent attempted to download Playwright driver for Windows x64.
- The official driver download URL returned an HTTP 404 error from upstream Azure Edge CDN (`https://playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip`).
- Playwright is not included in `frontend/package.json`. The backend script `npm run test:e2e` is a Supertest HTTP API test suite, not a browser automation runner.
- **Alternative Verification Executed**: The host has Google Chrome installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`. We successfully launched Chrome in headless mode with an isolated temporary profile against `http://localhost:3000/reels`. Chrome successfully completed React client-side hydration, fetched backend reels, and rendered the video player DOM (16,423 bytes).
- Full automated multi-gesture interaction testing requires an accessible Playwright driver package.

### Steps to Close Gate 1:
1. When Microsoft Azure CDN resolves the package archive, install Playwright in `frontend/`:
   ```bash
   cd frontend
   npm install -D @playwright/test
   npx playwright install chromium
   ```
2. Execute automated browser tests with gesture emulation:
   ```bash
   npx playwright test
   ```

---

## Gate 2: Live Cloudinary Provider Integration & Dynamic Transcoding

### Status: AWAITING EXTERNAL CREDENTIALS (Unconfigured in Local Dev)

### Current Situation & Evidence:
- The local environment has unconfigured Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_WEBHOOK_SECRET`).
- Unit and cryptographic tests (`reels-upload-signature.spec.ts`, `reels-webhook.spec.ts`) verify HMAC-SHA1 and HMAC-SHA256 signature generation, payload validation, and replay-attack protection (tolerance bounded to 300 seconds).
- `CloudinaryService` has been updated to support both `CLOUDINARY_WEBHOOK_SECRET` and `CLOUDINARY_API_SECRET`, as well as both SHA-1 (Cloudinary SDK default) and SHA-256 algorithms.
- Live video transcoding into HLS adaptive bitrate playlists (`.m3u8` master and multi-bitrate `.ts` segments) requires authentic provider credentials and an external callback endpoint.
- Webhook callbacks require a publicly routable, TLS-secured endpoint; local proxy ports cannot receive external Cloudinary notifications.

### Steps to Close Gate 2:
1. Provide valid Cloudinary credentials in `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_WEBHOOK_SECRET=your_webhook_secret
   ```
2. On staging or via an authorized secure tunnel, configure the Cloudinary notification URL to point to `POST /api/reels/webhook`.
3. Execute a test upload using a sample vertical video (9:16 aspect ratio, <= 60 seconds).
4. Confirm Cloudinary returns HTTP 200 on webhook callback and validates signature.
5. Verify that generated `hlsUrl` resolves correctly to adaptive bitrate playlists in production.

---

## Gate 3: Physical Mobile Device QA & Hardware Verification

### Status: AWAITING PHYSICAL HARDWARE (Hardware Unavailable in Desktop Container)

### Current Situation & Evidence:
- Physical iPhone (iOS Safari / WebKit) and Android (Chrome Mobile) devices are not physically tethered to the development desktop.
- Touch events, responsive CSS breakpoints (`max-w-md`, viewport height units, bottom navigation safe-areas), and accessibility have been verified programmatically and via headless Chrome rendering.
- Real hardware performance (thermal throttling, low-power mode, hardware-accelerated H.264/HEVC decoding, native PIP/fullscreen transitions) requires manual physical device testing.

### Manual Device Verification Checklist to Close Gate 3:
- [ ] **iOS Safari (iOS 16+)**:
  - Open `/reels` feed.
  - Verify autoplay with mute on initial viewport entry.
  - Tap volume button to unmute; verify sound plays without stutter.
  - Swipe vertically through 5 reels; verify previous reel immediately pauses and unloads buffers.
  - Lock screen and unlock; verify playback does not trigger in the background.
  - Tap "Check Dates"; verify booking drawer opens without keyboard overlap.
- [ ] **Android Chrome (Android 13+)**:
  - Open `/reels` feed under Data-Saver mode ("Lite mode" or 3G throttling).
  - Verify lowest bitrate (360p/480p) loads first with poster placeholder.
  - Tap "Share"; verify native Android Share Sheet opens.
  - Submit a comment; verify comment appears immediately and count increments.
