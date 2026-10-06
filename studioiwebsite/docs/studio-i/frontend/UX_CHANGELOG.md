# Studio I — UX Upgrade Changelog

**Release Date:** 2026-09-22  
**Scope:** Canonical Frontend Organization, Alwar Removal, 2D Floor Plan Engine, and Reliability Upgrades

---

## 1. Directory Structure & Architecture
- **Canonical `frontend/` Package:** Reorganized the Next.js application into `frontend/` alongside `backend/`.
- **Root Script Delegation:** Updated root `package.json` to route `dev`, `build`, `start`, and `lint` commands directly to `frontend/`, ensuring backwards compatibility for CLI workflows.
- **Turbopack Build Optimization:** Verified zero TypeScript or JSX compile errors across all 12 App Router routes.

---

## 2. Public Brand Discovery & Alwar Deprecation
- **Hero Search (`HeroSearch.tsx`):** Removed Alwar option; default location set strictly to Jaipur flagships.
- **Campus Catalog (`explore/page.tsx`):** Removed Alwar cards; filtered down to Lehariya | KGK Realty and Horizon Tower.
- **Layout Metadata (`layout.tsx`):** Updated title, description, and keywords to emphasize Jaipur luxury coworking.
- **Footer (`Footer.tsx`):** Removed Alwar address entries; aligned with flagship Jaipur addresses.

---

## 3. Theatre-Style 2D Seat Reservation Experience
- **Interactive SVG Canvas (`FloorPlan2DViewer.tsx`):**
  - High-resolution SVG vector layout with smooth pan and zoom (0.6x to 2.5x).
  - Desk pods with chair orientation, meeting tables, glass cabin boundaries, and hospitality elements.
  - Real-time color-coded availability (Available, Booked, Held, Maintenance).
  - Hover tooltips and instant selection highlighting with pulse animation.
- **Accessible Unit Selector:** Accessible keyboard grid allowing screen-reader and keyboard-only navigation.
- **Selection Summary & 10-Minute Hold:** Displays unit specs, hourly/daily/monthly commitment rules, and triggers transactional hold acquisition.

---

## 4. Matching Admin 2D Layout Editor
- **Blueprint Canvas (`FloorPlan2DEditor.tsx`):**
  - Direct visual manipulation of desk and cabin coordinates.
  - Snap-to-grid controls (10px, 20px, None).
  - Undo / Redo history stack.
  - Coordinate & property inspector for rapid dimension and status editing.
  - Instant live publication to `POST /admin/floors/:id/publish-layout`.

---

## 5. Backend Reliability & Transaction Safeguards
- **Flexible Schedule Parameter Handling:** Updated controller and pricing service to handle both `startDateTime` and `startTime`. Missing dates auto-resolve from the associated active `holdId`.
- **Concurrency Invariant:** Verified 20 simultaneous competing holds on a single unit resulting in exactly 1 hold granted and 19 HTTP 409 conflict rejections.
