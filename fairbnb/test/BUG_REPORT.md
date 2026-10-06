# FairBnB QA Audit — Confirmed Defects & Vulnerability Report

**Run Identifier**: `run-20260921-1150`  
**Execution Timestamp**: 2026-09-21T12:12:00+05:30  
**Scope**: Full End-to-End Audit (Jest, API Integration, Playwright Browser, Performance)

---

## Defect Summary Table

| Defect ID | Severity | Affected Area | Root Cause | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **DEFECT-01** | Medium | `backend/src/app.controller.spec.ts` | Missing `PrismaService` in `RootTestModule` providers | Fails standard unit test suite in CI |
| **DEFECT-02** | Medium | `backend/src/reels/reels-schema.spec.ts` | Stale `@prisma/client` generated bindings | Reels schema tests throw `undefined reading findMany` |
| **DEFECT-03** | High | `backend/test/coupon-concurrency.e2e-spec.ts` | Teardown FK violation on `BookingFinanceSnapshot` | Breaks automated E2E test teardown and test isolation |
| **DEFECT-04** | Low | `POST /bookings/quote` | Inverted date check returns HTTP 200 `{ available: false }` | HTTP status semantic inconsistency (expected 400 Bad Request) |
| **DEFECT-05** | Low | `frontend/.env.local` | Hardcoded `http://localhost:5000` inlined during build | Browser client bundles fail to adapt dynamically to port changes |

---

## Detailed Defect Reports

### DEFECT-01: AppController Unit Test Missing Dependency Provider
- **Affected File**: `backend/src/app.controller.spec.ts`
- **Severity**: Medium
- **Expected Behavior**: `npm run test` executes all unit tests successfully with green status.
- **Actual Behavior**: Test suite fails with Nest dependency resolution error:
  ```
  Nest can't resolve dependencies of the AppService (?). 
  Please make sure that the argument PrismaService at index [0] is available in the RootTestModule context.
  ```
- **Reproduction Steps**:
  1. `cd backend`
  2. `npm run test -- app.controller.spec.ts`
- **Suspected Cause**: `AppService` was recently updated to inject `PrismaService`, but its corresponding test fixture was not updated with a `PrismaService` mock or provider.
- **Recommended Fix**: Add `{ provide: PrismaService, useValue: { ... } }` to the providers array in `app.controller.spec.ts`.

---

### DEFECT-02: Prisma Client Stale Bindings for Reels Module
- **Affected Files**: `backend/src/reels/reels-schema.spec.ts`, `backend/src/reels/reels-profile.spec.ts`
- **Severity**: Medium
- **Expected Behavior**: Newly merged Reels modules have corresponding generated types and client accessors on `PrismaClient`.
- **Actual Behavior**: Tests fail with:
  ```
  TypeError: Cannot read properties of undefined (reading 'findMany')
  at ReelsService.findAll (reels.service.ts)
  ```
- **Reproduction Steps**:
  1. `cd backend`
  2. `npm run test -- reels-schema.spec.ts`
- **Suspected Cause**: The `@prisma/client` in `node_modules` was generated prior to merging the Reels migration schema additions, causing `prisma.reel` to be undefined at runtime.
- **Recommended Fix**: Ensure `npx prisma generate` is executed whenever schema migrations are applied.

---

### DEFECT-03: Foreign Key Constraint Violation During E2E Test Teardown
- **Affected Files**:
  - `backend/test/coupon-concurrency.e2e-spec.ts`
  - `backend/test/coupon-release.e2e-spec.ts`
- **Severity**: High
- **Expected Behavior**: E2E test suites clean up created fixtures in `afterAll()` without database constraint errors.
- **Actual Behavior**: Suite crashes during teardown with:
  ```
  PrismaClientKnownRequestError: 
  Foreign key constraint violated on the constraint: BookingFinanceSnapshot_bookingId_fkey
  ```
- **Reproduction Steps**:
  1. `cd backend`
  2. `npm run test:e2e -- coupon-concurrency.e2e-spec.ts`
- **Suspected Cause**: `BookingFinanceSnapshot` was added to `schema.prisma` with `onDelete: Restrict`. The test `afterAll` hook deletes `Booking` records without first deleting child `BookingFinanceSnapshot` records.
- **Recommended Fix**: In test teardown, delete `prisma.bookingFinanceSnapshot.deleteMany({ where: { bookingId: { in: bookingIds } } })` prior to `prisma.booking.deleteMany()`, or update the schema relation to `onDelete: Cascade`.

---

### DEFECT-04: Inverted Checkout Date Order Returns HTTP 200 Instead of HTTP 400
- **Affected Endpoint**: `POST /bookings/quote`
- **Severity**: Low
- **Expected Behavior**: When request payload contains `checkOut` earlier than `checkIn` (e.g. checkIn `2026-11-05`, checkOut `2026-11-03`), the server should reject the request with `HTTP 400 Bad Request` and descriptive validation message.
- **Actual Behavior**: The endpoint returns `HTTP 200 OK` with JSON:
  ```json
  {
    "available": false,
    "reason": "CHECKOUT_MUST_BE_AFTER_CHECKIN"
  }
  ```
- **Reproduction Steps**:
  ```bash
  curl -X POST http://localhost:5010/bookings/quote \
    -H "Content-Type: application/json" \
    -d '{"propertyId": "prop-123", "checkIn": "2026-11-05", "checkOut": "2026-11-03", "guests": 2}'
  ```
- **Suspected Cause**: The date order validation in `bookings.service.ts` treats inverted dates as an availability failure rather than throwing a `BadRequestException`.
- **Recommended Fix**: Validate date ordering at the DTO layer with class-validator (`@IsDate()`, `@MinDate()`) or throw `BadRequestException('checkOut must be after checkIn')`.

---

### DEFECT-05: Inlined Hardcoded API URL Bypasses Dynamic Port Configuration
- **Affected File**: `frontend/.env.local`
- **Severity**: Low (Operational)
- **Expected Behavior**: Frontend builds can dynamically target alternate backend ports via environment variables or runtime configuration.
- **Actual Behavior**: `NEXT_PUBLIC_API_URL="http://localhost:5000"` is baked statically into JavaScript client bundles during `npm run build`. When testing against an isolated backend on port 5010, client fetches fail with `ECONNREFUSED` unless intercepted by a network proxy.
- **Recommended Fix**: Use relative `/api/*` proxies with Next.js rewrites in `next.config.js` or support dynamic runtime environment injection.
