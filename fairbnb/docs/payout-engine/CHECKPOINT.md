# Payout Split Engine Checkpoint

## Current Status
* **Current Phase**: Phase 9 Completed — Webhook V1 Contract Correctness, Transfer Confirmation Semantics, Documentation Drift Resolution, HTTP Acceptance & Zero-Leak Resource Cleanup
* **Active Branch**: `govind-temp`
* **HEAD**: `428e8b82a8dbb5d96376c7af56bcd5c67ae6eed9`
* **Working Tree**: Preserved all existing tracked and untracked work. No uncommitted modifications staged or committed.

## Phase Progress
- [x] Preflight verification & repo safety audit
- [x] Phase 0: Close Remaining Foundation Issues (Float precision collision fix, strict test DB isolation)
- [x] Phase 1: Integrate Snapshots with Booking Creation (atomic transaction, concurrency lock on property)
- [x] Phase 2: Refund Allocation and Financial Coordination (component-level breakdown, hold logic, per-booking coordination lock)
- [x] Phase 3: Settlement Service and Lifecycle Integration (revisions, deterministic allocation keys, eligibility state machine, crash recovery cron)
- [x] Phase 4: Admin, Host and Co-Host Experience (authorized APIs, breakdown queries, revision view, safe BigInt serialization)
- [x] Phase 5: Real Payment and Refund Provider Boundary (Cashfree sandbox contract, HMAC webhook verification, mock/sandbox/production separation)
- [x] Phase 6: Durable Recipient Transfers (idempotent intent/attempt, 7-step lifecycle, partial retry isolation, unknown state preservation, mandatory current-revision admin authorization under financial lock, stale approval invalidation upon refund/refresh)
- [x] Phase 7: Post-Payout Refunds and Adjustments (append-only adjustment ledgers, recovery obligations)
- [x] Phase 8: Complete Verification and Release Candidate Handoff (Cashfree Bearer token auth, DISABLED mode guard, simulation tagging, 9 test suites, 112/112 passing tests, Next.js frontend build 49/49 pages, NestJS build 0 errors, clean DB verification)
- [x] Phase 9: Acceptance Gap Closures:
  - [x] Cashfree Payouts Webhooks V1 contract: POST-parameter sort + concatenation + HMAC-SHA256 Base64 with secret key, strictly separated from Payment Gateway header verification.
  - [x] Transfer confirmation semantics: `acknowledged=0` leaves intent in pending/processing; `TRANSFER_ACKNOWLEDGED` (or `TRANSFER_SUCCESS` with `acknowledged=1`) completes intent and marks allocation `PAID` exactly once (idempotent); `TRANSFER_REVERSED` marks intent `FAILED`, allocation `REVERSED`, and records `PayoutAdjustment`.
  - [x] Simulation & disabled safeguards: missing credentials block fallback, simulation identity persists & renders in UI, disabled mode checked pre-reservation with status reconciliation permitted.
  - [x] Documentation drift resolved in `PAYOUT_ENGINE_EXPLAINED.md`: removed double-entry ledgering claims, stated exact row lock on `Booking`, exact env vars, verified percentage bases and `FIXED_AMOUNT` hold behavior without silent capping.
  - [x] HTTP Acceptance test suite with real JWT auth, guards, validation, and role protection on isolated DB (`fairbnb_acceptance_db`) (10/10 tests pass).
  - [x] Clean resource termination: zero Jest `--forceExit`, exact database creation & drop without wildcards, zero leak in shared DB `fairbnb_db`.
  - [ ] Browser verification: BLOCKED (manual checklist provided below).
  - [ ] Real sandbox verification: BLOCKED (credentials to be supplied later).

## Checkpoint Resume Artifacts
* Test Suites (133 passing tests across 11 test files):
  * `src/payouts/providers/cashfree.provider.spec.ts` (Phase 9 Cashfree V1 contract & shapes - 11 tests)
  * `test/payout-http-acceptance.e2e-spec.ts` (Phase 9 HTTP route acceptance with guards - 10 tests)
  * `src/payouts/transfer-execution-and-adjustments.spec.ts` (Phases 6, 7 & 9 durable transfers, disabled guards, retry isolation - 13 tests)
  * `src/payouts/money.spec.ts` (Phase 0 - 9 tests)
  * `src/payouts/split-calculator.spec.ts` (Foundational pure math - 25 tests)
  * `src/payouts/snapshot.persistence.spec.ts` (Snapshot adapter & lock - 11 tests)
  * `src/payouts/snapshot.adapter.spec.ts` (Snapshot conversion & precision - 29 tests)
  * `src/bookings/booking-snapshot-capture.spec.ts` (Phase 1 atomic capture - 8 tests)
  * `src/payouts/financial-coordination.spec.ts` (Phase 2 refund coordination - 7 tests)
  * `src/payouts/settlement.spec.ts` (Phase 3 settlement & holds - 9 tests)
  * `src/payouts/payout-engine-e2e-smoke.spec.ts` (Phase 8 full e2e lifecycle smoke test - 1 test)
* Frontend Application Screens:
  * `frontend/src/app/admin/settlements/page.tsx` (Admin Settlement Explorer, Revisions, Drawer, Component Refund, amber `SIMULATED` badge and warning banner)
  * `frontend/src/app/host/earnings/page.tsx` (Host Earnings & Breakdown Portal with `SIMULATED PAYOUT` badge)
  * `frontend/src/app/co-host/earnings/page.tsx` (Co-Host Commission & Entitlements Portal with `SIMULATED` badge)
* Database State:
  * Shared database (`fairbnb_db` on port 5433): 0 rows in `BookingFinanceSnapshot`, 0 settlements, 0 transfers, 0 test fixtures leaked, completely untouched.
  * Isolated test database (`fairbnb_acceptance_db` on port 5433): Created, migrated, validated, and cleanly dropped by exact name (no wildcards used). Zero open connections or database leftovers.

---

## Manual Browser Acceptance Checklist

To execute visual verification manually against the local application:

1. **Start Backend & Frontend Servers**:
   ```bash
   # Terminal 1: Start backend on port 3001
   cd backend && npm run start:dev

   # Terminal 2: Start frontend on port 3000
   cd frontend && npm run dev
   ```

2. **Verify Admin Settlement Explorer (`http://localhost:3000/admin/settlements`)**:
   - [ ] Log in as Admin (`admin@fairbnb.com`).
   - [ ] Open a booking with simulated payout execution.
   - [ ] Confirm the amber **SIMULATED** badge is rendered alongside the banner: `"⚠️ Simulated Payout — No real money was disbursed through the banking network"`.
   - [ ] Verify recipient privacy: Co-host bank account / beneficiary details are masked (`••••1234`).
   - [ ] Click **Authorize Settlement**; verify state changes to `APPROVED` and audit trail records admin ID.
   - [ ] Trigger simulation error or hold state; verify hold reason badge (`COHOST_EXCEEDS_POOL` or `ADMIN_HOLD`) is clearly rendered.

3. **Verify Host Earnings Portal (`http://localhost:3000/host/earnings`)**:
   - [ ] Log in as Host (`host@fairbnb.com`).
   - [ ] View booking payout breakdown: verify accommodation, cleaning fee, platform commission deduction, and net payout.
   - [ ] Confirm simulated payouts display amber `"SIMULATED PAYOUT"` badge.
   - [ ] Verify host cannot see co-host's full bank details.

4. **Verify Co-Host Earnings Portal (`http://localhost:3000/co-host/earnings`)**:
   - [ ] Log in as Co-Host (`cohost@fairbnb.com`).
   - [ ] View commission entitlements: verify percentage / fixed amount and net disbursement.
   - [ ] Confirm simulated payouts display amber `"SIMULATED"` badge.
