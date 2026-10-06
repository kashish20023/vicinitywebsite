# Studio I — Complete Coworking Platform & Ecosystem

> **Studio I** is a modern coworking space and shared workspace platform operating in Jaipur, Rajasthan. This repository houses the complete production-grade application comprising a multi-role Next.js web portal, NestJS REST API, Prisma ORM schema, 2D floor plan layout viewer/editor, and automated QA suites.

---

## 🏛️ System Architecture

```
studioiwebsite/
├── frontend/               # Next.js 16.3.5 App Router (React 19, Tailwind CSS v4)
│   ├── src/
│   │   ├── app/            # Member discovery, checkout, host, co-host & admin portals
│   │   ├── components/     # UI components, 2D floor plan viewer/editor, navbar, footer
│   │   └── lib/            # API client and utility helpers
│   ├── public/             # Optimized brand media, icons, and campus imagery
│   └── .env.example        # Frontend environment configuration template
├── backend/                # NestJS 11 Application & REST API
│   ├── src/                # Auth, Workspaces, Availability, Pricing, Bookings,
│   │                       # Payments, Digital Pass, Hosts, Co-host, Admin, Operations
│   ├── prisma/             # Unified schema (43 models) & migration definitions
│   └── .env.example        # Backend environment configuration template
├── docs/                   # Architectural blueprints, API contracts & handoff reports
└── qa/                     # Automated end-to-end verification suites
```

---

## 🚀 Key Platform Capabilities

1. **Spatial Hierarchy & Inventory**:
   - `Workspace` &rarr; `Building` &rarr; `Floor` &rarr; `Zone` &rarr; `Unit` (Hot Desks, Dedicated Desks, Private Cabins, Boardrooms).
   - Flagship Jaipur campuses (`Lehariya | KGK Realty` and `Horizon Tower`) active.
   - Public Alwar listings strictly omitted from public search while preserving data history.

2. **2D Interactive Floor Plan Engine**:
   - Interactive SVG floor plan viewer with seat selection on 2D floor plans.
   - Administrative visual layout editor with drag-and-drop coordinate positioning, shape styling, and draft/published versioning.

3. **Commercial Booking Plans & Pricing**:
   - Flexible duration plans: Hourly, Daily, and Monthly commitments.
   - Dynamic quotation engine with 18% GST calculation, security deposits, and coupon discounts.
   - **Integer paise precision** (`BigInt` / integer paise) across all monetary arithmetic for zero float loss.

4. **Real-Time Availability & Concurrency Engine**:
   - Half-open interval calculations `[start, end)`.
   - 10-minute atomic holds (`InventoryHold`) backed by database conflict locking to prevent double-booking.
   - Parent-child cabin exclusivity protection.

5. **Digital Pass & QR Reception Session**:
   - Instant cryptographic QR digital access pass generated upon booking confirmation.
   - Front-desk session logging (check-in, check-out, duration).

6. **4-Role Governance & Portals**:
   - **Member / Guest**: Campus explore, 2D seat selection, atomic holds, checkout, digital passes, reviews, support chat.
   - **Host**: Workspace management command center, real-time booking feed, earnings overview, payout requests.
   - **Co-host**: Scoped workspace delegations, permission matrix inspection, multi-tenant boundaries.
   - **Admin**: Global analytics, 2D floor layout publishing, dispute resolution queue, user account management.

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **PostgreSQL**: `>= 15`

### 1. Repository Setup
```bash
git clone https://github.com/kashish20023/studioiwebsite.git
cd studioiwebsite
```

### 2. Configure Environment Variables
Copy the provided `.env.example` templates:

**Backend:**
```bash
cp backend/.env.example backend/.env
```
Update `DATABASE_URL` and `JWT_SECRET` in `backend/.env`.

**Frontend:**
```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install --prefix backend
npm install --prefix frontend
npm install
```

### 4. Database Initialization
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
```

### 5. Running the Application
From the repository root:
```bash
# Start frontend (port 3000)
npm run dev

# Start backend concurrently (port 5002)
npm run backend:dev
```

- **Frontend Portal**: `http://localhost:3000`
- **Backend API**: `http://localhost:5002/api/v1`
- **API Health Check**: `http://localhost:5002/api/v1/health`

---

## 🧪 Verification & Testing

Automated verification suites are located under `qa/`:
```bash
# Execute master verification suite
node qa/run_all_verifications.cjs
```

---

## 📄 License & Attribution

Confidential & Proprietary — Studio I Coworking Spaces.
All rights reserved © 2026.
