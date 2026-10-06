# FairBnB Payout Split Engine Architecture & Operations Guide

## Executive Overview

The FairBnB Payout Split Engine is an enterprise-grade financial disbursement and settlement subsystem engineered for mathematical precision, strict conservation of money, immutable audit ledgers, and idempotency. It manages funds collected from guests, applies automated co-host agreements, protects platform and tax reserves, executes bank transfers via Cashfree Payouts, and safely reconciles post-payout refunds and adjustments.

---

## Core Financial Axioms

1. **Integer Arithmetic**: All money values are strictly computed and persisted in integer paise (`1 INR = 100 paise`, represented in TypeScript and PostgreSQL as `BigInt`). No floating-point multiplication or division is permitted in settlement calculations.
2. **Conservation of Money**: For any settlement or split calculation:
   $$\text{Guest Total} = \text{Host Net} + \text{Co-Host Net} + \text{Platform Fee Net} + \text{Tax Net} + \text{Refunds Completed}$$
3. **Point-in-Time Immutability**: All calculations refer to frozen `BookingFinanceSnapshot` records created atomically within the booking transaction under a PostgreSQL `FOR UPDATE` lock. Future changes to property pricing, host settings, or co-host rules do not mutate past snapshots.
4. **Mandatory Administrative Authorization**: Payout transfers cannot execute on `READY` settlements alone. An explicit admin authorization step (`POST /admin/settlements/:id/authorize`) transitions status to `APPROVED`. Any subsequent event (such as a late refund) triggers recalculation, generating a higher revision and immediately invalidating previous approvals.
5. **Durable Two-Phase Transfer Protocol**: Money transfers are never executed blindly. The engine writes a persistent `PayoutTransferIntent` in `RESERVED` status with an idempotent transfer key before invoking the provider.
6. **Explicit Environment Separation**: 
   * `CASHFREE_ENV=DISABLED` or `CASHFREE_PAYOUTS_ENABLED=false`: Gateway transfer access blocked; throws `ServiceUnavailableException`. Status reconciliation remains permitted.
   * `CASHFREE_ENV=MOCK`: Local simulations returning tagged responses (`_simulated: true`, `MOCK_PROVIDER`).
   * `CASHFREE_ENV=SANDBOX`: Test credentials against Cashfree gamma sandbox. Missing credentials throw `ServiceUnavailableException`.
   * `CASHFREE_ENV=PRODUCTION`: Live credentials against Cashfree production endpoints with signature verification. Missing credentials throw `ServiceUnavailableException`.

---

## Architectural Components

```
+---------------------------------------------------------------------------------+
|                                BOOKING LIFECYCLE                                |
|  [Guest Booking] ---> [Lock Property] ---> [Capture BookingFinanceSnapshot]    |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                               SETTLEMENT LIFECYCLE                              |
|  [Stay Completed] ---> [Prepare Settlement] ---> [Eligibility Check]            |
|                                                      |                          |
|                             +------------------------+------------------------+ |
|                             |                                                 | |
|                             v (Issues Detected)                               v |
|                         [Status: HELD]                                 [Status: READY]  |
|                         (Hold Reasons)                                        | |
|                                                                               v |
|                                                                   [Admin Authorization]
|                                                                               | |
|                                                                               v |
|                                                                      [Status: APPROVED] |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                           TRANSFER EXECUTION SERVICE                            |
|  [Verify APPROVED & Revision] ---> [Row Lock on Booking] ---> [Transfer Intents]|
|                                                                      |          |
|  [Cashfree Provider (Bearer Auth)] <---------------------------------+          |
|                               |                                                 |
|                               v                                                 |
|  [Success / Partial / Unknown Timeout] ---> [Audit Trail & Revisions]          |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                          POST-PAYOUT ADJUSTMENTS                                |
|  [Late Refund / Dispute / Reversal] ---> [Append-Only PayoutAdjustment]         |
|  ---> [Negative Balance / Recovery Obligation Tracked for Future Bookings]     |
+---------------------------------------------------------------------------------+
```

---

## Component Deep Dive

### 1. Booking Finance Snapshot (`BookingFinanceSnapshot`)
* Captured synchronously inside `createGuestBooking` transaction in `bookings.service.ts`.
* Guarantees non-torn agreement capture by acquiring a row lock on `Property` before querying `PayoutRule`.
* Resolves the 4 supported co-host rule types:
  1. `PERCENTAGE`: Calculated as basis points of net host accommodation earnings:
     $$\text{netAccommodationPaise} = \text{basePaise} - \text{hostDiscountPaise} - \text{accommodationRefundPaise}$$
  2. `FIXED_AMOUNT`: Fixed rupee amount per stay. If the fixed amount exceeds the available host pool ($\text{netAccommodationPaise} + \text{netCleaningPaise}$), the engine does **not** silently cap the amount; it triggers a `COHOST_EXCEEDS_POOL` diagnostic and places the settlement in `HELD` status for admin resolution.
  3. `CLEANING_FEE`: 100% of net cleaning fee ($\text{cleaningPaise} - \text{cleaningRefundPaise}$) allocated to co-host.
  4. `CLEANING_FEE_PLUS_PERCENTAGE`: 100% of net cleaning fee plus percentage basis points of net accommodation.

### 2. Pure Financial Split Calculator (`split-calculator.ts`)
* Stateless calculation engine with zero database dependencies.
* Validates that total refund components match stated amounts before deduction.
* **Discount Funding Policy**:
  * Must be explicitly resolved to either `HOST` (discount deducted from host accommodation base; holds if discount exceeds `basePaise`) or `PLATFORM` (discount deducted from platform service fee; holds if discount exceeds `serviceFeePaise`).
  * If a discount exists but discount funding is `UNRESOLVED` or `NONE`, the calculation produces `UNRESOLVED_DISCOUNT_FUNDING` or `INVALID_DISCOUNT_FUNDING` diagnostics and places the settlement in `HELD` status. There are no pro-rated or split discount funding rules.

### 3. Financial Coordination Service (`financial-coordination.service.ts`)
* Implements transactional serialization via `withBookingFinancialLock(bookingId, callback)`.
* **Locking Implementation**: Acquires an explicit PostgreSQL row-level lock on the `Booking` record:
  ```sql
  SELECT "id" FROM "Booking" WHERE "id" = $1 FOR UPDATE;
  ```
  executed within an interactive transaction at `ReadCommitted` isolation level (15-second timeout). This strictly serializes incoming webhooks, refund reservations, settlement recalculations, and transfer claims for that booking.

### 4. Settlement Engine (`settlement.service.ts`)
* Evaluates strict eligibility criteria:
  1. Snapshot marked `VALID`.
  2. Policy version resolved.
  3. Booking status `COMPLETED` or `CANCELLED`.
  4. Payment captures verified without amount mismatches.
  5. Absence of unauthorized mock payments in live mode.
  6. Zero in-flight or unreviewed refunds.
  7. Zero open guest disputes.
  8. Codified policy for retained funds.
* Recalculation creates an immutable `SettlementRevision` incrementing `revisionNumber`.

### 5. Transfer Execution Service (`transfer-execution.service.ts`)
* Enforces `APPROVED` settlement status matching the exact current revision number under booking row lock.
* Checks `guardPayoutsEnabled()` before creating any transfer reservations or database records.
* Distributes transfers to host and co-host independently; failure of co-host transfer leaves settlement in `PARTIALLY_SETTLED` without impacting host disbursement. Retries execute only for the unpaid recipient.
* Network timeouts mark transfer attempt as `UNKNOWN` rather than failing, preventing double transfers until status query or webhook reconciliation completes.

### 6. Cashfree Provider Boundary (`cashfree.provider.ts`)
* **API Generation**: Cashfree Payouts Standard V1 Generation.
* **Official Documentation References**:
  * Authorization: [Cashfree Payouts Token API](https://docs.cashfree.com/reference/payouts-authorization) (`POST /payout/v1/authorize`)
  * Request Transfer: [Cashfree Standard Transfer API](https://docs.cashfree.com/reference/requesttransfer) (`POST /payout/v1/requestTransfer`)
  * Transfer Status: [Cashfree Get Transfer Status API](https://docs.cashfree.com/reference/gettransferstatus) (`GET /payout/v1/getTransferStatus?transferId={transferId}`)
  * Payouts Webhooks V1: [Cashfree Payouts Webhooks v1](https://www.cashfree.com/docs/api-reference/payouts/v2/webhooks/webhooks-v1)
* **Authentication Architecture**:
  * Uses `POST /payout/v1/authorize` with merchant headers `x-client-id` and `x-client-secret`.
  * Returns a Bearer token cached in-memory with expiration tracking and an automatic 60-second buffer before expiry.
  * Subsequent transfer and status requests supply `Authorization: Bearer <token>`.
* **Endpoints & Payloads**:
  * **Authorization**:
    ```http
    POST /payout/v1/authorize
    x-client-id: <CASHFREE_APP_ID>
    x-client-secret: <CASHFREE_SECRET_KEY>
    ```
    Response: `{ "status": "SUCCESS", "subCode": "200", "data": { "token": "...", "expiry": 300 } }`
  * **Execute Transfer**:
    ```http
    POST /payout/v1/requestTransfer
    Authorization: Bearer <token>
    Content-Type: application/json

    {
      "transferId": "FAIRBNB-BK123-H-abc12345",
      "amount": "12500.00",
      "beneId": "HOST_USER_ID",
      "transferMode": "banktransfer",
      "remarks": "FairBnB Host Payout BK123"
    }
    ```
  * **Transfer Status Query**:
    ```http
    GET /payout/v1/getTransferStatus?transferId=FAIRBNB-BK123-H-abc12345
    Authorization: Bearer <token>
    ```
* **Payouts Webhook V1 Verification Contract**:
  * Official Cashfree Payouts Webhooks V1 passes the signature inside the POST body as the `signature` parameter.
  * Verification algorithm:
    1. Collect all POST body parameters except `signature`.
    2. Sort keys alphabetically (lexicographical sorting).
    3. Concatenate non-empty values into `postData`.
    4. Compute `HMAC-SHA256(postData, CASHFREE_SECRET_KEY)` and Base64-encode.
    5. Compare against `payload.signature` using constant-time comparison (`crypto.timingSafeEqual`).
  * Strictly separated from Payment Gateway webhooks (`x-webhook-signature` header over `${timestamp}${rawBody}`) to prevent cross-scheme confusion.
* **Transfer Confirmation Semantics (`acknowledged` parameter)**:
  * When `TRANSFER_SUCCESS` arrives with `acknowledged = 0`: Remitter account debited, but beneficiary bank credit has **not** been confirmed yet. The engine keeps the intent in non-completed status (`SUBMITTED`/`UNKNOWN`) and allocation in `PROCESSING`. It does **not** mark the transfer as `COMPLETED` or `PAID`.
  * When `TRANSFER_ACKNOWLEDGED` arrives (or `TRANSFER_SUCCESS` with `acknowledged = 1`, or `getTransferStatus` confirms `acknowledged = 1`): Beneficiary bank confirmed deposit; intent is marked `COMPLETED` and allocation `PAID` exactly once.
  * Duplicate webhook deliveries are handled idempotently without duplicate crediting.
  * When `TRANSFER_REVERSED` arrives: Beneficiary bank reversed the transfer; intent is marked `FAILED`, allocation `REVERSED`, and an append-only `PayoutAdjustment` (reversal obligation) is recorded under lock.
* **Simulation and Disabled Mode Safeguards**:
  * **Missing Credentials**: In `SANDBOX` or `PRODUCTION` mode, missing `CASHFREE_APP_ID` or `CASHFREE_SECRET_KEY` immediately throws `ServiceUnavailableException`. Unconfigured environments cannot fall back to simulated successful payouts.
  * **Simulation Identity**: In `MOCK` mode, transfer responses explicitly tag `_simulated: true`, `isSimulated: true`, and `provider: 'MOCK_PROVIDER'`. This flag persists on `PayoutTransferIntent` and `PayoutTransferAttempt`, serializes in APIs, and renders on UI portals with amber warning badges and banners (`⚠️ Simulated Payout — No real money was disbursed through the banking network`).
  * **Disabled Mode Guarding**: When `CASHFREE_ENV=DISABLED` or `CASHFREE_PAYOUTS_ENABLED=false`, `transfer-execution.service.ts` checks `guardPayoutsEnabled()` before any reservation write occurs. However, `getTransferStatus()` and settlement reconciliation endpoints permit read-only status checks so operators can safely audit and reconcile existing uncertain transfers.

---

## Operator Runbook

### Admin Authorization Workflow
1. Navigate to `/admin/settlements`.
2. Inspect settlement breakdown, allocations, and eligibility hold reasons.
3. Review revisions in drawer.
4. Click **Authorize Settlement**. This moves status from `READY` to `APPROVED`.
5. Click **Disburse Payouts**.

### Handling Stale Approvals
If a refund arrives after admin authorization, the engine automatically:
1. Creates a new `SettlementRevision`.
2. Downgrades status back to `READY` (or `HELD` if review is required).
3. Writes a `SETTLEMENT_APPROVAL_INVALIDATED` audit event.
4. Rejects any in-flight execution calls referencing the previous revision (HTTP 409 Conflict).

### Recovering from Network Timeouts
When a transfer returns `UNKNOWN` due to gateway timeout:
1. Transfer attempt is preserved in `UNKNOWN` state with raw gateway error preserved in audit records.
2. Direct re-execution attempts are rejected with `409 Conflict` ("Cannot execute transfers while uncertain transfer attempts exist").
3. Admin triggers `POST /admin/settlements/:bookingId/reconcile` with `{ transferIntentId }`.
4. The provider queries `GET /payout/v1/getTransferStatus?transferId=...` (authorized even when new payouts are disabled).
5. If confirmed on gateway (`acknowledged = 1`), state advances to `SUCCESS`. If confirmed not initiated, it is safely marked `FAILED`, allowing authorized retry for that recipient only.

---

## Observed Resource Cleanup & Isolation Evidence

* **Run-Owned Test Isolation**: All integration and HTTP acceptance tests executed against a dedicated, run-owned database (`fairbnb_acceptance_db` on port 5433).
* **Deterministic Resource Teardown**:
  * Exact test database `fairbnb_acceptance_db` was dropped by exact name (no wildcards).
  * Owned server processes, open handles, and database pools were terminated cleanly without requiring Jest `--forceExit`.
* **Shared Database Verification**: Inspection of the shared development database (`fairbnb_db` on port 5433) post-run confirmed:
  * `BookingFinanceSnapshot`: 0 rows
  * `Settlement`: 0 rows
  * `PayoutTransferIntent`: 0 rows
  * `PayoutAdjustment`: 0 rows
  confirming zero fixture leakage during this task.
