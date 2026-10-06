# Studio I + FairBnB Integration — Source Manifest

**Generation Date:** 2026-09-22  
**Target Path:** `C:\Users\shubham\OneDrive\Desktop\studio i\studio-i-complete`  
**Execution Context:** Antigravity Pair-Programming Assistant  

---

## 1. Identified Source Codebases

### Source 1: FairBnB (Verified Platform Engine)
- **Parent Location:** `C:\Users\shubham\OneDrive\Desktop\studio i\`
  - **Backend Path:** `C:\Users\shubham\OneDrive\Desktop\studio i\backend\`
  - **Frontend Path:** `C:\Users\shubham\OneDrive\Desktop\studio i\frontend\`
  - **Supporting Reference:** `C:\Users\shubham\OneDrive\Desktop\fairbnb--new\`
- **Runtime & Stack:**
  - Backend: NestJS 11.0.1, Node.js v20+, TypeScript, Prisma ORM 6.2.1, PostgreSQL 16
  - Frontend: Next.js 15.1.0 / 16.3.5 App Router, React 19, Tailwind CSS / Vanilla CSS
- **Core Modules & Capabilities:**
  - Full 4-role authorization model: User/Guest, Host, Co-host, Admin
  - Comprehensive property lifecycle & listing creation wizard
  - Co-host invitations, granular permission scoping, and delegation
  - Calendar management (ICal sync, pricing schedules, availability rules)
  - Atomic booking reservations, cancellation policies, dynamic pricing quotes
  - Payment simulation, host earnings, settlements, and payout requests
  - Chat/messaging, maintenance tickets, dispute resolution, wishlists, automated messages, banner management, audit logs

### Source 2: Studio I (Coworking Brand, Theme & 2D Booking Platform)
- **Path:** `C:\Users\shubham\OneDrive\Desktop\studio i\studioiwebsite\` (and `C:\Users\shubham\OneDrive\Desktop\studioiwebsite\`)
- **Runtime & Stack:**
  - Backend: NestJS 11, Prisma ORM, PostgreSQL 16 (`studioi_dev`)
  - Frontend: Next.js 16.3.5 (Turbopack), React 19
- **Core Modules & Brand Assets:**
  - Visual identity: Magenta `#FF007A`, hover `#E0006C`, sleek dark mode `#0A0A0A`, typography: Plus Jakarta Sans
  - Responsive Hero with real estate photography, animated phone mockup, interactive city search (Jaipur flagship locations)
  - Public Alwar removal preserved: only Jaipur campuses (`Lehariya | KGK Realty` and `Horizon Tower`) exist in public discovery
  - Theatre-style 2D Floor Plan Viewer (`FloorPlan2DViewer.tsx`) with zoom/pan, directional desk chairs, glass cabins, meeting suites, legend, and WCAG keyboard list alternative
  - Matching Admin 2D Floor Plan Editor (`FloorPlan2DEditor.tsx`) with snap-to-grid, coordinate inspector, undo/redo history, and live publication
  - Hourly, Daily, and Monthly coworking plans (including 2-month minimum commitment for dedicated desks/cabins)
  - Digital access passes (`DigitalPass`) with QR token and reception check-in simulation

---

## 2. Target Workspace Architecture

- **Path:** `C:\Users\shubham\OneDrive\Desktop\studio i\studio-i-complete\`
- **Canonical Structure:**
  ```
  studio-i-complete/
  ├── backend/               # Unified NestJS Coworking Backend (adapted from FairBnB + Studio I)
  │   ├── src/
  │   │   ├── auth/          # Reconciled JWT Auth & Role Guards (USER, HOST, ADMIN, COHOST)
  │   │   ├── workspaces/    # Coworking Workspaces, Buildings, Floors, Zones, 2D Layouts
  │   │   ├── bookings/      # Atomic Inventory Holds & Booking Lifecycle
  │   │   ├── pricing/       # Authoritative Pricing Quotes & Coupon Engine
  │   │   ├── payments/      # Payment Processing & Ledger
  │   │   ├── hosts/         # Host Onboarding & Workspace Management
  │   │   ├── co-host/       # Granular Co-host Scoped Delegation
  │   │   ├── finance/       # Host Settlements, Earnings & Reconciliations
  │   │   ├── chat/          # Member <-> Host / Concierge Messaging
  │   │   ├── maintenance/   # Workstation & Facility Maintenance Tickets
  │   │   ├── disputes/      # Issue Resolution & Refund Audits
  │   │   └── admin/         # Global Operational & Financial Control
  │   ├── prisma/            # Unified Coworking Schema (PostgreSQL studioi_complete_dev)
  │   └── test/              # Integration & Concurrency Test Suites
  ├── frontend/              # Unified Next.js 16 App Router Frontend
  │   ├── src/
  │   │   ├── app/           # App Router (User, Host, Co-host, Admin experiences)
  │   │   ├── components/    # Studio I Themed Global UI Elements
  │   │   ├── features/      # 2D Floor Plan Engine (Viewer & Editor)
  │   │   └── lib/           # Canonical API Client & Auth Session Management
  │   └── public/            # Studio I High-Res Media & Visual Assets
  ├── docs/integration/      # Master Verification & Architecture Documentation
  └── qa/integration/        # Automated QA Suites, Benchmarks & Evidence Reports
  ```

---

## 3. Database Isolation Boundaries

- **FairBnB Source Database:** Unmodified / Protected.
- **Studio I Previous Database:** `studioi_dev` on `localhost:5432` preserved as baseline reference.
- **Target Database:** `studioi_complete_dev` on `localhost:5432` — isolated dedicated database created exclusively for this integration run.
- **Provider Mocking:** Local simulated gateway (`MOCK_GATEWAY`) for payments, webhooks, and OTP verification.
