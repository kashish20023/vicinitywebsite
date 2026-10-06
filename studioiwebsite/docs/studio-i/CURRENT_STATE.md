# Studio I — Current State & Baseline Audit (`CURRENT_STATE.md`)

> **Run / Checkpoint ID**: `run-20260922-phase1`  
> **Timestamp**: 2026-09-22T13:05:00+05:30  
> **Lead Architect / QA Automation**: Antigravity Autonomous Agent

---

## 1. Verified Repository Facts & Paths

### 1.1 Target Project: Studio I (`studioiwebsite`)
- **Root Path**: `C:\Users\shubham\OneDrive\Desktop\studioiwebsite`
- **Git Branch**: `main`
- **HEAD Commit**: `2c79bb7` (*"ADD the design of studio I"*)
- **Clean Working Tree (Pre-work)**: Only `brain.md` (untracked documentation). No unstaged code changes.
- **Frontend Runtime & Stack**:
  - Next.js: `16.3.5` (App Router)
  - React: `19.2.8` / React DOM: `19.2.8`
  - TypeScript: `^5`
  - Tailwind CSS: `@tailwindcss/postcss ^4` / `tailwindcss ^4`
  - Icons & Motion: `lucide-react ^1.47.0`, `framer-motion ^13.4.0`
- **Frontend Port**: Active and listening on `http://localhost:3000` (Process ID `16232`).
- **Backend**: No existing backend in Studio I repository. Per Section 6, the compatible audited NestJS/Prisma/PostgreSQL architecture is adopted and placed in `backend/`.

### 1.2 Reference Project: FairBnB (`fairbnb--new`) — STRICTLY READ-ONLY
- **Active Audited Clone Path**: `C:\Users\shubham\fairbnb--new`
- **Git Branch**: `govind-temp`
- **HEAD Commit**: `bef83941c10eb3da34d6f519c77bd117874e7d33`
- **Status**: Read-only reference. Zero modifications, zero commits, zero branch changes permitted.
- **Secondary Desktop Clone Path**: `C:\Users\shubham\OneDrive\Desktop\fairbnb--new` (Branch `main`, HEAD `a609aac`). Not actively modified.
- **FairBnB Port**: Frontend running on `http://localhost:3001` (Process ID `9444`).

---

## 2. Infrastructure & Local Runtime Environment

| Resource | Verified State | Target for Studio I |
| :--- | :--- | :--- |
| **Node.js** | `v24.18.0` (x64 Windows) | Compatible with both Next.js 16 and NestJS 11 |
| **PostgreSQL** | Local service running on `localhost:5432` (PID `5804`) | PostgreSQL 16.14, compiled by Visual C++ build 1944, 64-bit |
| **Database Credentials** | `postgres:Password%40246@localhost:5432` | Verified via direct connection test |
| **Studio I Dev Database** | Task-owned isolated target: `studioi_dev` | Isolated from FairBnB and all other databases |
| **Studio I QA Database** | Disposable test target: `studioi_qa_run_20260922` | Isolated from `studioi_dev` and shared databases |
| **Ports** | `3000` (Studio I Frontend), `5002` (Studio I Backend) | Verified free / currently serving frontend |

---

## 3. Preserved Studio I Design Baseline

### 3.1 Design System Tokens (Verified from Source)
- **Primary Brand Magenta**: `#FF007A`
- **Primary Hover Magenta**: `#E0006C`
- **Pure Black**: `#000000`
- **Deep Neutrals**: `#0A0A0A` / `#171717`
- **White**: `#FFFFFF`
- **Muted Borders**: `#E5E7EB` / `#D4D4D4`
- **Accent Gold**: `#FBBF24` (`amber-400`)
- **Typography**: `Plus Jakarta Sans` via Next.js Google font loader

### 3.2 Visual Baselines Captured
Baseline screenshots captured via Chrome CDP at standard viewports and persisted to `docs/studio-i/baselines/`:
1. `baseline_1440_desktop.png` (1440 x 900 px, 611,477 bytes)
2. `baseline_768_tablet.png` (768 x 1024 px, 460,977 bytes)
3. `baseline_390_mobile.png` (390 x 844 px, 127,399 bytes)

### 3.3 Baseline Runtime Audit Findings (`http://localhost:3000`)
- **Initial Navigation Duration**: `4465 ms` (local dev compilation)
- **Total Network Requests**: `28` requests
- **HTTP Errors (status >= 400)**: `0` (Zero errors)
- **Console Warnings Detected**:
  1. Next.js image warning on `/assets/logo-studioi.png` regarding modified dimensions without aspect ratio style.
  2. Next.js image warning on `/assets/avatar-rahul.jpg` regarding `fill` missing `sizes` attribute.
  *(These are pre-existing and documented; will be preserved or corrected non-destructively).*

---

## 4. Current Route & Component Inventory

| Route | Component File | Current Working Functionality | Integration Target |
| :--- | :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Main landing page: Hero, Search Bar, Slogan, Campus Cards, Reel, FAQ, Footer | Wire Search, Booking CTA, & Campus Cards to live catalog & checkout |
| `#` | `src/components/Navbar.tsx` | Sticky dark pill navigation with logo, desktop links, mobile hamburger drawer | Add User Profile, Admin link (when admin authenticated), and My Bookings |
| `#search-bar` | `src/components/HeroSearch.tsx` | Dropdown selectors for Location, Date, and Space Type with mock alert | Wire to `/explore` catalog with reactive URL search parameters |
| `#` | `src/components/HeroSection.tsx` | Animated doodles, headline, visual strip, "Find Your Perfect Workspace" CTA | Wire CTA to `/explore` |
| `#` | `src/components/BrandBanner.tsx` | Slogan strip graphic | Preserved visually unchanged |
| `#locations` | `src/components/FeaturedLocations.tsx` | Lehariya & Horizon Tower campus cards | Wire cards to workspace detail `/workspaces/:slug` |
| `#experience` | `src/components/TestimonialsSection.tsx` | Member review cards, video reel card mockup, interactive Video & Social modals | Preserved visually unchanged |
| `#` | `src/components/FaqSection.tsx` | 2-column interactive FAQ accordion | Preserved visually unchanged |
| `#footer` | `src/components/Footer.tsx` | Magenta brand footer with quick links, Alwar location, social media | Wire navigation links to active routes |
