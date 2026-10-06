# Jest, Integration & Build Verification Report

**Run ID**: `run-20260921-1150`  
**Execution Date**: `2026-09-21T12:00:00+05:30`  
**Environment**: Windows (Win32 x64), Node.js `v24.18.0`, PostgreSQL `5433` (`fairbnb_qa_audit_run_20260921_1150`)

---

## 1. Build & Compilation Verification

| Target | Command | Result | Duration | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Backend TypeScript Build** | `npm run build` in `backend/` | **PASS** | 8.2s | NestJS `nest build` completed with 0 errors. All controller and service bundles emitted to `backend/dist/`. |
| **Frontend Production Build** | `npm run build` in `frontend/` | **PASS** | 36.6s | Next.js 16.3.1 Turbopack build succeeded. 56 static and dynamic routes generated, including `/admin/coupons` and `/admin/settlements`. |

---

## 2. Unit & Service Specs Suite (`npm run test`)

- **Command**: `npm run test` (in `backend/`)
- **Total Test Suites**: 32
- **Passed Suites**: 29
- **Failed Suites**: 3
- **Total Tests**: 248
- **Passed Tests**: 246
- **Failed Tests**: 2
- **Duration**: 25.865 s
- **Exit Code**: 1

### Detailed Suite Breakdown
| Suite Path | Category | Tests (Pass/Fail) | Status | Failure Summary / Root Cause |
| :--- | :--- | :--- | :--- | :--- |
| `src/coupons/rules/rules.spec.ts` | Coupons Rule Engine | 26 / 0 | **PASS** | Active, Expiry, MinOrder, and UsageLimit rule isolation verified. |
| `src/coupons/coupons.controller.spec.ts` | Coupons Controller | 12 / 0 | **PASS** | Admin coupon creation, validation, and listing. |
| `src/payouts/split-calculator.spec.ts` | Payout Split Engine | 18 / 0 | **PASS** | 4 co-host rules + fixed models, precision math. |
| `src/payouts/money.spec.ts` | Financial Math | 14 / 0 | **PASS** | BigInt paise arithmetic, rounding guards, no float drift. |
| `src/payouts/settlement.spec.ts` | Settlement Lifecycle | 16 / 0 | **PASS** | State machine, hold conditions, revision tracking. |
| `src/payouts/snapshot.adapter.spec.ts` | Financial Snapshot | 8 / 0 | **PASS** | Rule persistence, rule snapshot immutability. |
| `src/payouts/transfer-execution-and-adjustments.spec.ts` | Payout Transfers | 13 / 0 | **PASS** | 2-recipient filtering, idempotent execution, adjustments. |
| `src/payouts/providers/cashfree.provider.spec.ts` | Gateway Integration | 11 / 0 | **PASS** | Sandbox bearer refresh, mock simulation, failure handling. |
| `src/bookings/availability.service.spec.ts` | Booking Engine | 4 / 0 | **PASS** | Active stay availability check, double-booking guard. |
| `src/bookings/cancellation.service.spec.ts` | Cancellation Engine | 3 / 0 | **PASS** | 6-state transition, refund calculation, coupon release. |
| `src/bookings/booking-snapshot-capture.spec.ts` | Financial Snapshot | 6 / 0 | **PASS** | Automatic snapshot capture on checkout. |
| `src/payouts/payout-engine-e2e-smoke.spec.ts` | Payout Smoke | 7 / 0 | **PASS** | End-to-end split to simulated payout. |
| `src/reviews/reviews.service.spec.ts` | Reviews Module | 5 / 0 | **PASS** | Review creation, permissions, replies. |
| `src/admin/admin-flow.spec.ts` | Admin Operations | 8 / 0 | **PASS** | Admin property approval/rejection flows. |
| `app.controller.spec.ts` | Core Root Controller | 0 / 1 | **FAIL** | **Pre-existing test defect**: Missing `PrismaService` mock in `Test.createTestingModule({ controllers: [AppController], providers: [AppService] })`. |
| `reels/reels-schema.spec.ts` | Reels Schema | 0 / 1 | **FAIL** | **Client sync defect**: `TypeError: Cannot read properties of undefined (reading 'create')` because `@prisma/client` in `node_modules` lacks generated Reels model methods. |
| `reels/reels-profile.spec.ts` | Reels Profile | 0 / 0 (Runner crashed) | **FAIL** | **Client sync defect**: `TypeError: Cannot convert undefined or null to object` at `@IsEnum(ReelStatus)` because `ReelStatus` enum was not exported by stale Prisma client. |

---

## 3. End-to-End Test Suite (`npm run test:e2e`)

- **Command**: `npx jest --config ./test/jest-e2e.json --runInBand`
- **Total Test Suites**: 12
- **Passed Suites**: 10
- **Failed Suites**: 2
- **Total Tests**: 103
- **Passed Tests**: 101
- **Failed Tests**: 2
- **Duration**: 32.462 s
- **Exit Code**: 1

### Detailed E2E Breakdown
| Suite Path | Scope | Tests (Pass/Fail) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `test/payout-http-acceptance.e2e-spec.ts` | Payout HTTP Routes & RBAC | 10 / 0 | **PASS** | Validates authorization requirements, stale rev blocking, partial retry, 403 cross-recipient isolation, HMAC webhooks, and reversals. |
| `test/manual-integration.e2e-spec.ts` | Properties End-to-End | 10 / 0 | **PASS** | Host property creation, public catalog hiding pending, admin approval, and Mumbai catalog display. |
| `test/app.e2e-spec.ts` | Root App | 1 / 0 | **PASS** | Core app endpoint. |
| `test/booking-flow.e2e-spec.ts` | Booking Journey | 8 / 0 | **PASS** | Quote, creation, checkout preview. |
| `test/cancellation-refund.e2e-spec.ts` | Cancellation & Refund | 9 / 0 | **PASS** | Guest cancellation, host cancellation, refund holds. |
| `test/co-host-agreements.e2e-spec.ts` | Co-Host Agreements | 12 / 0 | **PASS** | Invitation token acceptance, rule creation, suspension. |
| `test/coupon-concurrency.e2e-spec.ts` | Concurrent Coupon Checkout | 9 / 1 | **FAIL** | **Teardown defect**: The test logic and concurrency race protection passed, but `afterAll` hook threw `Foreign key constraint violated on BookingFinanceSnapshot_bookingId_fkey` due to deleting bookings before snapshot children. |
| `test/coupon-release.e2e-spec.ts` | Atomic Coupon Release | 8 / 1 | **FAIL** | **Teardown defect**: Coupon release logic passed, but `afterAll` teardown hook threw `Foreign key constraint violated on BookingFinanceSnapshot_bookingId_fkey`. |

---

## 4. Defect Findings from Phase 1

1. **DEFECT-01 (Pre-existing)**: `app.controller.spec.ts` omits `PrismaService` provider, failing NestJS DI injection.
2. **DEFECT-02 (Schema Client Sync)**: Newly merged Reels migrations from `origin/main` define `Reel` and `ReelStatus`, but local `node_modules/@prisma/client` requires regeneration to expose these bindings.
3. **DEFECT-03 (E2E Teardown Constraint)**: `coupon-concurrency.e2e-spec.ts` and `coupon-release.e2e-spec.ts` clean up test bookings using `prisma.booking.deleteMany({ where: { couponCode } })`. Since `BookingFinanceSnapshot` was added with `onDelete: Restrict`, child snapshots must be deleted prior to parent bookings.
