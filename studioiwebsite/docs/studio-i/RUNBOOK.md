# Studio I — Operational Runbook (`RUNBOOK.md`)

> **Windows PowerShell-Friendly Execution, Seeding, Running, Testing & Cleanup Guide**

---

## 1. Prerequisites & Environment

- **Operating System**: Windows 10/11 x64
- **Runtime**: Node.js `v20.x` or `v24.x` (Verified: `v24.18.0`)
- **Database**: PostgreSQL 16 on `localhost:5432` with user `postgres` and password `Password@246`
- **Frontend Port**: `3000`
- **Backend Port**: `5002`

---

## 2. Database Initialization

### 2.1 Create Isolated Task-Owned Databases
Run in PowerShell:
```powershell
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Password%40246@localhost:5432/postgres' });
client.connect().then(async () => {
  await client.query('CREATE DATABASE studioi_dev');
  console.log('Created studioi_dev');
  await client.end();
}).catch(e => { console.log(e.message); client.end(); });
"
```

### 2.2 Run Migrations
```powershell
cd backend
$env:DATABASE_URL="postgresql://postgres:Password%40246@localhost:5432/studioi_dev?schema=public"
npx prisma migrate deploy
npx prisma generate
```

### 2.3 Seed Deterministic Coworking Fixtures
```powershell
node backend/prisma/seed.cjs
```

---

## 3. Starting the Applications

### 3.1 Start Studio I Backend (Port 5002)
```powershell
cd backend
npm run start:dev
# Backend listens on http://localhost:5002/api/v1
```

### 3.2 Start Studio I Frontend (Port 3000)
```powershell
# In root workspace directory:
npm run dev
# Frontend serves on http://localhost:3000
```

---

## 4. Running Automated Tests & Verification

### 4.1 Run Unit & Integration Tests
```powershell
cd backend
npm run test
```

### 4.2 Run CDP Browser End-to-End Journeys
```powershell
node qa/studio-i/execute_e2e_journeys.cjs
```

### 4.3 Run Latency & Concurrency Benchmarks
```powershell
node qa/studio-i/measure_benchmarks.cjs
```

---

## 5. Safe Teardown & Cleanup

To stop running test processes and clean transient test databases without touching other databases:
```powershell
node qa/studio-i/cleanup_qa.cjs
```
