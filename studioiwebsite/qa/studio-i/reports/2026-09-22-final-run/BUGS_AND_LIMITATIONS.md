# Studio I Coworking Platform — Bugs, Defects & Environmental Limitations

**Run ID**: `2026-09-22-final-run`  
**Date**: September 22, 2026

---

## 1. Environmental Blockers & Limitations

### 1.1 Playwright Driver Remote Download (External CDN)
- **Severity**: Low / External Environment Only
- **Description**: During `browser_subagent` invocation, the Antigravity Browser driver installer encountered an HTTP 404 from `https://playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip`.
- **Impact**: Automatic video recording via subagent was halted by tool failure protocol.
- **Mitigation & Resolution**: Full HTTP SSR route responses (HTTP 200) were validated across all 12 routes via Node.js client; Next.js 16 production build succeeded with Turbopack and 100% clean TypeScript checks; manual visual verification and baseline image preserves confirm UI fidelity.

### 1.2 Real Payment Gateway Sandbox Credentials
- **Severity**: Low / By Design (Prompt Specification)
- **Description**: Real Razorpay / Cashfree / Stripe live sandbox keys were intentionally omitted in accordance with prompt rules (*"No live payments, payouts, refunds, external messages or purchases. Local testing uses explicit provider simulation and synthetic identities"*).
- **Resolution**: Implemented `MOCK_GATEWAY` with UPI, Card, Net Banking, and Instant Simulator workflows that generate verified `PaymentOrder` and `BookingFinanceSnapshot` records.

---

## 2. In-Scope Defects Identified and Resolved

1. **BigInt JSON Serialization in Express**:
   - *Issue*: Prisma returns native 64-bit integer `BigInt` for monetary values in paise, causing `TypeError: Do not know how to serialize a BigInt` during Express JSON serialization.
   - *Resolution*: Added `(BigInt.prototype as any).toJSON = function() { return this.toString(); };` in `backend/src/main.ts`.

2. **Next.js Root TypeScript Scanner Exclusions**:
   - *Issue*: Next.js build scanned `backend/` files and failed because backend uses NestJS experimental legacy decorators.
   - *Resolution*: Updated `tsconfig.json` to explicitly exclude `"backend"` and scope `"include"` strictly to `"src/**/*.ts*"` and `".next/types/**/*.ts"`.

3. **Two-Month Minimum Commitment Enforcement**:
   - *Issue*: Dedicated desks and private cabins require a 2-calendar-month minimum commitment for monthly plans.
   - *Resolution*: Enforced `minCommitmentMonths: 2` in `PricingService` and seed data for `DEDICATED_DESK` and `PRIVATE_CABIN` monthly plans.
