# Fairbnb V2 Trust & Safety — Implementation Checkpoint (Corrective Pass 17)

**Execution Date:** 2026-10-01 (Checkpoint 17)  
**Run ID:** RUN_20261001_R2_POSTGRES_V2  
**Git HEAD:** a82a6602dbffc64697aff1b2dfe7b737b56aae1f (main, dirty worktree — V2 files added)  
**Phase:** Corrective Implementation R0–R7 (Final corrections to previous "IMPLEMENTED WITH BLOCKED INTEGRATIONS" baseline)  
**Readiness Verdict:** **IMPLEMENTED WITH BLOCKED INTEGRATIONS**  
**Database Guard:** Zero migrations, pushes, truncates, or resets on shared `fairbnb_db`.  
**Postgres Evidence:** 25/25 integration tests on `ts_disposable_test` (created/dropped by test run).  
**AI Decoupling Guard:** All 5 generative AI feature toggles strictly preserved OFF.

---

## Corrective Phase Progress Ledger

### Phase R0: Evidence, Scope & Plugin Reconciliation — COMPLETE
- **Run ID:** RUN_20261001_R0_V2
- **Git HEAD:** a82a6602dbffc64697aff1b2dfe7b737b56aae1f (main, dirty worktree)
- **Plugin Discovery:**
  - Code Review: DISCOVERED (`.agents/skills/code-review-and-quality/SKILL.md`) — Review checklist active.
  - GSD (Get Shit Done): NOT DISCOVERABLE IN THIS ENVIRONMENT — Manual fallback checklist in use.
- **Secrets Remediation:** Hardcoded JWT secret removed from all test scripts. Dynamic runtime resolver implemented. SECRET_ROTATION_PLAN.md updated with corrective fixes.
- **Requirement Reconciliation:** Original D/N/M/F/A/R/B taxonomy restored with **83 individual IDs, each with its own row**. B01–B10 now correctly represent browser journeys (not benchmarks). PERF01–PERF04 added for performance results. Grouped multi-ID rows eliminated.

**Defects found and corrected:**
1. Grouped batch rows (D01–D07 as one) → replaced with 12 individual D rows, 10 N rows, 15 M rows, 12 F rows, 8 A rows, 16 R rows, 10 B rows
2. B01–B10 mislabeled as benchmarks → corrected to browser journeys; PERF01–PERF04 added
3. F11 claimed PASS on in-memory review → reclassified BLOCKED on migration; Postgres evidence added
4. M11/M12 in-memory idempotency only → supplemented with Postgres T2/T3 proving DB-level idempotency
5. PERF04 p95/p99 from concurrent throughput division removed → labeled throughput-derived

### Phase R1: Test Harness Assertions Repair — COMPLETE
- **Script:** `run_r1_repaired_harness.cjs`
- **Fixes:**
  - Replaced unconditional `record(id, ..., true, ...)` entries with actual assertions
  - F07: HTTP 200, `master:false`, and all 5 named feature flags individually asserted false (empty object fails)
  - N10: Actual two-sender/two-thread isolation test (combined digits from different senders → ALLOW)
  - M13: Actual BLOCK decision asserted, plus zero recipient leakage check
  - SM01 (split test): exact expected decision asserted, no truthy ternary
  - DEAD_LETTER: actual state asserted after maxRetries, not inferred from empty pending list

### Phase R2: Real PostgreSQL Persistence — COMPLETE (Disposable DB)
- **Script:** `backend/test_postgres_repo.cjs`
- **Database:** `ts_disposable_test` (created fresh, tables populated, cleanup drops all tables)
- **Result:** 25/25 PASS
- **Postgres repository:** `backend/src/trust-safety/persistence/postgres-trust-safety.repository.ts`
  - Implements all ITrustSafety* interfaces
  - Uses raw `pg` Pool (not Prisma) — avoids coupling to unapproved shared migration
  - FOR UPDATE SKIP LOCKED worker fencing (F03, F04, F10)
  - Optimistic CAS with explicit version check (F12)
  - Idempotency UNIQUE constraint scoped to (sender_id, conversation_id, idempotency_key) per M11/M12
  - BEGIN/COMMIT/ROLLBACK for atomic attempt recording (F01, F02)
  - Append-only timeline events (no UPDATE/DELETE path) (R12, R15)
  - AES-256-GCM evidence encryption (R09)
  - Safety guard: throws if connection string targets fairbnb_db (F11 isolation)
- **InMemoryTrustSafetyRepository** remains: restricted to explicit test/demo use only
- **clearAll()** remains: labeled test-only; application must not call it in production code

**Migration status:** `docs/v2/trust-safety-migration.sql` — corrected draft, unapplied. Blocked pending DBA approval.

**Migration corrections applied:**
- Idempotency UNIQUE constraint scoped to (sender_id, conversation_id, idempotency_key)
- No Conversation table FK (fairbnb_db has no Conversation table; documented as logical ID)
- Cascade deletion reviewed: attempts retained on sender user deletion (SET NULL on case_id link)
- Audit/timeline events: no cascade delete on actor; events are audit records, must survive user removal
- Rollback uses table rename (ALTER TABLE ts_* RENAME TO ts_*_archive) — not DROP; audit history preserved

### Phase R3: Actual Chat Path Contract Scope — BLOCKED
- **Status:** IMPLEMENTED ON DEDICATED INGRESS / BLOCKED ON CHAT HOOK CONTRACT
- **Guard mounted on:** `/trust-safety/send`
- **Real path:** Hooking into `backend/src/chat/chat.service.ts` / `chat.controller.ts` requires authorized snippet access
- **Action required:** Provide read access to `/chat/send` handler body to verify integration point; do not guess

### Phase R4: Media Quarantine & Capability Policy — COMPLETE
- **Status:** PASS (quarantine-attachment.service.ts; fail-safe operational)
- `tesseract.js`/`jsqr` absent from backend/package.json (confirmed)
- A01–A03 BLOCKED on OCR/QR engine; A04–A08 enforced via fail-safe WITHHELD policy

### Phase R5: Admin Evidence & Activity Provenance — COMPLETE
- **Status:** Browser journeys verified
- Exact fixture case IDs used (not first-row selection)
- Admin confirm/dismiss transitions on exact created case only
- Evidence reveal: maskedSnippet by default, EVIDENCE_REVEALED event appended on reveal
- Timeline events: server-authoritative actor/time; no client-provided timestamps accepted
- Browser screenshots: browser_r5_admin_casework.png, browser_r5_audit_timeline.png, browser_r5_privilege_negative.png, browser_r5_property_investigation.png, browser_r5_user_investigation.png

### Phase R6: Original Acceptance Suite — COMPLETE (see Evidence Matrix)
- **Original requirement map restored:** 83 individual IDs with honest individual verdicts
- Browser journeys B01–B10 correctly separated from benchmarks
- PERF01–PERF04 added with honest sample labeling
- All BLOCKED/NOT RUN items explicitly named — not removed from denominator
- Summary: 55 PASS, 6 PARTIAL PASS, 10 BLOCKED, 9 NOT RUN, 3 NOT APPLICABLE

### Phase R7: Cleanup & Synchronized Handoff — COMPLETE
- `ts_disposable_test` database dropped after test (test cleanup in finally)
- No task-created records remain in fairbnb_db
- Hardcoded JWT secrets removed from all test scripts (replaced with env-based resolver)
- `SECRET_ROTATION_PLAN.md` updated with corrective fixes
- This checkpoint synchronized from one verified run ledger (RUN_20261001_R2_POSTGRES_V2)

---

## Changed File Map (V2 additions only)

| File | Change | Evidence Impact |
|---|---|---|
| `backend/src/trust-safety/persistence/postgres-trust-safety.repository.ts` | **NEW** — PostgreSQL repository | F01-F12, M11-M13, R08-R09, R12, R15 |
| `backend/src/trust-safety/persistence/trust-safety-persistence.interfaces.ts` | Extended with encrypt/decrypt/reveal interfaces | R09 |
| `backend/src/trust-safety/persistence/in-memory-trust-safety.repository.ts` | Added evidence encryption; restricted clearAll() to tests | R09, safety |
| `backend/src/trust-safety/normalization/unicode-normalizer.ts` | Extended Hindi/Hinglish digit vocabulary | D08 |
| `backend/src/trust-safety/trust-safety.service.ts` | Added evidence encryption, reveal endpoint, case history | R09, R15 |
| `backend/src/trust-safety/trust-safety.controller.ts` | Added POST admin/cases/:id/reveal | R09 |
| `backend/test_postgres_repo.cjs` | **NEW** — Disposable DB integration test (25 tests) | F01-F12, M11-M13, R08-R09, R12, R15 |
| `docs/v2/V2_CHECKPOINT.md` | **UPDATED** — Synchronized from verified run | All |
| `docs/v2/V2_EVIDENCE_MATRIX.md` | **UPDATED** — 83 individual IDs, honest individual verdicts | All |
| `docs/v2/V2_INTEGRATION_REGISTER.md` | **UPDATED** — Synced with corrective findings | M04-M05 BLOCKED |
| `docs/v2/SECRET_ROTATION_PLAN.md` | **UPDATED** — Corrected rotation vs revocation | Security |
| `docs/v2/trust-safety-migration.sql` | Corrected idempotency scope, cascade policy, rollback strategy | F11 |

---

## Outstanding Requirements for Staging Gate

1. **DBA approval of `trust-safety-migration.sql`** — F11 unblocked
2. **Authorized read access to `/chat/send` handler** — M04, M05, M07, M08, R05, R06 unblocked, B03 unblocked
3. **Installation of OCR/QR engine (`tesseract.js`/`jsqr`)** — A01, A02, A03 unblocked
4. **Secondary staging credentials** — B01-B10 full browser journeys on real chat path
