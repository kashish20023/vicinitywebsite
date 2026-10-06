# Studio I — Frontend Architecture & Folder Structure

**Version:** 2.0 (UX Upgrade)  
**Framework:** Next.js 16.3.5 (Turbopack) & React 19  
**Styling:** Modern Vanilla CSS + Tailored Utility Tokens  
**Color Palette:** `#FF007A` (Studio I Pink), `#000000` (Pure Black), `#0A0A0A` (Dark Background), `#FFFFFF` (Crisp White)  
**Typography:** Plus Jakarta Sans & Space Grotesk (Google Fonts)

---

## 1. Directory Organization

The frontend codebase is organized into a canonical `frontend/` package, mirrored to root `src/` to support both monorepo-style workflows and standard root development commands:

```
studioiwebsite/
├── frontend/                     # Canonical Next.js Application Root
│   ├── src/
│   │   ├── app/                 # Next.js 16 App Router Routes
│   │   │   ├── page.tsx         # Brand Landing & Public Campus Discovery
│   │   │   ├── explore/         # Campus Catalog & Filter Page (Jaipur Flagships)
│   │   │   ├── workspaces/      # Interactive Workspace Detail & 2D Seat Reservation
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx # FloorPlan2DViewer Integration
│   │   │   ├── checkout/        # Authoritative Quote, Coupon & Payment Verification
│   │   │   ├── bookings/        # Digital QR Access Passes
│   │   │   │   └── [id]/pass/
│   │   │   ├── my-bookings/     # Member Reservation History
│   │   │   └── admin/           # Role-Based Back-Office Operations
│   │   │       ├── spaces/      # Campus & Floor Management
│   │   │       │   └── [id]/floor-plan/ # FloorPlan2DEditor Integration
│   │   │       ├── bookings/    # Central Booking Ledger
│   │   │       ├── finance/     # Financial Reconciliation
│   │   │       └── users/       # Member & Role Administration
│   │   ├── components/          # Shared Layout & Global UI Elements
│   │   │   ├── Navbar.tsx       # Universal Header with Authentication Modal
│   │   │   ├── Footer.tsx       # Canonical Footer (Jaipur Locations Only)
│   │   │   └── HeroSearch.tsx   # Interactive Hero Filter (Jaipur Default)
│   │   ├── features/            # Feature-Specific Interactive Modules
│   │   │   └── floor-plan/
│   │   │       ├── FloorPlan2DViewer.tsx # Theatre-Style Member Seat Selector
│   │   │       └── FloorPlan2DEditor.tsx # Admin Drag & Snap Floor Layout Editor
│   │   └── lib/                 # Core Client Utilities & API Client
│   │       └── api.ts           # apiRequest helper with JWT & LocalStorage sync
│   ├── public/                  # Static Assets, Campus Photography & Floor Layouts
│   ├── package.json             # Frontend Script Configuration
│   ├── tsconfig.json            # Path Aliases (@/* -> src/*)
│   └── next.config.ts           # Turbopack & Image Optimization Config
├── backend/                     # NestJS 11 + Prisma ORM + PostgreSQL Backend
└── qa/                          # Automated Benchmarks, Invariant Tests & QA Reports
```

---

## 2. Root Command Delegation

The root `package.json` forwards developer lifecycle scripts to the canonical `frontend/` directory:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs `npm --prefix frontend run dev` (Local Next.js dev server on `http://localhost:3000`) |
| `npm run build` | Runs `npm --prefix frontend run build` (Turbopack production build) |
| `npm run start` | Runs `npm --prefix frontend run start` (Production SSR server) |
| `npm run lint` | Runs `npm --prefix frontend run lint` (ESLint verification) |
| `npm run backend:dev` | Runs `npm --prefix backend run start:dev` (NestJS API on `http://localhost:5002/api/v1`) |

---

## 3. Public Discovery & Geographic Boundary (Alwar Removal)

Per business requirements, **Alwar has been completely excised from all public discovery surfaces**:
- `HeroSearch.tsx`: Dropdown contains only `"Jaipur, Rajasthan"`.
- `explore/page.tsx`: Filter tabs offer `"All Cities"` and `"Jaipur"`.
- `layout.tsx`: OpenGraph metadata references only the two Jaipur flagship campuses (`Lehariya | KGK Realty` and `Horizon Tower`).
- `Footer.tsx`: Campus location directory lists only Jaipur properties.
- Catalog APIs: `GET /workspaces?city=Alwar` returns an empty array with HTTP 200.
