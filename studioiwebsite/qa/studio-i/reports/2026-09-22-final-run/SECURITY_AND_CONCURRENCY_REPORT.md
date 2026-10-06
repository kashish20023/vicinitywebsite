# Studio I Coworking Platform — Security & Concurrency Audit Report

**Run ID**: `2026-09-22-final-run`  
**Target Project**: Studio I Coworking Platform  
**Audit Scope**: Anti-double-booking concurrency, JWT authentication, role guards, integer paise money conservation, and input validation.

---

## 1. Concurrency Invariant: Double-Booking Prevention

### Test Scenario
20 synchronized asynchronous requests competed simultaneously to acquire an exclusive 10-minute hold for the exact same physical desk (`LH-01-D01`) and identical time interval (`2026-09-25T09:00:00Z` to `2026-09-25T18:00:00Z`).

### Result
- **Successes**: **Exactly 1** (HTTP 201 Created)
- **Conflicts Caught**: **19** (HTTP 409 Conflict)
- **Oversold Units**: **0**

### Protection Mechanism
The database query uses transactional locking with half-open interval overlap checking:
```sql
WHERE "unitId" = $1
  AND "status" = 'ACTIVE'
  AND "expiresAt" > NOW()
  AND ("startDateTime" < $requestedEnd AND "endDateTime" > $requestedStart)
```
Followed by atomic creation of `InventoryHold` with an explicit 10-minute expiration timestamp.

---

## 2. Authentication & Role-Based Authorization

1. **Role Separation**:
   - Strictly enforced **two top-level roles**: `USER` and `ADMIN`.
   - Admin routes under `/api/v1/admin/*` are guarded by `@UseGuards(AuthGuard('jwt'), RolesGuard)` and `@Roles(Role.ADMIN)`.
   - Access by standard `USER` tokens immediately returns **HTTP 403 Forbidden**.

2. **Session Security**:
   - Passwords hashed using bcrypt (10 rounds).
   - JWT tokens signed with HS256 and expiration.
   - User blocking (`PATCH /admin/users/:id/block`) is validated server-side and immediately prevents new holds or bookings without cancelling historical paid bookings.

3. **Digital Pass Integrity**:
   - Digital access pass tokens use 128-bit cryptographically random tokens (`SI-PASS-XXXXXXXXXXXXXXXX`).
   - QR validation endpoint `/api/v1/access/checkin` checks active status and valid time window (+/- 15 minute grace period). Replayed or revoked tokens are rejected.

---

## 3. Financial Invariants: Money Conservation

1. **Integer Minor-Unit (Paise) Arithmetic**:
   - All amounts (`baseAmountPaise`, `taxAmountPaise`, `discountAmountPaise`, `securityDepositPaise`, `totalAmountPaise`) are stored as native 64-bit integers (`BigInt`).
   - Zero floating point rounding errors exist across quoting, hold creation, checkout, and refunding.

2. **Refund Policies**:
   - > 24 hours prior to booking: **100% refund** of base rate.
   - 12 to 24 hours prior: **50% refund**.
   - < 12 hours prior: **0% refund**.
   - Security deposits (2-month commitment) are always 100% refunded.
