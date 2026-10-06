# Studio I — 2D Interactive Floor Plan & Seat Selection Engine

**Status:** Deployed & Verified  
**Member Component:** `src/features/floor-plan/FloorPlan2DViewer.tsx`  
**Admin Component:** `src/features/floor-plan/FloorPlan2DEditor.tsx`  
**API Integration:** `GET /workspaces/floors/:id/availability`, `POST /bookings/hold`, `POST /admin/floors/:id/publish-layout`

---

## 1. Architectural Overview

The Studio I 2D Floor Plan Engine replaces static seat lists with a theatre-style, interactive vector representation of the physical office space. It renders architectural features, open workstations, ergonomic task chairs, glass cabins, meeting suites, and shared hospitality zones (espresso bar, phone booths).

```
+-----------------------------------------------------------------------------------+
|  [Zoom Controls: + / - / Reset]     [Category Filter: All / Desks / Cabins]       |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +--- OPEN WORKSPACE ZONE -------------------+   +--- EXECUTIVE SUITES -------+  |
|   |  [Desk 01]   [Desk 02]   [Desk 03]        |   |   +---------------------+  |  |
|   |    (chair)     (chair)     (chair)        |   |   | Glass Cabin 4-Pax   |  |  |
|   |                                           |   |   +---------------------+  |  |
|   |  [Desk 04]   [Desk 05]   [Desk 06]        |   |                            |  |
|   +-------------------------------------------+   |   +---------------------+  |  |
|   +--- HOSPITALITY & CAFE --------------------+   |   | Boardroom 10-Pax    |  |  |
|   |  [Espresso Bar]     [Acoustic Pods]       |   |   +---------------------+  |  |
|   +-------------------------------------------+   +----------------------------+  |
+-----------------------------------------------------------------------------------+
|  [Legend: Available (Green) | Selected (Pink) | Booked (Red) | Held (Amber)]      |
+-----------------------------------------------------------------------------------+
|  [Accessible Unit Selector (WCAG Keyboard List Alternative)]                      |
+-----------------------------------------------------------------------------------+
|  [Selection Summary: Unit Code • Rate • Schedule Window • 10-Min Hold CTA]        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Interactive Features (Member Viewer)

### Vector Pan & Zoom
- Users can zoom from `0.6x` to `2.5x` using on-screen controls or mouse drag.
- Bounded coordinates ensure the canvas cannot be lost off-screen.

### Real-Time Status Color Coding
- **Available (`#10B981` Emerald):** Selectable by the user.
- **Selected (`#FF007A` Studio I Pink):** Highlighted with SVG pulse effect.
- **Booked (`#EF4444` Crimson):** Confirmed active reservation.
- **Held (`#F59E0B` Amber):** Active 10-minute temporary checkout hold.
- **Maintenance (`#64748B` Slate):** Administratively disabled.

### Architectural Detail
- Desk pods feature directional task chair indicators (`top`, `bottom`, `left`, `right`).
- Private cabins and boardrooms feature double glass-wall borders and interior tables.
- Hospitality zones indicate espresso bar, phone booths, and lounge perimeters.

### Accessible Alternative (WCAG Compliant)
- Beneath the visual SVG canvas, an accessible keyboard grid lists all units with aria attributes, full keyboard navigation (Tab / Enter), and disabled states for unavailable units.

---

## 3. Matching Admin 2D Layout Editor

Administrators access `/admin/spaces/[id]/floor-plan` to design and publish live office layouts:
1. **Interactive Drag & Drop:** Click and drag units to reposition them on the 1000px × 500px blueprint.
2. **Snap to Grid:** Snapping toggles (10px, 20px, None) ensure clean architectural alignment.
3. **Undo / Redo Stack:** Built-in history management (`Undo2`, `Redo2`, `Ctrl+Z`, `Ctrl+Y`).
4. **Property Inspector:**
   - Unit Code (e.g. `LH-01-D01`)
   - Unit Name & Category (`HOT_DESK`, `DEDICATED_DESK`, `PRIVATE_CABIN`, `MEETING_ROOM`)
   - Seating Capacity (Pax)
   - Status (`AVAILABLE`, `MAINTENANCE`, `DISABLED`)
   - Exact X, Y, Width, and Height coordinates
5. **Add Unit Object:** Modal to instantiate new desks or executive cabins.
6. **Live Publication:** Single click calls `POST /admin/floors/:id/publish-layout`, updating the database and bumping the layout version.
