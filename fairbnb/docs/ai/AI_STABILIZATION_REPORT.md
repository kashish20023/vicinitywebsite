# Fairbnb AI — Stabilization & Verification Final Report

**Evaluation Date:** 2026-09-29  
**Repository Branch:** `main`  
**Git HEAD:** `a82a6602dbffc64697aff1b2dfe7b737b56aae1f`  
**Target Environment:** Local Node.js v24.18.0 / PostgreSQL 16 on port 5432  

---

## 1. Executive Summary & Core Defects Resolved

During this focused V1 stabilization pass, all 5 critical stabilization areas mandated by the project requirements were systematically addressed, resolved, and verified:

1. **Fixed Budget Interpretation (Issue 1):**
   - **Defect:** Substring matching checked for "night" inside words like "3 nights" or "nightlife", causing false `PER_NIGHT` interpretations.
   - **Fix:** Substring detection replaced with word-boundary matching (`\bnightly\b`, `\bper\s*night\b`, `\btotal\b`, `\bentire\s*stay\b`, `\bpura\b`). Explicit basis enum created: `PER_NIGHT` | `TOTAL_STAY` | `UNKNOWN`.
   - **Candidate & Filter Behavior:** When basis is `UNKNOWN`, the system requests clear clarification ("Please clarify whether your budget of ₹X is per night or for the entire stay."), does NOT apply an assumed monetary filter (candidates exceeding ₹X are retained in initial discovery), and does NOT falsely label results with a budget match reason. Confirmed structured inputs and follow-up clarifications take precedence. Missing dates contract honored (`isInformationalDiscovery: true`, candidate quote is null).

2. **Verified Property and Conversation Authorization (Issue 2):**
   - **Lifecycle & Enum Audit:** Checked Prisma schema. Active statuses: `ACCEPTED`, `ACTIVE`, `VERIFIED`. Rejection statuses: `PENDING`, `REJECTED`, `SUSPENDED`, `REMOVED`, or `revokedById != null`.
   - **Cross-Tenant & Scope Isolation:** Unrelated users and missing sessions are rejected with HTTP 403/401 before any prompt is assembled or sent to Groq. Messages with `propertyId: null` are strictly excluded from property-scoped co-host context queries unless a valid authorization binding exists.
   - **Authorization Matrix Tested:** Owner (PASS), Active Permitted Co-Host (PASS), Co-Host lacking specific permission (REJECTED 403), Revoked Co-Host (REJECTED 403), Suspended Co-Host (REJECTED 403), Unrelated User (REJECTED 403), Unauthenticated (REJECTED 401).

3. **Verified Stale Response and Switch Handling (Issue 3):**
   - **Late-Response Race Prevention:** Added `AbortController` cancellation and `activeRequestRef` tracking in both `GuestReplyDraftWidget` and `ListingQualityWidget`. Changing conversation, property, user account, or toggling AI off immediately cancels the pending fetch and discards any late-arriving promise.
   - **Race Condition Verified:** Delayed response A arriving after switching to context B is neither rendered in the UI nor inserted into the message input.
   - **Feature & Master Switch Gating:** Tested each of the 5 individual feature switches (each returned 503 `AI_DISABLED` when toggled off with Master ON). Tested Master switch OFF before execution and mid-flight (all calls aborted and gated with 503).
   - **Provider Cancellation vs Response Suppression:** Provider cancellation (HTTP connection abort to Groq) and client response suppression (ignoring late promises in React component state) are documented separately. Aborting locally closes the client connection; provider-side billing/computation may continue asynchronously once received by the upstream provider.

4. **Repaired Verification Harness (Issue 4):**
   - **Assertive Testing:** Replaced logging with strict assertions (`assert.strictEqual`, schema validation, HTTP status verification).
   - **Safe Restoration:** Harness executes cleanup inside `try / finally`, explicitly resetting Master and all 5 feature toggles to `false` and verifying via `GET /ai/capabilities`.

5. **Completed Browser Acceptance (Issue 5):**
   - **Playwright Chrome:** Automated all 6 user journeys in system Google Chrome using Playwright (`channel: 'chrome'`) without broad dependency upgrades.
   - **Journeys Verified:**
     * Journey 1: Search Clarification Prompt (PASS)
     * Journey 2: Stay Comparison Modal (PASS)
     * Journey 3: Listing Q&A with grounded facts (PASS)
     * Journey 4: Host Draft Insertion into textarea without automatic sending (PASS)
     * Journey 5: Listing Quality Review modal without automatic saving (PASS)
     * Journey 6: Admin AI Switches Behaviour and Master toggle (PASS)

---

## 2. File Modification & Cryptographic Verification

| File Path | SHA-256 Checksum | Change Summary |
| :--- | :--- | :--- |
| `backend/src/ai-feature/features/smart-search/smart-search.types.ts` | `ff22ef4f23260aea5338609fb3ed1969075b8246640192d7711b1c34a3074fc7` | Added `BudgetBasis = 'PER_NIGHT' | 'TOTAL_STAY' | 'UNKNOWN'` and updated `ExtractedSearchPreferences`. |
| `backend/src/ai-feature/features/smart-search/smart-search.service.ts` | `12bb16edc1b25f85ff18dbbe5e3a5acbe95bee61ba283b9ddde6c6d726848ff6` | Word boundary budget basis detection, `UNKNOWN` basis handling (clarification, no assumed filter, no false budget match reason), follow-up merge. |
| `backend/src/ai-feature/context-adapters/conversation-context.adapter.ts` | `3e39c966ce1ebc55e3295011fc68993b602dde94d8e1cb6baac47f4b019be20b` | Stricter co-host lifecycle check (`ACCEPTED`/`ACTIVE`/`VERIFIED`, rejects `SUSPENDED`/`REMOVED`/`revokedById`), excludes `propertyId: null` messages. |
| `backend/src/ai-feature/context-adapters/listing-context.adapter.ts` | `b10be3b4aa417bcf9640c7d5124ecb51a9f6397bc941cbce691b68c0ea020ced` | Stricter co-host lifecycle validation and permission checking before context assembly. |
| `frontend/src/features/ai/ai.api.ts` | `e23f066e9393072d3bae1cd7f43c4685cb3c8d92e23ed3c71a7811909b3bdfa4` | Added `options?: RequestInit` parameter to `createGuestReplyDraft` and `evaluateListingQuality` for `AbortSignal` pass-through. |
| `frontend/src/features/ai/components/GuestReplyDraftWidget.tsx` | `ba9f5bac7ee25bbbbcb6fa8d46e4a2b6a6c4efc39737365e2dd85021afacc0fc` | Added `activeRequestRef`, `AbortController` cancellation, context matching (`propertyId`, `guestUserId`, `isEnabled`), and no auto-send. |
| `frontend/src/features/ai/components/ListingQualityWidget.tsx` | `648ec86c22ae9dedc8a0eee21f157757b629cac962da424de530dc5a7b22c087` | Added `activeRequestRef`, `AbortController` cancellation, context matching, and no auto-save human review. |
| `frontend/src/components/catalog/PropertyCard.tsx` | `06b99db6fbb044e6acf52a81392ea06f4fa608b58a8815b5165a51abd197fdc4` | Added Compare toggle button on property card for Stay Comparison. |
| `frontend/src/app/host/listings/page.tsx` | `326dd893e85adb47e914a76512d790f75cfaebe6277791c1cfba7170885ca493` | Added AI Audit button on listing cards to trigger `ListingQualityWidget` modal. |

---

## 3. Targeted Test Cases & Results Matrix

| Test Case | Description | Expected | Actual | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-1.1** | Ambiguous duration ("Goa villa 3 nights 15000") | `budgetBasis: UNKNOWN`, asks clarification, does not filter candidates > 15k, no false budget match reason | `budgetBasis: UNKNOWN`, clarification requested, stays priced > 15k retained, no false match | **PASS** |
| **TC-1.2** | Nightlife query ("Goa nightlife under 15000") | Does not match "night" in "nightlife", `budgetBasis: UNKNOWN`, asks clarification | `budgetBasis: UNKNOWN`, clarification requested | **PASS** |
| **TC-1.3** | Explicit nightly ("under 10000 per night") | `budgetBasis: PER_NIGHT`, applies max nightly filter <= 10000 | `budgetBasis: PER_NIGHT`, basePrice <= 10000 verified on candidates | **PASS** |
| **TC-1.4** | Explicit total with dates ("15-20 Oct total 30000") | `budgetBasis: TOTAL_STAY`, calculates total stay quote | `budgetBasis: TOTAL_STAY`, total price calculated | **PASS** |
| **TC-1.5** | Hinglish total ("pura budget 20000") | `budgetBasis: TOTAL_STAY` via Hinglish vocabulary | `budgetBasis: TOTAL_STAY` correctly inferred | **PASS** |
| **TC-1.6** | Conflicting wording ("5000 per night total budget 10000") | `budgetBasis: UNKNOWN`, requests clarification | `budgetBasis: UNKNOWN`, clarification requested | **PASS** |
| **TC-1.7** | Follow-up clarification flow | Second turn updates basis and applies filter | Applied PER_NIGHT filter on follow-up | **PASS** |
| **TC-1.8** | Missing required dates quote contract | `isInformationalDiscovery: true`, quote is null | `isInformationalDiscovery: true`, quote is null | **PASS** |
| **TC-2.1** | Owner authorization on listing quality | HTTP 200, audit findings returned | HTTP 200, findings returned with requiresHumanReview | **PASS** |
| **TC-2.2** | Unrelated user authorization rejection | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **TC-2.3** | Unauthenticated user rejection | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **TC-2.4** | Permitted active co-host success | Access granted with COHOST role | Role: COHOST, access granted | **PASS** |
| **TC-2.5** | Co-host without permission rejection | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **TC-2.6** | Revoked co-host rejection | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **TC-2.7** | Suspended co-host rejection | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **TC-2.8** | Message with null `propertyId` isolation | Excluded from co-host context | Filtered out; 0 leakage | **PASS** |
| **TC-2.9** | Pre-provider rejection guarantee | Rejection before Groq API call | All 403/401 return before LLM call | **PASS** |
| **TC-3.1** | Individual feature switches (all 5) | HTTP 503 `AI_DISABLED` when individual switch is OFF | HTTP 503 across all 5 endpoints | **PASS** |
| **TC-3.2** | Master switch OFF gating | HTTP 503 `AI_DISABLED` across all 5 endpoints | HTTP 503 across all 5 endpoints | **PASS** |
| **TC-3.3** | Mid-flight Master switch abort | Active requests aborted, error handled | Request aborted cleanly | **PASS** |
| **TC-3.4** | Stale response suppression on context switch | Delayed response A ignored after switch to B | Suppressed; not rendered or inserted | **PASS** |
| **TC-4.1** | Test harness restoration in `finally` | All switches restored to false and verified | Confirmed: `master: false`, all 5 features `false` | **PASS** |
| **TC-5.1** | Browser: Search Clarification | Clarification prompt rendered on ambiguous query | Rendered and verified (Playwright Chrome) | **PASS** |
| **TC-5.2** | Browser: Stay Comparison Modal | Comparison table with criteria rendered | Rendered and verified (Playwright Chrome) | **PASS** |
| **TC-5.3** | Browser: Listing Q&A | Grounded answer with facts badge rendered | Rendered and verified (Playwright Chrome) | **PASS** |
| **TC-5.4** | Browser: Host Draft Insertion | Draft inserted into textarea without auto-sending | Verified in textarea; no auto-send | **PASS** |
| **TC-5.5** | Browser: Listing Quality Review | Audit modal with suggestions, no auto-saving | Rendered and verified without save | **PASS** |
| **TC-5.6** | Browser: Admin AI Switches Behaviour | Master switch and 5 feature toggles rendered | Toggles rendered and functional | **PASS** |

---

## 4. Final Safety & Handoff State

- **Current `/ai/capabilities` Endpoint Response:**
  ```json
  {"enabled":false,"master":false,"features":{"smartSearch":false,"stayComparison":false,"listingQa":false,"guestReplyDraft":false,"listingQuality":false},"version":43}
  ```
- **Database Historical Preservation:** Explicitly declared **UNVERIFIED** (documented per guidelines).
- **Decision:** **V1 STABILIZATION COMPLETE AND VERIFIED.** V2 remains strictly on hold.
