# FairBnB to Studio I — Architecture Reuse & Adaptation Map (`FAIRBNB_REUSE_MAP.md`)

> **Single Source of Truth** for technical reuse, domain adaptations, and architectural exclusions from the reference project (`fairbnb--new`) to the target platform (`studioiwebsite`).

---

## 1. Top-Level Role Paradigm Shift

| Feature / Dimension | FairBnB Architecture | Studio I Coworking Specification |
| :--- | :--- | :--- |
| **Top-Level Roles** | 4 Roles: `GUEST`, `HOST`, `CO_HOST`, `ADMIN` | **EXACTLY 2 ROLES: `USER` and `ADMIN`** |
| **Host Portals** | Dedicated Host dashboard, earnings, onboarding, listings | **ELIMINATED**. Admins operate all campuses and buildings. |
| **Co-Host Portals** | Multi-party delegation, 21-bitmask permissions, co-host invite flows | **ELIMINATED**. No third role or external co-host portal. |
| **Staff Model** | Co-host assignment | Internal staff record or scoped `ADMIN` account with location/permission flags. |
| **Beneficiary Payouts** | Multi-recipient mandatory split (Host + Co-Host) | **Disabled-by-default optional feature**. Studio I uses direct collection mode. |

---

## 2. Exhaustive FairBnB Module Mapping

| FairBnB Module (`backend/src/*`) | Disposition | Adaptation Strategy / Coworking Rationale |
| :--- | :--- | :--- |
| **`auth/`** | **REUSE & ADAPT** | Retain JWT bearer token generation, Passport strategy, bcrypt password hashing, and session validation. Adapt user roles enum from `[GUEST, HOST, CO_HOST, ADMIN]` to `[USER, ADMIN]`. Add admin bootstrap CLI script. Remove phone OTP carrier dependencies in local tests (use dev OTP fallback). |
| **`users/`** | **REUSE & ADAPT** | Adapt profile entity to support corporate/business details (company name, GSTIN, billing address). Retain user blocking logic with explicit invariants (does not silently cancel paid bookings; invalidates active session tokens). |
| **`admin/`** | **ADAPT** | Retain admin controller structure and audit mechanisms. Adapt dashboard metrics from room nights to: reserved occupancy, active presence, desk/cabin bookings, today's check-ins/outs, and direct collection totals. |
| **`properties/`** | **REBUILD FOR COWORKING** | Hospitality property/room model is replaced by a hierarchical coworking inventory: `Workspace` (Campus) -> `Building` -> `Floor` -> `Zone` -> `Unit` (Hot Desk, Dedicated Desk, Private Cabin, Meeting Room, Event Space). |
| **`floor-plans/`** | **NEW / REBUILD** | FairBnB had no interactive vector/grid floor plan engine. Build custom 2D canvas/grid engine with unit placement, dimensions, rotation, capacity, and live status. |
| **`bookings/`** | **ADAPT** | Replace nightly `[checkInDate, checkOutDate]` with exact reservation intervals `[startDateTime, endDateTime]` (half-open `[start, end)`). Support hourly, daily, weekly, and monthly sellable plans. Implement atomic holds with 10-min TTL. Enforce 2-month minimum commitment for monthly dedicated desk/cabin contracts. |
| **`coupons/`** | **REUSE & ADAPT** | Retain coupon validation engine: flat and percentage discounts, min order amount, max discount caps, expiry date, per-user and global usage limits. Adapt to support workspace/plan scoping. Ensure transactional reserve/consume/release across booking hold lifecycle. |
| **`payments/`** | **ADAPT** | Retain server-side order generation and signature verification. Adapt provider abstraction with explicit `MOCK` simulation provider for local test and demo isolation. Support UPI, Card, Net Banking, and Wallet credits. |
| **`settlement/`** | **ADAPT** | Direct revenue collection mode is primary. Adapt double-entry financial snapshots (`BookingFinanceSnapshot`) and append-only ledger entries for customer receipts, taxes, and refunds. Adapt beneficiary settlements as a disabled-by-default admin module with explicit SIMULATED execution mode. |
| **`calendar/`** | **ADAPT** | Retain date availability logic but shift from day-level calendar blocks to timestamp-level slot intervals, operating hours (e.g. 8 AM - 11 PM), holidays, and maintenance blocks. |
| **`amenities/`** | **REUSE & ADAPT** | Retain tag and category catalog. Adapt amenity definitions for coworking: High-Speed Fiber WiFi, Ergonomic Herman Miller Chairs, 4K Wireless Presentation, Soundproof Phone Booths, Unlimited Specialty Coffee, Whiteboards, Printer/Scanner, Pantry. |
| **`reviews/`** | **REUSE** | Retain verified-booking-only review creation, rating calculation (1-5 stars), and moderation tools. |
| **`wishlists/`** | **REUSE** | Retain user workspace bookmarking / wishlist persistence. |
| **`notifications/`** | **REUSE & ADAPT** | Retain in-app notification state machine. Connect to booking confirmation, reminder, access pass expiry, and maintenance updates. |
| **`maintenance/`** | **NEW** | Build coworking issue reporting system (WiFi, AC, electricity, cleaning, furniture) linking to workspace/unit, with admin assignment and audit timeline. |
| **`memberships/`** | **NEW** | Build recurring membership plans, billing periods, meeting room credit wallets, and entitlement checks. |
| **`digital-pass/`** | **NEW** | Build signed/opaque revocable digital pass tokens with QR/manual check-in and checkout session tracking. |
| **`reels/`** | **NOT APPLICABLE** | FairBnB video reels engine (Cloudinary, HLS streaming, transcoding) is not part of Studio I core booking requirements. Studio I already has native portrait reel mockups with interactive video modals that will be preserved. |
| **`ai-assistant/`** | **NOT APPLICABLE** | Excluded per Section 1 to prevent bloat. |
| **`automated-messages/`** | **NOT APPLICABLE** | FairBnB guest-host messaging rules are not applicable to direct-to-user coworking operations. |
| **`ical/`** | **NOT APPLICABLE** | Third-party OTA sync (Airbnb/Booking.com iCal) is hospitality-specific and not applicable to direct coworking desks. Standard `.ics` customer calendar download will be provided. |

---

## 3. Dependency Reuse & Compatibility Verification

| Dependency Package | FairBnB Version | Studio I Backend Strategy | Compatibility Notes |
| :--- | :--- | :--- | :--- |
| `@nestjs/core`, `@nestjs/common` | `^11.0.1` | Adopt `^11.0.1` | Works cleanly on Node 20 & Node 24 |
| `@prisma/client`, `prisma` | `^6.19.3` | Adopt `^6.19.3` | Matches local PostgreSQL 16 server |
| `bcrypt` | `^6.0.0` | Adopt `^6.0.0` | Standard password hashing |
| `passport-jwt`, `@nestjs/jwt` | `^4.0.1` / `^11.0.2` | Adopt `^4.0.1` / `^11.0.2` | Robust stateless JWT authentication |
| `class-validator`, `class-transformer` | `^0.15.1` / `^0.5.1` | Adopt `^0.15.1` / `^0.5.1` | Clean DTO validation pipes |
| `pg` | Indirect via Prisma | Include `@types/pg` if raw SQL needed | Standard PostgreSQL driver |
