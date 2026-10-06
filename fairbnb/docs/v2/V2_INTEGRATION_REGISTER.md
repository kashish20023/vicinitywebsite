# Fairbnb V2 — Integration Register

**Last Sync:** 2026-10-01 (Checkpoint 17 / Corrective Pass)  
**Run ID:** RUN_20261001_R2_POSTGRES_V2  
**Verdict:** IMPLEMENTED WITH BLOCKED INTEGRATIONS

> This register is the single source of truth for which V2 integration points are  
> OPERATIONAL, BLOCKED, or PENDING. Each entry links to the requirement IDs it covers.

---

## Registered Integration Points

### 1. Trust Safety Send Endpoint — OPERATIONAL
| Attribute | Value |
|---|---|
| **Route** | `POST /trust-safety/send` |
| **Guard** | `TrustSafetyGuard` (JWT + participant verification) |
| **Detector** | `DeterministicPhoneDetector` via `TrustSafetyService` |
| **Persistence** | `PostgresTrustSafetyRepository` (requires ts_disposable_test for tests; ts_moderation_* tables in shared DB after DBA-approved migration) |
| **Status** | OPERATIONAL on dedicated ingress |
| **Requirements** | D01–D12, N01–N10, M01–M03, M06, M09–M14, F01–F12, R01–R04, R07–R15 |
| **Gap** | M04, M05, M07, M08 — chat hook contract not yet authorized |

### 2. Chat Send / Edit Hooks — BLOCKED
| Attribute | Value |
|---|---|
| **Target** | `backend/src/chat/chat.service.ts` → `sendMessage()` |
| **Status** | **BLOCKED** |
| **Reason** | No authorized read access to `chat.service.ts` send and edit handlers supplied. Cannot verify that trust-safety evaluation is called before message persisted/broadcast. |
| **Requirements blocked** | M04, M05, M07, M08, B01, B02, B03 (partial), B09 (partial), R05, R06 |
| **Unblock action** | Provide authorized snippet of `POST /chat/messages` handler for read/annotation |

### 3. Socket Broadcast Gate — BLOCKED
| Attribute | Value |
|---|---|
| **Target** | `backend/src/chat/chat.gateway.ts` (WebSocket gateway) |
| **Status** | **BLOCKED** |
| **Reason** | Gateway contract not authorized for inspection. Cannot verify that BLOCK decisions suppress socket broadcast to recipient. |
| **Requirements blocked** | M04 (recipient socket exclusion), M05 (notification suppression) |
| **Unblock action** | Provide snippet of WebSocket `handleMessage` / emit path |

### 4. Attachment Quarantine — OPERATIONAL (Fail-Safe Mode)
| Attribute | Value |
|---|---|
| **Path** | `QuarantineAttachmentService` |
| **Status** | OPERATIONAL (fail-safe WITHHELD for all unscanned content) |
| **Limitations** | A01–A03 BLOCKED: real OCR (tesseract.js), QR decode (jsqr), PDF scanning absent from backend/package.json |
| **Requirements** | A04–A08 PASS; A01–A03 BLOCKED |
| **Unblock action** | `npm install tesseract.js jsqr pdf-parse` in backend; implement real scanner path |

### 5. Admin Casework API — OPERATIONAL
| Attribute | Value |
|---|---|
| **Routes** | `GET /trust-safety/admin/cases`, `POST /trust-safety/admin/cases/:id/confirm`, `POST /trust-safety/admin/cases/:id/dismiss`, `POST /trust-safety/admin/cases/:id/reveal` |
| **Status** | OPERATIONAL |
| **Persistence** | Postgres repository; CAS versioning for F12 |
| **Requirements** | R02, R03, R09, R15, B05, B06 |

### 6. Policy Management — OPERATIONAL
| Attribute | Value |
|---|---|
| **Route** | `GET /trust-safety/admin/policy`, `PUT /trust-safety/admin/policy` |
| **Status** | OPERATIONAL |
| **Epoch tracking** | Each PUT increments epoch; stale results invalidated (F08) |
| **Requirements** | F07, F08, F09, R12 |

### 7. PostgreSQL Repository — OPERATIONAL (Disposable DB only until migration approved)
| Attribute | Value |
|---|---|
| **File** | `backend/src/trust-safety/persistence/postgres-trust-safety.repository.ts` |
| **Status** | OPERATIONAL (code written; integration test 25/25 on ts_disposable_test) |
| **Production use** | Blocked on DBA approval of `trust-safety-migration.sql` for fairbnb_db |
| **Requirements** | F01–F12, M11–M13, R08–R09, R12, R15 |
| **Test evidence** | RUN_20261001_R2_POSTGRES_V2, 25/25 PASS, `backend/test_postgres_repo.cjs` |
| **Database isolation** | Safety guard: throws if connection string contains `fairbnb_db` |

### 8. AI Feature Flags — LOCKED OFF
| Attribute | Value |
|---|---|
| **Status** | ALL 5 feature flags false (master:false verified at HTTP GET /admin/ai-settings) |
| **Flags** | `smartSearchEnabled`, `stayComparisonEnabled`, `listingQaEnabled`, `guestReplyDraftEnabled`, `listingQualityEnabled` |
| **Requirement** | F07 — AI OFF preserves deterministic enforcement |
| **Guard** | Any AI path guarded by RuntimeConfigService.isEnabled(); deterministic detector applies unconditionally |

---

## Blocked Integration Summary

| Integration | Blocked By | Requirements Affected | Unblock Action |
|---|---|---|---|
| Chat send hook | Chat handler contract not authorized | M04, M05, M07, M08, B01-B03 (partial), R05, R06 | Authorize chat.service.ts read |
| Socket broadcast gate | Gateway contract not authorized | M04, M05 | Authorize chat.gateway.ts read |
| A01–A03 (OCR/QR/PDF) | tesseract.js/jsqr/pdf-parse absent | A01, A02, A03 | Install scanner engines |
| F11 production restart | trust-safety-migration.sql not applied | F11 (shared DB durability) | DBA approval of migration |
| PERF04 p95/p99 per-op latency | Concurrent throughput measurement only | PERF04 p-percentiles | Collect per-operation samples |
