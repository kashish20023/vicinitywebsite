# Known Issues & Technical Debt Tracker

This document maintains a running list of identified issues, deferred technical debt, and follow-up work across FairBnB systems and modules. Each ticket details the location, problem statement, recommended fix direction, and current status.

---

### [TICKET-001] Host-cancellation refund doesn't call actual payment provider

> **Module:** `Booking Cancellation Lifecycle (Phase 1)`  
> **Severity:** High — money-correctness bug  
> **Status:** Open — not yet started  
> **Location:** `finalizeCancellationRefund()`, HOST branch, [`backend/src/bookings/bookings.service.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/bookings/bookings.service.ts)

#### Problem
The refund row is marked `status: 'COMPLETED'` directly without ever calling `paymentProvider.processRefund()` — unlike the GUEST cancellation branch, which initiates provider-side refund execution. The database claims the refund is completed, but the external payment provider (Stripe/Razorpay) was never actually notified, so no real money movement may have occurred for the guest.

#### Fix Direction
Mirror the GUEST branch's execution flow:
1. Call `paymentProvider.processRefund()` first with the computed refund amount and original transaction reference.
2. Create the `Refund` record using the provider's returned `providerRefundId`.
3. Only mark `status: 'COMPLETED'` after receiving a successful response from the payment provider.

#### Found During
Phase 1 cancellation-lifecycle refactor (coupon-release + refund casing work). Explicitly identified and deferred as out-of-scope for that specific refactoring phase.

---

### [TICKET-002] Admin cancellation never creates a Refund row

> **Module:** `Booking Cancellation Lifecycle (Phase 1)`  
> **Severity:** Medium — needs investigation before severity is confirmed  
> **Status:** Open — needs investigation, not yet started  
> **Location:** `finalizeCancellationRefund()`, ADMIN branch, [`backend/src/bookings/bookings.service.ts`](file:///c:/Users/shubham/fairbnb--new/backend/src/bookings/bookings.service.ts)

#### Problem
The ADMIN branch in `finalizeCancellationRefund()` only sets `booking.refundStatus = 'PENDING'`; it never invokes `tx.refund.create()`. If an administrator later attempts to review or act on this cancellation via the `processRefund(refundId)` endpoint, there is no corresponding `Refund` record in the database to look up or process.

#### Needs Verification First
Check whether a separate "create refund request" admin endpoint exists that is designed to be called after cancellation to generate the `Refund` row. If no such endpoint exists, this cancellation path is a dead end — `booking.refundStatus` remains permanently `PENDING` with no actionable `Refund` entity for admins to process or fail.

#### Found During
Phase 1 cancellation-lifecycle refactor (coupon-release + refund casing work), same task as Ticket 1.

---

### [TICKET-003] No frontend UI for Host and Admin booking cancellation

> **Module:** `Booking Cancellation Lifecycle (Phase 1)`  
> **Severity:** Medium — feature gap, not a bug (backend fully functional and tested)  
> **Status:** Open — not started, deferred by product decision  
> **Location:**  
> - **Host:** backend endpoint `POST /bookings/:id/host-cancel` (`hostCancelBooking`) exists and is e2e-tested, but [`frontend/src/app/host/bookings/page.tsx`](file:///c:/Users/shubham/fairbnb--new/frontend/src/app/host/bookings/page.tsx) has no cancel button/action for `CONFIRMED` bookings — only a static "Confirmed Booking" label.  
> - **Admin:** backend endpoint `PATCH /admin/bookings/:id/cancel` (`cancelBooking`) exists and is e2e-tested, but [`frontend/src/app/admin/bookings/page.tsx`](file:///c:/Users/shubham/fairbnb--new/frontend/src/app/admin/bookings/page.tsx) is currently a static template with mock placeholder rows, not wired to live data or any actions at all.  

#### Problem
Host and admin cancellation logic (including the coupon-release and refund-casing work from Phase 1) is only reachable via direct API calls or automated tests — there's no way for an actual host or admin to trigger a cancellation through the UI.

#### Fix Direction
- **Host:** Add a "Cancel booking" action on `CONFIRMED` bookings in the host bookings table, with a reason input, calling `POST /bookings/:id/host-cancel`.
- **Admin:** The admin bookings page needs to be wired to live data first (it's currently a mock/placeholder page) before a cancel action makes sense there — this may be a larger task than just adding a button.

#### Found During
Manual frontend testing pass after Phase 1 backend completion.

