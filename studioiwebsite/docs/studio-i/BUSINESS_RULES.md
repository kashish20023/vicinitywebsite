# Studio I — Core Business Rules & Financial Invariants (`BUSINESS_RULES.md`)

> **Governing Business Logic & Financial Formulas for Studio I Coworking Operations**

---

## 1. Currency, Precision & Timezone Standards

1. **Currency**: Indian Rupee (`INR` / `₹`).
2. **Precision**: All financial amounts stored as non-negative integer paise (`1 INR = 100 paise`).
   - Example: `₹1,499.00` is stored as `149900` paise.
   - Zero floating-point math permitted in quotes, ledger balances, refunds, or tax calculations.
3. **Timezone**: All physical operating hours, bookings, holidays, and calendar computations use `Asia/Kolkata` (`UTC+05:30`). Database timestamps stored in standard UTC `TIMESTAMPTZ`.

---

## 2. Coworking Inventory & Commitment Rules

### 2.1 Inventory Units vs. Sellable Plans
- Physical inventory is distinct from pricing plans:
  - **Hot Desk**: Sellable by Day Pass or Monthly Flexi.
  - **Dedicated Desk**: Sellable by Month.
  - **Private Cabin**: Sellable by Month or Annual Contract.
  - **Meeting Room / Conference Room**: Sellable by Hour or Half-Day.
  - **Event Space**: Sellable by Half-Day or Full Day.

### 2.2 Two-Month Minimum Commitment (Dedicated Desks & Private Cabins)
- For `MONTHLY` plans on `DEDICATED_DESK` and `PRIVATE_CABIN`:
  - A minimum commitment of **two full calendar months** is required.
  - The unit is reserved for the entire 2-month committed window in the availability engine.
  - Billing is split into calendar-month billing periods with payment due on the 1st of each month.
  - Hot desks and meeting rooms have no minimum commitment (available hourly or daily).

### 2.3 Parent/Child Cabin & Desk Exclusivity
- When a Private Cabin is booked as a whole unit, all desks inside that cabin are locked automatically for that interval.
- If individual desks inside a cabin are sold, the whole cabin cannot be booked as an exclusive unit for any overlapping time.

---

## 3. Inventory Holds & Anti-Hoarding Rules

1. **Hold Duration (TTL)**: 10 minutes from creation (`expiresAt = createdAt + 10 minutes`).
2. **Anti-Hoarding Cap**: A single user may hold a maximum of **2 active units** concurrently. Additional hold attempts are rejected with HTTP 429 / 400 until existing holds convert to booking or expire.
3. **Hold Expiry**: Expired holds are automatically bypassed in availability checks without requiring blocking background cleanups. When confirmed, a hold converts to `CONVERTED` and becomes a permanent `BookingItem`.

---

## 4. Quote & Pricing Engine Precedence

 Authoritative price is calculated server-side in the following sequential order:

1. **Base Rate Calculation**:
   - `baseAmount = ratePerUnit * duration` (in paise)
2. **Add-Ons Selection**:
   - High-speed dedicated IP, locker rental, extra monitor, parking passes added to `addOnsTotal`.
3. **Promotional Coupon Discount**:
   - Applied against `(baseAmount + addOnsTotal)`.
   - Cannot exceed `maxDiscountPaise`.
   - Disallowed if subtotal is below `minOrderPaise`.
   - Non-stackable: Maximum one coupon per checkout.
4. **Tax Calculation (GST)**:
   - Configurable rate (e.g. 18% GST: 9% CGST + 9% SGST).
   - Computed as: `taxPaise = Math.round((subtotalAfterDiscount * taxPercent) / 100)`.
5. **Security Deposit (if applicable for monthly commitments)**:
   - Added as a separate non-taxable refundable deposit item.
6. **Total Payable Amount**:
   - `totalPayable = subtotalAfterDiscount + taxPaise + securityDepositPaise`.

---

## 5. Cancellation & Refund Policy

### 5.1 Hourly & Daily Desks / Meeting Rooms
| Cancellation Timing | Refund Amount | Policy Rule |
| :--- | :--- | :--- |
| **> 24 hours before start** | **100%** of booking charge | Full refund minus gateway processing fee |
| **Between 12 and 24 hours** | **50%** of booking charge | Partial refund |
| **< 12 hours or No-Show** | **0%** | Non-refundable |

### 5.2 Monthly Contracts (Dedicated Desks & Cabins)
- Requires a written **30-day notice**.
- Security deposit is refunded 100% within 7 business days following exit inspection and keycard return.
- Coupons consumed during the original booking are not refunded as cash.

---

## 6. Access Control & Digital Passes

1. A digital pass QR token is valid starting **15 minutes before** the booked schedule and expires **15 minutes after** the scheduled end.
2. QR check-in must be scanned by an authorized reception / staff scanner or validated against campus geofence.
3. Daily check-in/out logs an `AccessSession` and does not release or cancel ongoing monthly commitments.
