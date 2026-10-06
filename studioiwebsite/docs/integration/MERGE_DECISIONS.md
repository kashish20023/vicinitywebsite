# Studio I + FairBnB Integration — Merge Decisions & Canonical Architecture

**Document Version:** 1.0  
**Status:** Approved & Frozen for Execution  

---

## 1. Canonical Service Selection

1. **Authentication & Session:**
   - **Decision:** Use FairBnB's multi-role JWT strategy with user roles: `USER`, `HOST`, `ADMIN`, plus delegated `COHOST` grant scopes.
   - **Reasoning:** FairBnB provides fully audited password hashing (bcrypt), token verification, KYC management, and role-based guards (`RolesGuard`).
   - **Adaptation:** Ensure Studio I default seed users (`member@studioi.com`, `admin@studioi.com`, and a new `host@studioi.com`, `cohost@studioi.com`) authenticate with existing expected credentials.

2. **Inventory & Spatial Hierarchy:**
   - **Decision:** Retain Studio I's hierarchical model: `Workspace` &rarr; `Building` &rarr; `Floor` &rarr; `Zone` &rarr; `OfficeUnit`, linked to `hostId` (User ownership).
   - **Reasoning:** Coworking spaces require granular seat-level desks, private cabins, and meeting rooms rather than hotel bedrooms.
   - **Adaptation:** FairBnB's `Property` is mapped to `Workspace`, allowing hosts to register campuses, specify operating hours, facilities, and upload campus photography.

3. **2D Floor Plan Engine:**
   - **Decision:** Canonical 2D Engine is Studio I's `FloorPlan2DViewer.tsx` (for Members) and `FloorPlan2DEditor.tsx` (for Hosts & Admins).
   - **Reasoning:** Theatre-style interactive SVG layout with desk pods, chairs, cabins, pan/zoom, and live coordinate publication satisfies core user requirements.
   - **Adaptation:** Expose editor to both Admin (`/admin/spaces/[id]/floor-plan`) and Host (`/host/properties/[id]/floor-plan`), with Co-host access gated by `canManageListing` permission.

4. **Authoritative Pricing & Quote Engine:**
   - **Decision:** Use Studio I's `POST /bookings/quote` with FairBnB coupon and fee arithmetic.
   - **Reasoning:** Studio I handles hourly, daily, and monthly plans with 2-month minimum commitment rules. FairBnB provides robust coupon validation and fee itemization.
   - **Money Precision:** Strictly integer paise (`BigInt` / integer paise) across database and API responses to eliminate floating-point rounding errors.

5. **Atomic Hold & Booking Transaction Engine:**
   - **Decision:** Retain Studio I's PostgreSQL advisory-locked `InventoryHold` mechanism (10-minute hold window).
   - **Reasoning:** Verified under concurrency testing (20 competing threads resulted in exactly 1 hold and 19 HTTP 409 rejections).
   - **Adaptation:** Connect hold expiration and conversion into FairBnB's comprehensive booking status machine (`CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `REFUNDED`).

6. **Financial Ledger, Host Earnings & Settlements:**
   - **Decision:** Integrate FairBnB's immutable financial snapshot system and host earnings ledger into the coworking model.
   - **Reasoning:** Enables host revenue shares (e.g. 85% Host / 15% Studio I platform fee), settlement tracking, and payout request management.

7. **Member Engagement & Operations:**
   - **Decision:** Import FairBnB's `Chat`, `Maintenance`, `Disputes`, `Wishlist`, and `Banner` modules directly into the unified Studio I application.
   - **Reasoning:** Delivers full feature parity for member support, facility maintenance, and promotions.

---

## 2. Public Brand & Discovery Boundary

- **Alwar Status:** Permanently removed from all public discovery dropdowns, hero filters, footer address cards, and metadata.
- **Flagship Locations:** Public catalog features exclusively the two flagship Jaipur campuses:
  1. `Lehariya | KGK Realty` (Tower A, 1st Floor)
  2. `Horizon Tower` (JLN Marg, 10th Floor)
