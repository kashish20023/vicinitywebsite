-- ============================================================================
-- Fairbnb V2 Trust & Safety — Additive Migration Proposal
-- Status: UNAPPLIED (Pending DBA approval for fairbnb_db)
-- Database: fairbnb_db (NOT ts_disposable_test)
-- Disposable test uses equivalent DDL in postgres-trust-safety.repository.ts
-- Prepared: 2026-10-01 (Corrective Pass 17)
-- ============================================================================

-- CORRECTION NOTES:
-- 1. Idempotency UNIQUE: scoped to (sender_id, conversation_id, idempotency_key)
--    NOT just (idempotency_key). Reason: same key may be reused across different
--    conversations by the same sender legitimately (different booking threads).
-- 2. No Conversation table FK: fairbnb_db has ChatMessage with senderId/recipientId
--    but no Conversation table. conversation_id stored as logical TEXT (no FK).
-- 3. Cascade deletion policy reviewed:
--    - ts_moderation_attempts.case_id → ON DELETE SET NULL (attempts survive case deletion)
--    - ts_moderation_cases: NO CASCADE on sender_id (User cannot be deleted while cases open)
--    - ts_timeline_events: NO CASCADE on actor_id (audit records survive user removal)
-- 4. Rollback: rename tables to *_archive (NOT DROP). Preserves audit history.
-- 5. CONCURRENT index creation: done OUTSIDE transaction blocks.
-- 6. Append-only enforcement for timeline events: via application constraint only
--    (PostgreSQL row-level security or trigger could be added; documented as enhancement).

-- ============================================================================
-- Section 1: Moderation Cases
-- ============================================================================

CREATE TABLE IF NOT EXISTS ts_moderation_cases (
  id              TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN','IN_REVIEW','CONFIRMED_POLICY_BREACH','DISMISSED','APPEALED','RESOLVED')),
  priority        TEXT NOT NULL DEFAULT 'MEDIUM'
                    CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  -- Logical sender reference. FK to "User" verified present in fairbnb_db.
  sender_id       TEXT NOT NULL
                    REFERENCES "User"(id) ON DELETE RESTRICT,
  recipient_id    TEXT NOT NULL,  -- Logical reference; no FK to preserve read history
  -- Logical conversation ID (no Conversation table in fairbnb_db; stored as TEXT)
  conversation_id TEXT NOT NULL,
  -- Optional property reference. FK to "Property" verified present in fairbnb_db.
  property_id     TEXT REFERENCES "Property"(id) ON DELETE SET NULL,
  attempt_id      TEXT,   -- Populated after attempt recorded; soft reference
  masked_snippet  TEXT NOT NULL,
  -- AES-256-GCM ciphertext: iv:authTag:ciphertext (hex-encoded)
  raw_evidence_encrypted TEXT,
  key_version     TEXT DEFAULT 'v1',
  reasons         JSONB NOT NULL DEFAULT '[]',
  -- Optimistic concurrency version for compare-and-swap (F12)
  version         INTEGER NOT NULL DEFAULT 1,
  assigned_admin_id TEXT,  -- Logical admin reference; no FK (admin role checked at app layer)
  history         JSONB NOT NULL DEFAULT '[]',  -- Array of ReviewerAction objects
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS ts_cases_status_idx ON ts_moderation_cases(status);
CREATE INDEX IF NOT EXISTS ts_cases_sender_idx ON ts_moderation_cases(sender_id);
CREATE INDEX IF NOT EXISTS ts_cases_property_idx ON ts_moderation_cases(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ts_cases_priority_status_idx ON ts_moderation_cases(priority, status);

-- ============================================================================
-- Section 2: Moderation Attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS ts_moderation_attempts (
  id              TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  sender_id       TEXT NOT NULL,  -- Logical reference (no FK; preserved even after User deletion for audit)
  conversation_id TEXT NOT NULL,
  payload_hash    TEXT NOT NULL,  -- SHA-256 of original content
  raw_length      INTEGER NOT NULL CHECK (raw_length >= 0),
  decision        TEXT NOT NULL
                    CHECK (decision IN ('ALLOW','BLOCK','HOLD','ESCALATE','INPUT_LENGTH_EXCEEDED')),
  reasons         JSONB NOT NULL DEFAULT '[]',
  spans           JSONB NOT NULL DEFAULT '[]',     -- Span mappings (start/end/type)
  matched_identifiers JSONB NOT NULL DEFAULT '[]', -- Keyed fingerprints (not raw phones)
  -- Soft reference to case; SET NULL on case deletion to preserve attempt audit record
  case_id         TEXT REFERENCES ts_moderation_cases(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- CORRECTION: Scoped to sender + conversation + key (not global idempotency_key alone)
  UNIQUE (sender_id, conversation_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS ts_attempts_sender_idx ON ts_moderation_attempts(sender_id);
CREATE INDEX IF NOT EXISTS ts_attempts_conv_idx ON ts_moderation_attempts(conversation_id);

-- ============================================================================
-- Section 3: Outbox Jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS ts_outbox_jobs (
  id              TEXT PRIMARY KEY,
  job_type        TEXT NOT NULL
                    CHECK (job_type IN ('ADMIN_NOTIFICATION','MESSAGE_DELIVERY','TIMELINE_EVENT')),
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','CLAIMED','COMPLETED','FAILED','DEAD_LETTER')),
  claimed_by      TEXT,         -- Worker ID holding the lease
  lease_expires_at TIMESTAMPTZ, -- Worker lease expiry (for recovery, F03)
  retry_count     INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  max_retries     INTEGER NOT NULL DEFAULT 3 CHECK (max_retries >= 0),
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTE: CONCURRENTLY cannot run inside a transaction block.
-- Run this index creation AFTER the transaction that creates the table.
-- Ordinary CREATE INDEX (not CONCURRENTLY) is used here for initial migration.
-- CONCURRENTLY applies only to index creation on a pre-populated table.
CREATE INDEX IF NOT EXISTS ts_outbox_pending_idx ON ts_outbox_jobs(status, created_at)
  WHERE status IN ('PENDING','CLAIMED');

-- ============================================================================
-- Section 4: Timeline Events (Append-Only Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ts_timeline_events (
  event_id        TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  actor_id        TEXT NOT NULL,  -- No FK: audit records must survive actor deletion
  actor_role      TEXT NOT NULL,
  target_entity   TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',  -- Safe before/after values only (no raw phones)
  occurred_at     TIMESTAMPTZ NOT NULL,
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INTEGER NOT NULL DEFAULT 1
  -- APPEND-ONLY ENFORCEMENT: Application must not UPDATE or DELETE this table.
  -- Enhancement: Add row-level security or INSERT-only trigger in a future pass.
);

CREATE INDEX IF NOT EXISTS ts_events_entity_id_idx ON ts_timeline_events(target_entity, target_id);
CREATE INDEX IF NOT EXISTS ts_events_actor_idx ON ts_timeline_events(actor_id);
CREATE INDEX IF NOT EXISTS ts_events_occurred_idx ON ts_timeline_events(occurred_at DESC);

-- ============================================================================
-- Section 5: Policy History
-- ============================================================================

CREATE TABLE IF NOT EXISTS ts_policies (
  id          BIGSERIAL PRIMARY KEY,
  version     TEXT NOT NULL,
  epoch       INTEGER NOT NULL DEFAULT 1 CHECK (epoch > 0),
  config      JSONB NOT NULL,
  admin_id    TEXT NOT NULL,   -- Logical admin reference; no FK (audit must survive actor deletion)
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Each row is a new policy version; no updates (append-only log of policy history)
);

-- ============================================================================
-- Rollback Plan (NON-DESTRUCTIVE)
-- ============================================================================
-- DO NOT DROP TABLES. Preserve audit evidence. Rename to archive on rollback:
--
--   ALTER TABLE ts_timeline_events RENAME TO ts_timeline_events_archive;
--   ALTER TABLE ts_moderation_attempts RENAME TO ts_moderation_attempts_archive;
--   ALTER TABLE ts_moderation_cases RENAME TO ts_moderation_cases_archive;
--   ALTER TABLE ts_outbox_jobs RENAME TO ts_outbox_jobs_archive;
--   ALTER TABLE ts_policies RENAME TO ts_policies_archive;
--
-- THEN: Remove reference to PostgresTrustSafetyRepository from NestJS module
-- and revert TrustSafetyService to InMemoryTrustSafetyRepository for emergency
-- rollback. Do NOT run clearAll() on archive tables.
-- ============================================================================
