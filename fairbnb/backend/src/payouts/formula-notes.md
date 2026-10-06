# FairBnB Payout Split Engine — Formulas & Assumptions Note (Chunk 1)

## 1. Core Mathematical Model (Draft v1 Policy)

All internal monetary amounts are represented as `bigint` paise (1 INR = 100 paise).
Percentages are represented as integer basis points (bps) where `10000 bps = 100.00%`.
Half-up percentage rounding is calculated as:
$$\text{roundedPaise} = \left\lfloor \frac{\text{amountPaise} \times \text{percentageBps} + 5000\text{n}}{10000\text{n}} \right\rfloor$$

### Invariant:
$$\text{hostAllocation} + \text{coHostAllocation} + \text{platformAllocation} + \text{taxAllocation} = \text{guestTotal} - \sum \text{completedRefundAmounts}$$

---

## 2. Component Calculations

1. **Quoted Guest Total Validation**:
   $$\text{guestTotal} = \text{base} + \text{cleaning} + \text{serviceFee} + \text{tax} - \text{discount}$$

2. **Discount Funding**:
   - `PLATFORM`: Platform absorbs discount from its service fee:
     $$\text{platformDiscount} = \text{discount}, \quad \text{hostDiscount} = 0$$
     Requires: $\text{discount} \le \text{serviceFee}$ (otherwise `HELD` with `FUNDING_GAP`).
   - `HOST`: Host absorbs discount from base accommodation:
     $$\text{hostDiscount} = \text{discount}, \quad \text{platformDiscount} = 0$$
     Requires: $\text{discount} \le \text{base}$ (otherwise `HELD` with `FUNDING_GAP`).
   - `NONE`: Only valid when $\text{discount} = 0$.
   - `UNRESOLVED`: Any discount $> 0$ with `UNRESOLVED` causes `HELD`.

3. **Net Component Values**:
   $$\text{netAccommodation} = \text{base} - \text{hostDiscount} - \text{accommodationRefunds}$$
   $$\text{netCleaning} = \text{cleaning} - \text{cleaningRefunds}$$
   $$\text{netPlatform} = \text{serviceFee} - \text{platformDiscount} - \text{platformRefunds}$$
   $$\text{netTax} = \text{tax} - \text{taxRefunds}$$

4. **Host Pool**:
   $$\text{hostPool} = \text{netAccommodation} + \text{netCleaning}$$

5. **Co-Host Formulas (Draft v1 Policy)**:
   - `NONE`: $0$
   - `PERCENTAGE`: $\text{applyPercentageHalfUp}(\text{netAccommodation}, \text{percentageBps})$
   - `FIXED_AMOUNT`: $\text{fixedAmountPaise}$ (per booking)
   - `CLEANING_FEE`: $\text{netCleaning}$
   - `CLEANING_FEE_PLUS_PERCENTAGE`: $\text{netCleaning} + \text{applyPercentageHalfUp}(\text{netAccommodation}, \text{percentageBps})$

6. **Host Allocation**:
   $$\text{hostAllocation} = \text{hostPool} - \text{coHostAllocation}$$
   Constraint: If $\text{coHostAllocation} > \text{hostPool}$, the calculator returns `HELD` with `COHOST_EXCEEDS_POOL`.

---

## 3. Boundary & Error Handling
- No ordinary floating-point math; zero IEEE-754 precision drift.
- Does not clamp negative components to zero.
- Does not move rounding differences or remainders into platform or tax.
- Strict rejection of missing or mismatched refund allocations.
- Order-independent processing of completed refunds.
- Inputs are treated as strictly immutable (read-only).
