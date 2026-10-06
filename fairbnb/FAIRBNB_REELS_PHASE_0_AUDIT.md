# FairBnB Reels — Complete Phase 0 Repository & Architecture Audit

## 1. Executive Summary
This document represents the Phase 0 READ-ONLY Architecture Audit for **FairBnB Reels**, an Instagram-style short-video marketing and marketplace ecosystem. The objective of this audit is to analyze the existing repository (`backend` and `frontend`), identify reusable components, specify security boundaries, evaluate media streaming capabilities, and establish a bulletproof multi-phase roadmap before writing any Reels feature code.

Key conclusion: FairBnB possesses a robust NestJS + Prisma backend and Next.js 16 (App Router) frontend with well-defined role-based access control (`HOST`, `USER`, `ADMIN`) and co-host permission mechanics. However, media processing is currently localized to 10MB static image/PDF files on disk. Implementing Reels requires introducing Cloudinary signed direct uploads, HLS adaptive bitrate streaming (`.m3u8`), cursor-based feed pagination, and dedicated Reels data models.

---

## 2. Current Architecture
- **Monorepo / Workspace Structure**:
  - `backend/`: NestJS `11.0.1` framework, Prisma ORM `6.19.3`, TypeScript `5.7.3`, Node.js environment.
  - `frontend/`: Next.js `16.3.1` (App Router), React `19.2.8`, Tailwind CSS `v4`, Framer Motion `13.4.0`, Lucide React icons.
- **Communication Protocol**: RESTful JSON HTTP APIs (with Next.js rewrite proxy from `/backend-api/*` to `http://localhost:5000`).
- **Data Persistence Layer**: PostgreSQL managed by Prisma Client v6.

---

## 3. Authentication & Authorization
- **Auth Strategy**: Stateless JWT Bearer tokens issued upon login/OTP verification.
- **Backend Guards**:
  - `JwtAuthGuard` (`backend/src/auth/guards/jwt-auth.guard.ts`): Decodes Authorization header, verifies signature, populates `req.user` (`{ id, email, role }`).
  - `RolesGuard` (`backend/src/auth/guards/roles.guard.ts`): Enforces `@Roles(...)` metadata. Evaluates `user.role` against `UserRole` enum (`USER`, `HOST`, `ADMIN`).
- **Reels Role Constraint**:
  - `USER` (Guests) MUST be rejected by `RolesGuard` with HTTP `403 Forbidden` if attempting to request video upload signatures.
  - `HOST` and `ADMIN` are authorized by default.

---

## 4. Host/Co-host Permissions
- **Co-Host Model**: `CoHostRelationship` (`backend/prisma/schema.prisma` lines 660–694) connects `propertyId`, `hostUserId`, and `coHostUserId` with `status` (`INVITED`, `ACCEPTED`, `ACTIVE`, `REJECTED`, `SUSPENDED`, `REMOVED`).
- **Permission Guard**: `CoHostPermissionGuard` (`backend/src/co-host/guards/cohost-permission.guard.ts`) checks if the authenticated user is either the primary property host/owner (`property.hostId === user.id`) OR an active co-host with specific permissions (`CoHostPermissionEnum`).
- **Reels Tagging Rule**: A Co-Host can ONLY tag a property in a Reel if they hold an `ACTIVE` `CoHostRelationship` for that property.

---

## 5. Property Architecture
- **Property Model**: Primary entity (`Property` in `schema.prisma` line 100) identified by UUID string (`id`).
- **Host Ownership**: `hostId` (foreign key to `User.id`).
- **Listing Data**: Title, description, address, maxGuests, basePrice, images array, gallery Json, status (`PENDING`, `APPROVED`, etc.).
- **Reel Tagging Relationship**: A Reel belongs to creator `User` (`creatorId`) and references `Property` via `ReelListing` (many-to-many or one-to-many tagging).

---

## 6. Existing Media Infrastructure
- **Module**: `MediaModule` / `MediaService` (`backend/src/media/media.service.ts`).
- **Current Storage**: Filesystem storage in local `uploads/` folder.
- **Validation**: Strict whitelist for MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) and max file size (10MB).
- **Limitation**: Not configured for multi-gigabyte video files, transcoding, or streaming.

---

## 7. Video Capability
- **Cloudinary Integration**: Currently **NOT** installed or configured in `backend/package.json` or `frontend/package.json`.
- **Target Video Architecture**:
  - Direct Browser → Cloudinary upload using server-signed signature (`POST /api/reels/upload-signature`).
  - Cloudinary HLS Adaptive Bitrate Streaming (`master.m3u8` with 360p, 480p, 720p, 1080p renditions).
  - Fast-start playback strategy (`q_auto`, `f_auto`, low initial startup delay for slow network connections).

---

## 8. Database / Prisma Findings
- **ORM Version**: Prisma Client `v6.19.3`.
- **Primary Key Format**: UUID v4 strings (`@id @default(uuid())`).
- **Enums**: All enums defined in `schema.prisma` (e.g. `UserRole`, `CoHostStatus`, `CoHostPermissionEnum`).
- **Indexes**: Explicit B-tree indexes (`@@index([...])`) on relation fields.
- **Missing Reel Schema**: Models for `Reel`, `ReelListing`, `ReelLike`, `ReelComment`, `ReelReport` are absent and must be introduced in Phase 1.

---

## 9. Pagination
- **Existing Endpoints**: Traditional offset/limit (`page`, `limit` or `take`, `skip`) used in property searches and admin tables.
- **Reels Feed Requirement**: Offset pagination is unsuitable for high-frequency video feeds. Reels MUST use **Cursor Pagination** (`cursor`, `take`, `orderBy: { createdAt: 'desc' }`) to ensure zero duplicated or skipped videos during real-time feed updates.

---

## 10. Redis / Queue / Worker Infrastructure
- **Current Status**: Redis and Bull / BullMQ are **NOT** present in `backend/package.json`.
- **Task Scheduling**: NestJS `@nestjs/schedule` `v6.1.3` is available for scheduled background tasks.
- **Reels Strategy**: Phase 1–3 will rely on Cloudinary asynchronous webhooks (`POST /api/reels/webhook`) to handle video processing callbacks without requiring a Redis worker cluster initially.

---

## 11. Analytics
- **Existing Setup**: `AuditLog` module exists for tracking administrative actions.
- **Reels View Analytics**: Direct synchronous database writes (`UPDATE reels SET viewCount = viewCount + 1`) per view cause high lock contention. In Phase 9, batch aggregation or debounced view tracking will be implemented.

---

## 12. Booking Attribution
- **Booking Flow**: Guest selects `Property` → `POST /api/bookings` → Payment processing via Cashfree.
- **Attribution Strategy**: Reels will append `?ref_reel_id=<reelId>` to listing links. During checkout, `booking.metadata` or referral tracking stores `reelId` for conversion funnel analytics (`Reel View → Property Visit → Booking Start → Paid Booking`).

---

## 13. Profile Architecture
- **Host / User Profiles**: Defined under `frontend/src/app/host/` and public host views.
- **Reels Extension**: Host profiles will feature a dual-tab layout: `[ Listings ]` and `[ Reels ]`, displaying the creator's published video grid without creating duplicate user profile modules.

---

## 14. Dashboard Architecture
- **Host Dashboard**: `frontend/src/app/host/*` (Listings, Bookings, Earnings, Insights, Support).
- **Co-Host Dashboard**: `frontend/src/app/co-host/*` (Properties, Bookings, Earnings, Maintenance).
- **Reels Management**: A new **Reels** tab will be integrated into Host/Co-host navigation for draft management, upload progress, published video statistics, and deletion.

---

## 15. Frontend Architecture
- **Next.js Version**: `16.3.1` (App Router).
- **Styling & Icons**: Tailwind CSS `v4`, Lucide React `1.33.0`.
- **Animation Framework**: Framer Motion `13.4.0` (ideal for swipe gestures, card transitions, and popovers).
- **Feed Mechanics**: CSS vertical scroll-snap (`scroll-snap-type: y mandatory`), `IntersectionObserver` auto-play/pause for active video only.

---

## 16. Moderation / Reporting
- **Current Moderation**: Property listings have `verificationStatus` (`PENDING`, `APPROVED`, `REJECTED`).
- **Reels Moderation**: Guests can report reels (`ReelReport`). Flagged reels enter an admin queue in `src/app/admin/moderation` with options to `HIDE`, `REJECT`, or `ALLOW`.

---

## 17. Notification Infrastructure
- **Notification Model**: `Notification` model exists in `schema.prisma`.
- **Reels Integration**: Trigger notifications to Hosts when a Reel receives significant engagement (likes/comments) or when video processing completes.

---

## 18. Testing Architecture
- **Backend Test Framework**: Jest `v30.0.0` with `ts-jest` and `supertest`.
- **Execution Command**: `npm test` or `npx jest src/reels`.
- **Coverage Expectation**: Authorization unit tests (Guest rejection = 403), Cloudinary webhook verification, and cursor pagination unit tests.

---

## 19. Deployment / Infrastructure
- **Backend Port**: 5000 (`npm run start:dev`).
- **Frontend Port**: 3000 (`npm run dev`).
- **Environment Config**: Managed via `.env` (`DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_URL`, etc.).

---

## 20. Dependency Reuse
- **NestJS Modules**: Auth (`JwtModule`, `PassportModule`), Prisma (`PrismaModule`), Config (`ConfigModule`).
- **Frontend**: Framer Motion, Lucide Icons, Next.js `Image` component.

---

## 21. Reels Data Model Gap Analysis
The following new models are required in `schema.prisma`:
1. `Reel`: `id`, `creatorId` (relation User), `videoUrl`, `hlsUrl`, `posterUrl`, `caption`, `status` (`DRAFT`, `UPLOADING`, `PROCESSING`, `PUBLISHED`, `REJECTED`), `viewCount`, `likeCount`, `commentCount`, timestamps.
2. `ReelListing`: `id`, `reelId` (relation Reel), `propertyId` (relation Property).
3. `ReelLike`: `id`, `reelId`, `userId` (unique `[reelId, userId]`).
4. `ReelComment`: `id`, `reelId`, `userId`, `content`, timestamps.
5. `ReelReport`: `id`, `reelId`, `reporterId`, `reason`, `status` (`PENDING`, `RESOLVED`, `DISMISSED`).

---

## 22. API Architecture Recommendation
- RESTful endpoints under `/api/reels`:
  - `POST /api/reels/upload-signature` (Host/Co-host only)
  - `POST /api/reels/webhook` (Cloudinary callback)
  - `GET /api/reels/feed` (Public cursor pagination)
  - `GET /api/reels/creator/:creatorId` (Creator's reels)
  - `POST /api/reels/:id/like` & `DELETE /api/reels/:id/like`
  - `GET /api/reels/:id/comments` & `POST /api/reels/:id/comments`
  - `POST /api/reels/:id/report`

---

## 23. Media Architecture Recommendation
- Client requests signed Cloudinary params from NestJS.
- Direct POST upload from browser to Cloudinary CDN (`https://api.cloudinary.com/v1_1/<cloud_name>/video/upload`).
- Cloudinary generates poster frame + HLS `.m3u8` master manifest asynchronously.
- Cloudinary webhooks NestJS upon completion (`PROCESSING` → `PUBLISHED`).

---

## 24. Scalability Analysis
- High-read, low-write feed operations.
- HLS Adaptive Bitrate Streaming offloads video bandwidth to Cloudinary CDN.
- Cursor-based database queries indexed on `(status, createdAt, id)` prevent database bottlenecks.

---

## 25. Security Risks
1. **Unauthorized Upload Attempt**: Guest user bypasses UI and calls upload API directly. *Mitigation: Server-side `RolesGuard` + ownership check.*
2. **Invalid Property Tagging**: Host tags property owned by another host. *Mitigation: Server-side check verifying `property.hostId === user.id` or active co-host permission.*
3. **Webhook Forgery**: Malicious user posts fake Cloudinary completion webhooks. *Mitigation: Validate Cloudinary webhook signature.*

---

## 26. Performance Risks
1. **Slow Network Buffering**: High-res MP4 stalls on 3G/4G connections. *Mitigation: HLS adaptive streaming + fastStart strategy + poster pre-rendering.*
2. **DOM / Memory Bloat**: Rendering dozens of `<video>` elements simultaneously. *Mitigation: Pause non-visible videos, keep max 1 active player playing via `IntersectionObserver`.*

---

## 27. Existing Components That Should Be Reused
- `PrismaService` for database queries.
- `JwtAuthGuard`, `RolesGuard`, `CoHostPermissionGuard` for security.
- `AirbnbHeader` and `AirbnbFooter` for public navigation.
- Next.js rewrite proxy configuration.

---

## 28. Components That Must NOT Be Duplicated
- Do NOT create a separate user authentication module.
- Do NOT build a custom filesystem video storage handler.
- Do NOT duplicate property listing models or host profile models.

---

## 29. Proposed Reels Architecture

```text
Host / Co-Host Browser ──► GET /api/reels/upload-signature ──► NestJS (Auth Verified)
       │                                                              │ (Signed Token)
       ▼                                                              ▼
Cloudinary Upload API ◄───────────────────────────────────────────────┘
       │
       ▼ (Asynchronous Transcoding to HLS .m3u8 + Poster)
Cloudinary CDN
       │ (Webhook Notification)
       ▼
NestJS Webhook Handler ──► Prisma (Reel Status = PUBLISHED)
       │
       ▼
Guest App (/reels) ──► GET /api/reels/feed ──► HLS Adaptive Video Streaming
```

---

## 30. Proposed Implementation Phases
- **Phase 0**: Architecture Audit (Complete).
- **Phase 1**: Database Architecture (Prisma models & migrations).
- **Phase 2**: Secure Reel Upload Signature API.
- **Phase 3**: Cloudinary Transcoding & Webhook Processing.
- **Phase 4**: Adaptive Reel Player & Slow-Network UX.
- **Phase 5**: Guest Reel Feed & Vertical Scroll UI.
- **Phase 6**: Host / Co-Host Creator Dashboard.
- **Phase 7**: Profile Integration (Listings + Reels).
- **Phase 8**: Engagement (Likes, Comments, Shares).
- **Phase 9**: Views & Analytics.
- **Phase 10**: Booking Conversion & Attribution.
- **Phase 11**: Moderation & Reporting Queue.
- **Phase 12**: Rate Limiting & Abuse Protection.
- **Phase 13**: Performance Optimization & Virtualization.
- **Phase 14**: Feed Ranking & Recommendation Engine.
- **Phase 15**: End-to-End Testing Suite.
- **Phase 16**: Load Testing & CDN Benchmarking.
- **Phase 17**: Observability & Monitoring.

---

## 31. Phase-by-Phase Definition of Done
Each phase requires:
1. Isolated code implementation matching the roadmap.
2. Zero regression on existing tests.
3. Successful completion of phase-specific unit/integration tests.
4. Execution of the **Phase Completion Protocol** report.

---

## 32. Open Questions / Missing Information
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) will be required in `.env` for Phase 2/3 testing.

---

## 33. Final Architecture Verdict
The repository structure is clean, well-architected, and ready for Reels extension. By adhering to the 17-phase execution protocol and leveraging HLS adaptive streaming, FairBnB Reels will deliver a high-performance, low-latency short-video experience tailored for all network speeds.

---
*End of Audit Report*
