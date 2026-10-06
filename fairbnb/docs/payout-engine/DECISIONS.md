# Architecture & Financial Policy Decisions

## 1. Monetary Precision and Number Handling
* **Internal Representation**: All money is strictly stored and calculated as `bigint` in paise (1 INR = 100 paise).
* **Float Rupee Inputs**: Legacy IEEE-754 floating point rupee values must NOT exceed a conservative threshold where adjacent-paisa resolution is compromised.
  * Demonstrable collision: `Number("90071992547409.90") === Number("90071992547409.91")` evaluates to `true`.
  * We enforce a conservative maximum safe float threshold of **₹1,000,000,000.00 (₹100 Crores / 1 Billion INR)** for legacy float inputs. At ₹1B, the ULP is $\approx 2.38 \times 10^{-7}$ rupees (0.00002 paise), far below 0.01 paise and representation noise. Values above this limit or containing non-noise fractional paise (> 2 decimal places with material drift > 1e-5) are explicitly rejected or held for review.
  * Direct string/decimal and bigint inputs are preferred for all exact monetary amounts.

## 2. Test Database Isolation
* Tests writing to PostgreSQL must NEVER default to or connect to the shared development database (`fairbnb_db` on port 5432).
* Tests require an explicitly configured, positively identified disposable test database (`fairbnb_test_capture` on port 5433).
* Hard block in test runners: If connection URL targets `fairbnb_db` or `fairbnb_dev`, the test suite aborts immediately with an error.
* Zero fixture rows may remain in any database. Strict manifest tracking cleans test-created fixtures in dependency order during `afterAll`/`finally`.

## 3. Co-Host Rule Alignment
* Four authoritative rule types:
  1. `PERCENTAGE`
  2. `FIXED_AMOUNT`
  3. `CLEANING_FEE`
  4. `CLEANING_FEE_PLUS_PERCENTAGE`
* Legacy `'FIXED'` is explicitly normalized to `FIXED_AMOUNT` with `legacyRuleType: 'FIXED'` recorded in terms; no historical rows are silently altered.

## 4. Financial Snapshot Immutability & Booking Creation
* Created synchronously within the booking transaction (`prisma.$transaction`).
* Concurrency lock: `SELECT "id" FROM "Property" WHERE "id" = ... FOR UPDATE;` protects property and co-host payout rule queries from concurrent mutation during checkout.
* External calls (Cashfree order creation) are placed strictly outside the database transaction.
* Missing agreements or funding gaps produce `NEEDS_REVIEW` snapshots, allowing valid bookings to complete without guessing terms.

## 5. Refund Component Allocation & Financial Coordination Lock
* Refund components must explicitly itemize:
  * Accommodation (`accommodationRefundPaise`)
  * Cleaning fee (`cleaningRefundPaise`)
  * Platform fee (`platformFeeRefundPaise`)
  * GST/Tax reserve (`taxRefundPaise`)
* The sum of components must reconcile exactly to the total refund paise.
* Scalar refunds lacking component breakdown are never assumed to reverse tax or penalize host/guest; they immediately trigger a `SCALAR_REFUND_WITHOUT_BREAKDOWN` hold.
* Per-booking financial coordination lock (`SELECT id FROM "Booking" WHERE id = ... FOR UPDATE`) serializes refund reservations, settlement calculations, and transfer claims.
* Pending and unknown refund states consume refundable capacity; terminal failures release reserved capacity.

## 6. Settlement Revisions, Allocations & Eligibility Gates
* Revisions are strictly append-only and immutable. Each revision captures:
  * Net split calculation outputs from the pure calculator.
  * Deterministic allocation keys: `HOST:<userId>`, `CO_HOST:<userId>`, `PLATFORM:SYSTEM`, `TAX:GST`. Nullable user fields are never used for uniqueness.
* Eligibility validation enforces:
  * Snapshot reviewed & valid policy (`NEEDS_REVIEW` is blocked).
  * Booking in terminal completion state (`COMPLETED`).
  * Capture currency (INR) and amount matches snapshot gross price.
  * No in-flight or unresolved refunds (`IN_FLIGHT_REFUND_HOLD`).
  * No active disputes (`ACTIVE_DISPUTE_HOLD`).
  * Real gateway configured (mock payments blocked for live disbursement).
* Missed or delayed settlements can be safely refreshed without disbursing funds.

## 7. Durable Recipient Transfers (7-Step Protocol)
1. Acquire per-booking coordination lock (`FOR UPDATE`).
2. Re-verify revision status, eligibility, and lack of active holds.
3. Reserve/claim eligible recipient allocations via `PayoutTransferIntent` (`PENDING`).
4. Persist immutable transfer reference (`transferRef`) and destination details.
5. Commit transaction before invoking provider.
6. Dispatch transfer API call outside database transaction.
7. Reconcile verified result inside transaction:
   * On timeout or network error: mark `UNKNOWN` and retain reservation.
   * Duplicate transfer calls return existing intent; no duplicate transfers can be generated.
   * Partial success isolation: If host succeeds and co-host fails, settlement is marked `PARTIALLY_SETTLED`, and only the failed co-host allocation is retryable.
   * Accounting components (`PLATFORM:SYSTEM`, `TAX:GST`) are strictly excluded from banking transfer dispatch.

## 8. Post-Payout Refunds & Adjustments
* If a refund or reversal occurs after funds have been disbursed:
  * Existing transfer history (`PayoutTransferIntent`, `PayoutTransferAttempt`) is preserved intact.
  * An append-only `PayoutAdjustment` is created recording:
    * `alreadyPaidPaise`
    * `revisedEntitlementPaise`
    * `recoveryObligationPaise`
  * No silent deduction from unrelated future bookings without an explicit signed business policy.

## 9. Cashfree Gateway Boundary
* Cashfree PG and Payouts APIs use separate credentials and endpoint models:
  * Payment Collection: Orders API (`/pg/orders`)
  * Refunds: Order Refunds API (`/pg/orders/{order_id}/refunds`)
  * Payouts Disbursement: Cashfree Payouts Standard V1 API (`POST /payout/v1/requestTransfer`, auth via `POST /payout/v1/authorize`, status via `GET /payout/v1/getTransferStatus`)
* HMAC-SHA256 signature verification protects webhooks with strict byte-length check before `crypto.timingSafeEqual`:
  * Payment Gateway webhooks verify header `x-webhook-signature` over `${timestamp}${rawBody}`.
  * Payouts Webhook V1 verifies POST-parameter concatenation signature over alphabetically sorted parameters.
* Explicit environment mode separation: `SANDBOX`, `PRODUCTION`, `MOCK`.
* Missing credentials in `SANDBOX` or `PRODUCTION` throw `ServiceUnavailableException`; they never fall back to `MOCK` simulation.
* Real sandbox and browser visual verifications remain explicitly marked `BLOCKED` until credentials and automation runner are provisioned.
