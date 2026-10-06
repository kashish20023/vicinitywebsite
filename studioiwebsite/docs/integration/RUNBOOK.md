# Studio I Integrated Platform — Operations & Developer Runbook

This document provides complete instructions for setting up, running, testing, and administering the merged Studio I self-contained platform.

---

## 1. System Architecture & Topology

- **Target Repository**: `studio-i-complete/`
- **Database**: PostgreSQL 16 on `localhost:5432` (`studioi_complete_dev`)
- **Backend API**: NestJS 10 on port `5002` with global prefix `/api/v1`
- **Frontend App**: Next.js 16.3.5 on port `3000` (React 19, Tailwind CSS, Plus Jakarta Sans)
- **Monetary Precision**: Strictly integer paise (`BigInt` / integer paise). Zero float arithmetic.

---

## 2. Seed Personas & Demo Credentials

| Role | Email | Password | Granted Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@studioi.com` | `StudioI@Admin2026` | Universal management, finance, 2D floor plan publishing, dispute resolution, payout approvals |
| **Host** | `host@studioi.com` | `StudioI@Host2026` | Jaipur flagship host, occupancy metrics, revenue dashboard, payout requests, co-host delegation |
| **Member (User)** | `member@studioi.com` | `StudioI@Member2026` | 2D seat selection, quotes, exclusive holds, checkout, digital passes, QR check-in, chat & reviews |
| **Co-host** | `cohost@studioi.com` | `StudioI@Cohost2026` | Delegated workspace operations (Lehariya flagship), booking inspection, maintenance oversight |

---

## 3. Database Initialization & Seeding

```bash
# Navigate to target backend
cd "C:\Users\shubham\OneDrive\Desktop\studio i\studio-i-complete\backend"

# Ensure PostgreSQL is running on localhost:5432
# Push Prisma schema to isolated target database
npx prisma db push

# Seed 4 personas, Jaipur flagships, 2D units, booking plans, and coupons
npm run seed
```

---

## 4. Starting the Services

### 4.1 Backend API (Port 5002)
```bash
cd "C:\Users\shubham\OneDrive\Desktop\studio i\studio-i-complete\backend"
npm run build
node dist/main.js
# API running on http://localhost:5002/api/v1
# Healthcheck: http://localhost:5002/api/v1/health/liveness
```

### 4.2 Frontend Application (Port 3000)
```bash
cd "C:\Users\shubham\OneDrive\Desktop\studio i\studio-i-complete\frontend"
npx next build --webpack
npx next start -p 3000
# Web application live on http://localhost:3000
```

---

## 5. Running Automated Verification

To execute the entire master test suite across all chunks with a single command:

```bash
cd "C:\Users\shubham\OneDrive\Desktop\studio i\studio-i-complete"
node qa/run_all_verifications.cjs
```

The master runner verifies:
1. `test_chunk2_auth_roles.cjs` (28 tests) — Authentication, tokens, role guards, privilege escalation defense.
2. `test_chunk3_listings_2d.cjs` (25 tests) — Workspaces, 2D availability, layout publish, pricing quotes.
3. `test_chunk4_concurrency_lifecycle.cjs` (14 tests) — 20 competing holds, single winner, reservation.
4. `test_chunk5_payments_financials.cjs` (22 tests) — Mock payment, idempotency, QR digital pass, payout, refund.
5. `test_chunk6_operations.cjs` (17 tests) — Chat, maintenance issues, reviews, disputes, wishlist, banners.
6. `test_chunk7_per_api_matrix.cjs` (30 tests) — Positive and negative cases across every controller.
7. `test_chunk7_browser_e2e.cjs` (18 tests) — Live frontend routes, DOM elements, branding, Alwar exclusion.
8. `test_chunk8_benchmarks.cjs` (100 samples) — Microsecond-level latency performance verification.

---

## 6. Flagship Locations & Public Invariants

- **Active Published Flagships**:
  - `lehariya-jaipur`: A Tower - 1st Floor, Lehariya | KGK Realty, Tonk Road, Jaipur
  - `horizon-jaipur`: Horizon Tower, Level 4, JLN Marg, Jaipur
- **Public Invariant**: Alwar is strictly removed from all public-facing listings, explore filters, and homepage discovery.
