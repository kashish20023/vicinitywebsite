# Studio I Preservation Matrix

**Requirement:** Maintain 100% of existing Studio I branding, visual design, animations, responsive behavior, 2D floor-plan seat selection/editor, and coworking functionality.

---

| Route / Feature | Source File(s) | Preservation Decision | Target Integration Path | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **Landing Page & Hero** | `src/app/page.tsx`, `HeroSection.tsx`, `HeroSearch.tsx` | **Retain 100%** exact visual structure, typography, brand tokens, phone mockup animation | `frontend/src/app/page.tsx` | Visual baseline snapshot & browser render |
| **Theme & Color Tokens** | `src/app/globals.css`, `#FF007A`, `#000000`, `#0A0A0A` | **Preserve & Apply** to all imported FairBnB screens for visual consistency | `frontend/src/app/globals.css` | CSS inspection & style validation |
| **Interactive City Filter**| `src/components/HeroSearch.tsx` | **Preserve Jaipur only**; ensure Alwar remains completely removed | `frontend/src/components/HeroSearch.tsx` | Catalog query & dropdown inspect |
| **Navbar & Role Switcher** | `src/components/Navbar.tsx`, `AuthModal.tsx` | **Preserve & Extend** with 4-role switcher (User, Host, Co-host, Admin) | `frontend/src/components/Navbar.tsx` | Interactive auth & role switch test |
| **Campus Explore Page** | `src/app/explore/page.tsx` | **Preserve & Enhance** with FairBnB filter capabilities tailored to coworking | `frontend/src/app/explore/page.tsx` | SSR HTTP 200 & card navigation |
| **2D Floor Plan Viewer** | `src/features/floor-plan/FloorPlan2DViewer.tsx` | **Retain 100%** theatre-style SVG pan/zoom, desk pods, cabins, status colors, WCAG list | `frontend/src/features/floor-plan/FloorPlan2DViewer.tsx` | Interactive click, hold & zoom test |
| **2D Floor Plan Editor** | `src/features/floor-plan/FloorPlan2DEditor.tsx` | **Retain 100%** grid snap, drag-and-drop, coordinate inspector, undo/redo, live publication | `frontend/src/features/floor-plan/FloorPlan2DEditor.tsx` | Layout publish & coordinate test |
| **Workspace Detail Page** | `src/app/workspaces/[slug]/page.tsx` | **Preserve** booking plan selection, amenities, 2D floor plan integration | `frontend/src/app/workspaces/[slug]/page.tsx` | Deep link & seat selection test |
| **Checkout & Hold Flow** | `src/app/checkout/page.tsx` | **Preserve & Reconcile** with FairBnB ledger snapshot, coupon STUDIO10, 10-min hold | `frontend/src/app/checkout/page.tsx` | Hold acquisition & payment test |
| **Digital QR Pass** | `src/app/bookings/[id]/pass/page.tsx` | **Preserve** QR token, reception check-in session, pass security code | `frontend/src/app/bookings/[id]/pass/page.tsx` | Pass generation & check-in test |
| **Member Bookings** | `src/app/my-bookings/page.tsx` | **Preserve & Extend** with FairBnB cancellation, refund request, and review triggers | `frontend/src/app/my-bookings/page.tsx` | Booking stream & refund test |
| **Admin Operations** | `src/app/admin/*` | **Preserve & Combine** with FairBnB Host moderation, user KYC, banners, and audit logs | `frontend/src/app/admin/*` | Admin RBAC & metric cards test |
