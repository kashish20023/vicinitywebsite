# FairBnB Payout Split Engine — Living Progress Tracker

This document is the authoritative progress tracker, decisions log, technical debt registry, and file inventory for the FairBnB Payout Split Engine. It must be updated at the end of **every** payout engine chunk.

---

## 1. Reference

* **Source Plan**: *"FairBnB Payout Split Engine: Architecture and Delivery Plan v1"* (Section 19: 8-chunk roadmap).
* **Chunk 2 Sub-step Execution Note**: Chunk 2 ("Booking Financial Snapshot & Settlement Foundation") was subdivided during execution for rigorous verification and to prevent unused database schemas:
  * **Chunk 2A**: Standalone financial snapshot schema (`BookingFinanceSnapshot`), pure adapter, exact BigInt paise conversions, safe defaults, row-level PostgreSQL check constraints, and concurrency tests.
  * **Chunk 2A-R1**: Focused repair and verification pass: transaction-safe create-once locking helper (`SELECT ... FOR UPDATE`), canonical business comparison normalization, float boundary tolerance guards, and isolation cleanup verification.
  * **Pre-2B Fix**: Schema-history repair migration resolving the missing historical migration for `CoHostRelationship`, `PayoutRule`, and `FinancialTransaction`.
  * **Chunk 2B**: Integration wiring of financial snapshot capture into real booking creation (`bookings.service.ts`), enforcing consistent Property-before-Booking lock ordering.
  * **Deferred to Chunk 4**: `BookingSettlement`, `SettlementRevision`, and `SettlementAllocation` schemas are deferred to Chunk 4 to prevent creating unused models before consumer logic exists.

---

## 2. Chunk Status Table

| Chunk | Original Plan Output | Acceptance Gate | Status | Sub-steps Completed | Branch / Commit Reference | Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Chunk 1** | Pure deterministic split calculator (`split-calculator.ts`, `money.ts`) | 25 unit test cases passing, zero float drift, half-up rounding, 100% reconciliation invariant | **DONE** | Calculator core, types, unit tests, formula notes | `govind-temp` @ `428e8b8` | 2026-09-17 |
| **Chunk 2** | Immutable Booking Snapshot & Settlement schema/wiring | Transaction-safe persistence, immutable snapshot capture during booking creation, concurrency tests | **DONE** | 2A (Snapshot model), 2A-R1 (Repair & locking verification), Pre-2B (Migration gap fix), 2B (Booking creation wiring & Property-before-Booking locking) | `govind-temp` | 2026-09-17 |
| **Chunk 3** | Refund allocation engine & post-refund split adjustment | Refund allocation math, absorption rules (Platform vs Host funded discounts), idempotency | **NOT STARTED** | None | — | Pending |
| **Chunk 4** | Settlement lifecycle state machine & database models | `BookingSettlement`, `SettlementRevision`, `SettlementAllocation`, audit trail, cancellation triggers | **NOT STARTED** | None | — | Pending |
| **Chunk 5** | Host & Co-Host payout calculation services | Payout readiness evaluator, dispute holds, co-host allocation splits, transfer payload generator | **NOT STARTED** | None | — | Pending |
| **Chunk 6** | Cashfree payout provider adapter & webhooks | Idempotent transfer execution, transfer status sync, webhook reconciliation, double-payout guards | **NOT STARTED** | None | — | Pending |
| **Chunk 7** | Admin & Host Payout Dashboard APIs | Payout ledger queries, breakdown inspection, hold/release controls, error reporting | **NOT STARTED** | None | — | Pending |
| **Chunk 8** | End-to-end integration & reconciliation audit | Full lifecycle e2e tests (Booking -> Payment -> Split -> Refund -> Payout -> Audit reconciliation) | **NOT STARTED** | None | — | Pending |

---

## 3. Key Decisions Log

1. **Chunk 2 Scope Partitioning (Chunk 2A, 2A-R1, 2B vs Chunk 4)**:
   * *Decision*: Split Chunk 2 into 2A (model + pure adapter + persistence) and 2B (live booking creation wiring). Defer `BookingSettlement`, `SettlementRevision`, and `SettlementAllocation` models to Chunk 4.
   * *Rationale*: Audit #2 identified three previously created models (`FinancialTransaction`, `PayoutRequest`, `PayoutRule`) that sat unused in the repository with no consuming logic. To prevent repeating this anti-pattern, settlement records will only be introduced alongside the settlement lifecycle state machine in Chunk 4.
2. **Co-Host (PayoutRule) Splits In Scope for V1**:
   * *Decision*: Co-host percentage, fixed amount, and cleaning fee plus percentage splits are in scope for V1 calculation.
   * *Rationale*: The property model and co-host relationship models already define co-host assignment; payout calculations must support split payouts to prevent manual reconciliation.
3. **Broker Commission Out of Scope Entirely**:
   * *Decision*: Broker commission logic and fields are excluded from V1 (`brokerCommission = 0` conceptually).
   * *Rationale*: Audit #2 confirmed zero broker models or business logic exist in FairBnB. No phantom fields will be added.
4. **Service Fee Refund Policy**:
   * *Decision*: **NOT YET DECIDED — must resolve before Chunk 3/4**.
   * *Context*: Whether the platform retains 100% of guest service fees on cancellation or refunds service fees proportionally must be aligned with FairBnB business terms before Chunk 3 refund allocation math is finalized.
5. **Historical Migration Gap Remediation (Pre-2B)**:
   * *Decision*: Generate an additive historical migration (`20260917173000_add_missing_cohost_payout_history`) using `prisma migrate diff` and resolve it as applied on the development database.
   * *Rationale*: `CoHostRelationship`, `PayoutRule`, and `FinancialTransaction` were pushed to development via `prisma db push` in past work without committed migrations, breaking clean-install database replays. Resolving this pre-existing gap unblocks clean test database deployment.
6. **Transaction-Safe Locking Protocol for Snapshots**:
   * *Decision*: Acquire a parameterized exclusive row lock on the parent `Booking` row (`SELECT "id" FROM "Booking" WHERE "id" = $1 FOR UPDATE`) before checking or creating the financial snapshot, rather than catching `P2002` errors.
   * *Rationale*: In PostgreSQL, catching a unique-constraint violation inside an interactive transaction aborts the transaction block. Row-locking ensures transactions remain healthy and serialization is handled natively by the database engine.
7. **Consistent Property-Before-Booking Lock Order in Chunk 2B**:
   * *Decision*: During booking creation, acquire locks in consistent order: `Property` row first, then `Booking` row. Update `co-host.service.ts` to acquire the same `Property` lock inside transactions when creating, updating, or deleting payout rules.
   * *Rationale*: Prevents race conditions and deadlocks when a host edits a co-host payout rule simultaneously with an incoming booking creation.
8. **Ambiguous Co-Host Rules Handled Fail-Safe as UNRESOLVED**:
   * *Decision*: If multiple active `PayoutRule` records are found for a property during booking creation, the snapshot captures `coHostAgreementStatus: 'UNRESOLVED'` with review reason `'AMBIGUOUS_MULTIPLE_ACTIVE_COHOST_RULES'` instead of arbitrarily guessing a rule.
   * *Rationale*: Financial safety invariant per plan section 10: ambiguous splits require manual human/audit resolution before funds can be disbursed.

---

## 4. Known Issues / Technical Debt (Tracked for Later)

1. **Host Dashboard `totalEarnings` Inaccuracy**:
   * *Flagged In*: Audit #2 & Chunk 1.
   * *Issue*: Existing host dashboard currently sums raw booking `totalAmount`, incorrectly including the platform service fee and GST/tax in the host's reported earnings.
   * *Resolution Status*: Open; to be fixed in Chunk 7 when the dedicated host payout and earnings API is implemented.
2. **Mock Refund Completion Without Gateway Verification**:
   * *Flagged In*: Audit #1 & Audit #2.
   * *Issue*: Admin refund endpoints mark refund records as `COMPLETED` directly without initiating or confirming a real payment gateway refund.
   * *Resolution Status*: Open; must be replaced with real Cashfree refund calls in Chunk 6.
3. **Double-Booking Range Check Concurrency**:
   * *Flagged In*: Booking Lifecycle Audit.
   * *Issue*: Booking overlapping date checks must rely on strict row/table locking to prevent race conditions during simultaneous checkout.
   * *Resolution Status*: Documented in `docs/HANDOFF_COUPON_AND_BOOKING_LIFECYCLE.md`; reinforced by Chunk 2B lock ordering.

---

## 5. File Inventory

### Chunk 1: Pure Deterministic Split Calculator
* [`backend/src/payouts/money.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/money.ts): Exact BigInt paise arithmetic, boundary float conversions, safe magnitude checks, and half-up basis points rounding.
* [`backend/src/payouts/split-calculator.types.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/split-calculator.types.ts): Type contracts for split inputs, breakdown allocations, held reason codes, and reconciliation invariants.
* [`backend/src/payouts/split-calculator.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/split-calculator.ts): Pure deterministic calculation engine calculating host, co-host, platform, and tax pools.
* [`backend/src/payouts/split-calculator.spec.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/split-calculator.spec.ts): 25 unit tests covering fixtures A–H, rounding bounds, refund allocations, and invariants.
* [`backend/src/payouts/formula-notes.md`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/formula-notes.md): Reference mathematical formulas and reconciliation rules.

### Chunk 2A & 2A-R1: Immutable Booking Snapshot Foundation
* [`backend/prisma/schema.prisma`](file:///c:/Users/shubham/fairbnb--new/backend/prisma/schema.prisma): Added `BookingFinanceSnapshot` model with safe defaults (`UNRESOLVED` / `NEEDS_REVIEW`) and 1:1 relation to `Booking`.
* [`backend/prisma/migrations/20260917150000_add_booking_finance_snapshot/migration.sql`](file:///c:/Users/shubham/fairbnb--new/backend/prisma/migrations/20260917150000_add_booking_finance_snapshot/migration.sql): Migration creating `BookingFinanceSnapshot` with indexes, foreign key, and 13 PostgreSQL `CHECK` constraints.
* [`backend/src/payouts/snapshot.types.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/snapshot.types.ts): Type definitions for raw source facts, validated snapshot data, and serialized DTOs.
* [`backend/src/payouts/snapshot.adapter.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/snapshot.adapter.ts): Pure adapter converting raw booking financials to validated BigInt paise snapshots with co-host and discount validation.
* [`backend/src/payouts/snapshot.adapter.spec.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/snapshot.adapter.spec.ts): 20 unit tests verifying float conversions, sub-bps precision rejection, and canonical comparison normalization.
* [`backend/src/payouts/snapshot.persistence.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/snapshot.persistence.ts): Atomic transaction persistence helper (`saveBookingFinanceSnapshot`) using parameterized `SELECT FOR UPDATE` locking and canonical comparison.
* [`backend/src/payouts/snapshot.persistence.spec.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/payouts/snapshot.persistence.spec.ts): 11 PostgreSQL integration tests verifying concurrent create-once behavior, transaction health, DB constraints, Scenario 12 smoke fixture, and zero-leak cleanup.

### Historical Gap Remediation (Pre-2B)
* [`backend/prisma/migrations/20260917173000_add_missing_cohost_payout_history/migration.sql`](file:///c:/Users/shubham/fairbnb--new/backend/prisma/migrations/20260917173000_add_missing_cohost_payout_history/migration.sql): Additive migration capturing historical `CoHostRelationship`, `PayoutRule`, `FinancialTransaction`, `Tag`, `Amenity`, `Banner`, and `Lead` models.

### Chunk 2B: Booking-Integration Wiring & Property-Before-Booking Locking
* [`backend/src/bookings/bookings.service.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/bookings/bookings.service.ts): Integrated `buildBookingFinanceSnapshot` and `saveBookingFinanceSnapshot(tx, ...)` inside `createGuestBooking` transaction with explicit `SELECT "id" FROM "Property" WHERE "id" = $1 FOR UPDATE` lock ordering.
* [`backend/src/co-host/co-host.service.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/co-host/co-host.service.ts): Added transaction wrappers with `SELECT "id" FROM "Property" WHERE "id" = $1 FOR UPDATE` lock acquisition to `configurePayoutRule`, `confirmPayoutRule`, and `removeCoHost` to serialize co-host rule edits against booking creations.
* [`backend/src/bookings/booking-snapshot-capture.spec.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/bookings/booking-snapshot-capture.spec.ts): 6 PostgreSQL integration tests validating snapshot creation, active co-host agreement capture, concurrent booking + PayoutRule edits, post-capture immutability, ambiguous multi-rule `UNRESOLVED` state, and zero fixture leaks.

---

## 6. Glossary

* **Paise**: The smallest integer monetary unit in Indian Rupees (1 INR = 100 paise). All internal calculations and database snapshot amounts are represented strictly as `bigint` paise to eliminate floating-point rounding errors.
* **Basis Points (bps)**: A unit of measure for percentages where 1 basis point equals 0.01% (10,000 bps = 100.00%). Used to represent co-host commission rates with exact integer arithmetic.
* **CALCULATED vs HELD**: `CALCULATED` indicates a booking's split has reconciled with zero discrepancy and all requirements are met. `HELD` indicates calculation cannot proceed due to missing agreement evidence, funding gaps, or reconciliation errors.
* **Snapshot vs Settlement vs Revision vs Allocation**:
  * *Snapshot*: Immutable point-in-time capture of financial terms frozen at booking creation.
  * *Settlement*: Lifecycle record tracking payout release state and eligibility.
  * *Revision*: Versioned adjustment to a settlement triggered by post-booking events (e.g. refunds or disputes).
  * *Allocation*: Final net monetary amount payable to a specific recipient (Host, Co-Host, Platform, Tax authority).
* **Property-Before-Booking Concurrency Protocol**: A strict database lock acquisition ordering (`SELECT ... FROM "Property" ... FOR UPDATE` followed by `SELECT ... FROM "Booking" ... FOR UPDATE`) ensuring concurrent booking creations and co-host rule edits serialize predictably without deadlocks or torn agreement states.
