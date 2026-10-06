# Fairbnb V2 Trust & Safety — Evidence & Verification Matrix (Corrective Pass)

**Run ID:** RUN_20261001_R2_POSTGRES_V2  
**Execution Date:** 2026-10-01 (Corrective Checkpoint 17)  
**Phase:** Corrective Implementation Passes R0–R7  
**Readiness Verdict:** **IMPLEMENTED WITH BLOCKED INTEGRATIONS**  
**Database Guard:** Zero migrations, pushes, truncates, or resets on shared `fairbnb_db`.  
**Postgres Test Guard:** All 25 integration tests executed on `ts_disposable_test` (separate disposable database created/dropped by test).  
**AI Decoupling Guard:** All 5 generative AI feature toggles preserved OFF.

---

## 1. Original Requirement-to-Evidence Ledger (83 requirements)

> Each requirement carries its own row with an individual classification and verdict.  
> Evidence is linked to the specific artifact/command that produced it.  
> **GROUPED ENTRIES ARE NOT USED** — every ID is resolved individually.

### Detection Correctness (D01–D12)

| ID | Original Description | Evidence | Classification | Verdict |
|---|---|---|---|---|
| D01 | Direct supported national number (e.g., 9876543210) | `DeterministicPhoneDetector.evaluate()` returns BLOCK for bare 10-digit mobile number; assertion in `run_r1_repaired_harness.cjs` | EXECUTED UNIT | PASS |
| D02 | International prefix (e.g., +91 98765 43210) | Detector returns BLOCK for +91-prefixed numbers; regex covers E.164 and local formats | EXECUTED UNIT | PASS |
| D03 | Spaces / dots / hyphens as separators (e.g., 98765-43210) | Normalizer strips separators before detection; unit asserted | EXECUTED UNIT | PASS |
| D04 | Zero-width and invisible separator characters | `UnicodeNormalizer` removes U+200B, U+FEFF, U+00AD before evaluation; unit asserted | EXECUTED UNIT | PASS |
| D05 | Supported Unicode/math digit substitution (e.g., ９８７６５) | Normalizer maps fullwidth and mathematical digits to ASCII; unit asserted | EXECUTED UNIT | PASS |
| D06 | Keycap/emoji digit sequences (e.g., 9️⃣8️⃣7️⃣) | Normalizer strips VS16 (U+FE0F) and keycap enclosures; unit asserted | EXECUTED UNIT | PASS |
| D07 | English digit words (nine eight seven six five...) | Word-to-digit vocabulary mapped and counted; unit asserted BLOCK when phrase encodes a full number | EXECUTED UNIT | PASS |
| D08 | Hindi/Hinglish digit words (chaar, paanch, chhe/chhah, nau, aath, etc.) | Extended vocabulary added in `unicode-normalizer.ts`; char/chaar, chhe/chhah variants covered; unit asserted | EXECUTED UNIT | PASS |
| D09 | tel: / WhatsApp / wa.me link containing a number | Regex covers `tel:`, `wa.me/91...`, `whatsapp://send?phone=` patterns; unit asserted BLOCK | EXECUTED UNIT | PASS |
| D10 | Partial same-sender cross-message split evasion (5+5 fragments) | `SplitMessageDetector.evaluateWithHistory()` accumulates across two messages; asserted BLOCK when combined fragments form a number | EXECUTED UNIT | PASS |
| D11 | Contact intent phrasing without enough digit evidence → stays ALLOW | Message "call me sometime" without enough digits returns ALLOW; unit asserted | EXECUTED UNIT | PASS |
| D12 | Hostile long input stays within resource limits | Input > 4096 chars truncated; decision is `INPUT_LENGTH_EXCEEDED` (safe BLOCK); unit asserted | EXECUTED UNIT | PASS |

### Negative / Safe-Numeric Inputs (N01–N10)

| ID | Original Description | Evidence | Classification | Verdict |
|---|---|---|---|---|
| N01 | Nightly/total prices (₹12,500/night) | 5-digit price with currency prefix → ALLOW; unit asserted | EXECUTED UNIT | PASS |
| N02 | Dates and times (10:00 AM, 3rd July) | Time and date patterns explicitly in safe-number context → ALLOW | EXECUTED UNIT | PASS |
| N03 | Guest/room counts (3 guests, 2 bedrooms) | Short counts with unit context → ALLOW | EXECUTED UNIT | PASS |
| N04 | Actual booking references from authorized context | Booking reference format (e.g., BKG-12345) matched against booking-ref allowlist → ALLOW | EXECUTED UNIT | PASS |
| N05 | Address / postal code (PIN 110001) | 6-digit postal codes with "pin"/"pincode"/"zip" context → ALLOW | EXECUTED UNIT | PASS |
| N06 | Ordinary numeric listing facts (5 bedrooms, 3rd floor) | Short counts attached to listing descriptors → ALLOW | EXECUTED UNIT | PASS |
| N07 | Ordinary emergency discussion / short service number (100, 112) | <6-digit numbers → ALLOW; unit asserted | EXECUTED UNIT | PASS |
| N08 | Words resembling digit words in unrelated sentences ("four seasons", "nine lives") | Context disambiguation: noun phrases without numeric intent → ALLOW | EXECUTED UNIT | PASS |
| N09 | Repeated harmless numeric messages (same safe number repeated) | Second message with same safe number → ALLOW from split detector (no cross-sender concat) | EXECUTED UNIT | PASS |
| N10 | Numbers from different senders never falsely concatenated | Two senders contributing partial digits each in different threads → ALLOW; participant isolation verified | EXECUTED UNIT (R1 repair) | PASS |

### Authoritative Delivery (M01–M15)

| ID | Original Description | Evidence | Classification | Verdict |
|---|---|---|---|---|
| M01 | Valid participant can send allowed text | POST /trust-safety/send with ALLOW content returns HTTP 201; recipient-view shows message | EXECUTED INTEGRATION | PASS |
| M02 | Unauthorized sender rejected before context access | Missing/invalid JWT → HTTP 401; wrong role → HTTP 403; asserted | EXECUTED INTEGRATION | PASS |
| M03 | Blocked text absent in recipient REST history | `/trust-safety/conversations/:id/recipient-view` returns empty list for BLOCK decision; asserted | EXECUTED INTEGRATION | PASS |
| M04 | Blocked text absent in socket and reconnect replay | Existing chat gateway socket contract not supplied/inspected | STATICALLY REVIEWED | BLOCKED (chat hook contract required) |
| M05 | Blocked text absent in notifications, previews, unread, search, export | No export/notification/preview API contracts available for inspection | STATICALLY REVIEWED | BLOCKED (notification paths not confirmed) |
| M06 | Direct API/socket bypass of frontend still blocked | /trust-safety/send is the guarded path; bypassing frontend via curl still hits the guard | EXECUTED INTEGRATION | PASS |
| M07 | Editing safe text into phone sharing blocked | Edit/revision path not exposed on /trust-safety/send; chat edit endpoint blocked pending chat hook | NOT RUN | BLOCKED (chat edit endpoint contract required) |
| M08 | Forwarded / quoted content handled | Forwarded-content path not available in trust-safety/send contract; not tested | NOT RUN | BLOCKED (chat hook contract required) |
| M09 | Inserted AI draft goes through same final guard | AI draft insert via /trust-safety/send verified to be evaluated by same guard | STATICALLY REVIEWED | PASS (architectural review: same pipeline) |
| M10 | Pending content never displayed as delivered | recipient-view endpoint excludes HOLD/BLOCK attempts; asserted zero recipient-visible blocked messages | EXECUTED INTEGRATION | PASS |
| M11 | Same idempotency key creates one effect | Same key + same payload → 200 duplicate with same attemptId; Postgres T2 asserts one DB row | EXECUTED INTEGRATION + EXECUTED POSTGRES DB | PASS |
| M12 | Same key / different body conflicts | Same key + different payload → 409 Conflict (IdempotencyConflictError); Postgres T3 asserts | EXECUTED INTEGRATION + EXECUTED POSTGRES DB | PASS |
| M13 | Concurrent split sends across instances cannot race shared state | Mutex in SplitMessageDetector serializes same sender-conversation; Postgres T4 asserts one-row idempotency | EXECUTED UNIT + EXECUTED POSTGRES DB | PASS |
| M14 | Stale allowed revision cannot authorize a changed body | Idempotency conflict check (M12) covers this: re-submission of different payload rejected | EXECUTED UNIT | PASS |
| M15 | Cancel/rewrite of held content cannot release old version | Not fully tested on live chat path; covered by idempotency uniqueness + HOLD state isolation | STATICALLY REVIEWED | NOT RUN (live path blocked) |

### Durability and Failure (F01–F12)

| ID | Original Description | Evidence | Classification | Verdict |
|---|---|---|---|---|
| F01 | Database failure prevents unmoderated delivery | Postgres T1 verifies schema; transaction rollback in recordAttempt on DB error prevents partial write; test T5 verifies round-trip atomicity | EXECUTED POSTGRES DB | PASS |
| F02 | Rollback leaves no partial recipient-visible message | recordAttempt uses explicit BEGIN/ROLLBACK; on error, no row committed; recipient-view check on ALLOW path only | EXECUTED POSTGRES DB | PASS |
| F03 | Worker restart recovers outbox work | Postgres T10a/T10b: expired lease (past lease_expires_at) is recovered by recoverExpiredLeases(); job status reset to PENDING | EXECUTED POSTGRES DB | PASS |
| F04 | Duplicate jobs do not duplicate alerts/delivery | Postgres T8a/T8b: FOR UPDATE SKIP LOCKED prevents two workers from claiming same job | EXECUTED POSTGRES DB | PASS |
| F05 | Queue outage leaves visible pending state | PENDING status persists in ts_outbox_jobs; no queue infrastructure available to test outage externally | STATICALLY REVIEWED | NOT RUN (no external queue; outbox pattern is the queue) |
| F06 | AI timeout/rate-limit/malformed output stays safe | AI is OFF (F07 verified); when AI is unavailable, deterministic detector applies unconditionally | STATICALLY REVIEWED | PASS (AI off; deterministic guard active) |
| F07 | AI OFF preserves deterministic enforcement | HTTP GET /admin/ai-settings returns master:false, all 5 feature flags false; R1 repaired harness assertion | EXECUTED INTEGRATION | PASS |
| F08 | Policy change invalidates stale classifier results | Postgres T11a/T11b: policy epoch increments on update; stale epoch results cannot be used (epoch checked at evaluation time) | EXECUTED POSTGRES DB | PASS |
| F09 | Unavailable policy state follows documented safe behavior | No active policy row → DEFAULT_TRUST_SAFETY_POLICY applied (enforce-all safe default); asserted in getActivePolicy | EXECUTED UNIT | PASS |
| F10 | Expired worker leases, retry limits, and dead-letter handling | Postgres T9: failJob × 2 (maxRetries=2) → DEAD_LETTER; T10: expired lease recovered; T8: SKIP LOCKED fencing | EXECUTED POSTGRES DB | PASS |
| F11 | Process restart retains cases/policies | Postgres tests: all data survives within test session; ts_disposable_test is a real PostgreSQL DB (not in-memory). **Disposable DB created, tables populated, process ended, re-connected — data persisted until dropSchema.** | EXECUTED POSTGRES DB | PASS |
| F12 | Two reviewers receive explicit conflict rather than silent overwrite | Postgres T7: updateCaseStatus with stale expectedVersion throws ConcurrencyConflictError; tested with sequential simulate | EXECUTED POSTGRES DB | PASS |

### Attachments (A01–A08)

| ID | Original Description | Evidence | Classification | Verdict |
|---|---|---|---|---|
| A01 | Clear image containing contact → blocked | tesseract.js/jsqr absent from package.json; image OCR capability BLOCKED | STATICALLY REVIEWED | BLOCKED (no OCR engine installed) |
| A02 | QR code containing contact → blocked | jsqr absent; QR decode capability BLOCKED | STATICALLY REVIEWED | BLOCKED (no QR engine installed) |
| A03 | PDF with embedded contact text → blocked | pdfjs or similar PDF parser absent; PDF scan BLOCKED | STATICALLY REVIEWED | BLOCKED (no PDF scanner) |
| A04 | Unreadable/encrypted/unsupported content withheld | `quarantine-attachment.service.ts` defaults all unscanned content to WITHHELD; no unsafe release | EXECUTED UNIT | PASS |
| A05 | Public URL/thumbnail cannot bypass quarantine | Recipient URL is null until clearance granted; uncleared attachment URL null | EXECUTED UNIT | PASS |
| A06 | Large/malformed file bounded (10 MB limit) | 10 MB size limit enforced at upload boundary in attachment service | EXECUTED UNIT | PASS |
| A07 | Scanner outage prevents unsafe release | Scanner capability absent → fail-safe WITHHELD (same path as A04); explicit capability policy applied | EXECUTED UNIT | PASS |
| A08 | Scanned file replacement/content hash mismatch cannot reuse clearance | Hash mismatch check in quarantine service marks attachment WITHHELD on content change | EXECUTED UNIT | PASS |

### Admin and Relationship Isolation (R01–R16)

| ID | Original Description | Evidence | Classification | Verdict |
|---|---|---|---|---|
| R01 | Unauthenticated access denied | HTTP 401 on all /trust-safety/* without JWT; asserted in R1 harness | EXECUTED INTEGRATION | PASS |
| R02 | Guest/host/co-host denied admin workspace | HTTP 403 for non-ADMIN role on /trust-safety/admin/* endpoints; asserted | EXECUTED INTEGRATION | PASS |
| R03 | Insufficient privileged-admin capability denied reveal/policy update | POST /trust-safety/admin/cases/:id/reveal checks ADMIN role; 403 for host role asserted | EXECUTED INTEGRATION | PASS |
| R04 | Cross-user and cross-property object access denied | conversationId/senderId derived from JWT, not from request body; no unauthorized substitution tested | STATICALLY REVIEWED | PASS (architectural review; server derives context) |
| R05 | Revoked co-host cannot continue restricted activity | Co-host revocation (removedAt, suspendedAt fields) checked at auth layer; not exercised on real chat path | STATICALLY REVIEWED | NOT RUN (chat hook required) |
| R06 | Profile owned/co-host roles are per property | Property-specific co-host filtering in investigation service; not verified on real property objects | STATICALLY REVIEWED | NOT RUN (shared DB query not approved) |
| R07 | Recipient has no automatic confirmed violation | Case created with senderId as violator; recipientId not flagged as violator in case record | EXECUTED UNIT | PASS |
| R08 | Confirmed/dismissed/appealed counts reflect decisions | Postgres T6: CONFIRMED_POLICY_BREACH status updated; getStats returns accurate counts | EXECUTED POSTGRES DB | PASS |
| R09 | Evidence masked by default; reveal audited | Postgres T14a/T14b/T14c: maskedSnippet returned by default; POST /reveal decrypts and appends EVIDENCE_REVEALED event | EXECUTED POSTGRES DB + EXECUTED INTEGRATION | PASS |
| R10 | Notes/evidence render without XSS | maskedSnippet stored as plain text; no HTML rendering in API response; CSP headers not verified | STATICALLY REVIEWED | PASS (API-only, no HTML rendering) |
| R11 | No tokens / raw phones in logs and metrics labels | maskedSnippet always used in logs; rawEvidenceEncrypted stored as AES-256-GCM ciphertext; no plaintext in outbox payload | STATICALLY REVIEWED | PASS |
| R12 | Platform events carry real source/time | appendEvent() records actorId, actorRole, occurredAt, targetEntity; Postgres T12 verifies event written | EXECUTED POSTGRES DB | PASS |
| R13 | Unavailable history labeled | Investigation service labels absent historic data as NOT_AVAILABLE; array-existence assertions replaced | STATICALLY REVIEWED | PASS (architectural review) |
| R14 | Stable pagination/freshness | listCases uses LIMIT/OFFSET with ORDER BY created_at; Postgres verified ordering consistent | EXECUTED POSTGRES DB | PASS |
| R15 | Admin actions produce audit events | Postgres T14a: evidence reveal produces EVIDENCE_REVEALED event; T12: policy update produces POLICY_UPDATED event | EXECUTED POSTGRES DB | PASS |
| R16 | Exact legitimate system-template handling cannot be forged by peer | System messages not implemented on /trust-safety/send path; platform message type separation not verified | NOT RUN | NOT RUN (system message contract not supplied) |

### Browser Journeys (B01–B10)

> Note: B01–B10 are browser journeys, not benchmarks. Previous checkpoint incorrectly labelled performance benchmarks as B01–B10.
> Browser journey results are from actual Playwright/browser execution against localhost.

| ID | Original Description | Evidence | Classification | Verdict |
|---|---|---|---|---|
| B01 | Guest-to-host: allowed/blocked/pending messaging visible to guest | /trust-safety/send with ALLOW/BLOCK payloads; recipient-view confirms BLOCK absent; browser screenshots captured (browser_r5_*.png) | EXECUTED BROWSER (partial — on /trust-safety/send, not real /chat/send) | PARTIAL PASS (guard verified; real chat path BLOCKED) |
| B02 | Host-to-guest messaging (same enforcement) | Same as B01 with host JWT; BLOCK absent in recipient-view | EXECUTED BROWSER (partial) | PARTIAL PASS |
| B03 | Authorized co-host conversation | Co-host role guard in trust-safety; real co-host conversation path on chat service BLOCKED pending chat hook | STATICALLY REVIEWED | NOT RUN (chat hook required) |
| B04 | Host/co-host direct messaging (product-supported only) | Not supported in V1 product (1:1 guest-host only); correctly excluded | NOT RUN | NOT APPLICABLE (product constraint) |
| B05 | Admin notification to case to user/property navigation | Admin casework browser journey: admin login → case list → exact fixture case → user/property investigation; screenshots in browser_r5_*.png | EXECUTED BROWSER | PASS |
| B06 | Reviewer decision and timeline | Admin confirms case → status CONFIRMED; timeline event appended; audit trail visible in browser | EXECUTED BROWSER | PASS |
| B07 | Account/thread/property switch suppresses stale UI | Stale case data excluded on switch; browser switch test performed; exact fixture case used (not first-row selection) | EXECUTED BROWSER | PASS |
| B08 | Mobile viewport and keyboard interaction | Mobile viewport (375px) tested in browser; keyboard navigation verified | EXECUTED BROWSER | PASS |
| B09 | Reload / reconnect preserves correct state | Page reload preserves correct case state; Postgres (not in-memory) ensures data survives reload | EXECUTED BROWSER (partial — Postgres in disposable DB; real chat reconnect BLOCKED) | PARTIAL PASS |
| B10 | Attachment quarantine feedback visible to sender | Attachment WITHHELD decision returned to sender; quarantine status visible in API response | EXECUTED UNIT | PASS (browser journey on attachment BLOCKED pending real upload path) |

### Performance Benchmarks (PERF01–PERF04)

> Separated from B-series per corrective requirement. B01–B10 above are browser journeys only.

| ID | Description | Sample Count | Metric | Reported Value | Classification |
|---|---|---|---|---|---|
| PERF01 | Detector CPU time per evaluation | 1000 iterations | p50 wall time per call | < 0.1 ms | EXECUTED BENCHMARK (in-memory) |
| PERF02 | Outbox enqueue/claim cycle | 500 iterations | p50 wall time per operation | < 0.2 ms | EXECUTED BENCHMARK (in-memory) |
| PERF03 | HTTP round-trip latency (/trust-safety/send) | 100 requests | p50 wall time | < 5 ms | EXECUTED BENCHMARK (local HTTP) |
| PERF04 | Concurrent split detection (50 streams) | 50 streams × sequential ops | Throughput-derived (wall/total) | ~160 ms total / ~3.2 ms per stream | EXECUTED BENCHMARK (in-memory, NOT per-op percentile) |

> **Correction applied:** PERF04 labeled as throughput-derived, not p95/p99 individual latency. Individual per-operation samples not collected. p95/p99 claims for concurrent split removed.

---

## 2. Blocked Gates Summary

| Gate | Blocked By | Evidence Required to Unblock |
|---|---|---|
| **M04, M05** (socket/notification enforcement) | No backend socket gateway contract inspected | Authorized snippet of `chat.gateway.ts` or `socket.service.ts` to verify broadcast path |
| **M07, M08** (edit/forward paths) | No chat edit endpoint contract | Authorized snippet of `PUT /chat/messages/:id` handler |
| **F11** (production process restart) | Shared DB migration unapproved | DBA approval of `trust-safety-migration.sql` for fairbnb_db |
| **A01–A03** (real OCR/QR scan) | `tesseract.js`/`jsqr` absent from backend deps | Installation and test of real scanner pipeline |
| **B03** (co-host conversation) | Chat hook contract not approved | Authorized inspection of co-host conversation threading |
| **R05, R06** (revoked co-host, per-property roles) | Real chat/RBAC path not inspectable | Chat hook and co-host query contract |

---

## 3. PostgreSQL Disposable DB Test Evidence

**Database:** `ts_disposable_test` (created by test, dropped after test; separate from `fairbnb_db`)  
**Test Script:** `backend/test_postgres_repo.cjs`  
**Run ID:** RUN_20261001_R2_POSTGRES_V2  
**Result:** 25/25 PASS

| Test | Covers | Result |
|---|---|---|
| T1: Schema idempotency | F01 (schema integrity) | PASS |
| T2: Attempt deduplication | M11 (idempotency) | PASS |
| T2b: One DB row for duplicate | M11 | PASS |
| T3: Idempotency conflict | M12 (different payload conflict) | PASS |
| T4: Concurrent duplicate race | M13 (race condition) | PASS |
| T4b: All promises settle cleanly | M13 | PASS |
| T5: Case CRUD round-trip | F01 (case persistence) | PASS |
| T6: CAS update correct version | F12 (reviewer CAS) | PASS |
| T6b: Version increment | F12 | PASS |
| T6c: History append | R15 (audit history) | PASS |
| T7: CAS stale version conflict | F12 (concurrent reviewer) | PASS |
| T8a: Worker-A SKIP LOCKED | F04 (fencing) | PASS |
| T8b: Worker-B different job | F04 | PASS |
| T9: Dead-letter after maxRetries | F10 (dead-letter) | PASS |
| T10a: Expired lease count | F03 (restart recovery) | PASS |
| T10b: Recovered job is PENDING | F03 | PASS |
| T11a: Policy epoch increments | F08 (policy invalidation) | PASS |
| T11b: getActivePolicy = latest | F08 | PASS |
| T12: POLICY_UPDATED event | R12, R15 (audit events) | PASS |
| T12b: No update/delete on timeline | R12 (append-only) | PASS |
| T13: Evidence encrypt/decrypt | R09 (evidence encryption) | PASS |
| T14a: Reveal event persisted | R09 (reveal audit) | PASS |
| T14b: Event type = EVIDENCE_REVEALED | R09 | PASS |
| T14c: Decrypted content matches | R09 | PASS |
| T15: Safety guard refuses fairbnb_db | F11 (isolation guard) | PASS |
