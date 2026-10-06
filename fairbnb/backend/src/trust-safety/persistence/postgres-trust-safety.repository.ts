// PostgresTrustSafetyRepository — Real PostgreSQL-backed repository
// MUST be pointed at ts_disposable_test DB only, never fairbnb_db
// Evidence classification: EXECUTED INTEGRATION (disposable DB only)
// Requirement coverage: F01, F02, F03, F04, F10, F11, F12, M11, M12, M13, R12, R15

import { Pool } from 'pg';
import * as crypto from 'crypto';
import {
  ITrustSafetyCaseRepository,
  ITrustSafetyAttemptRepository,
  IOutboxRepository,
  ITimelineEventRepository,
  IPolicyRepository,
  TrustSafetyCase,
  TrustSafetyAttempt,
  OutboxJob,
  OutboxJobType,
  OutboxJobStatus,
  TrustSafetyEvent,
  CaseStatus,
  CasePriority,
  ReviewerAction,
  ConcurrencyConflictError,
  IdempotencyConflictError,
} from './trust-safety-persistence.interfaces.js';
import { TrustSafetyPolicy, DEFAULT_TRUST_SAFETY_POLICY } from '../policy/trust-safety-policy.types.js';

export const DISPOSABLE_DB_DDL = `
CREATE TABLE IF NOT EXISTS ts_moderation_cases (
  id              TEXT PRIMARY KEY,
  status          TEXT NOT NULL CHECK (status IN ('OPEN','IN_REVIEW','CONFIRMED_POLICY_BREACH','DISMISSED','APPEALED','RESOLVED')),
  priority        TEXT NOT NULL CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  sender_id       TEXT NOT NULL,
  recipient_id    TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  property_id     TEXT,
  attempt_id      TEXT,
  masked_snippet  TEXT NOT NULL,
  raw_evidence_encrypted TEXT,
  key_version     TEXT,
  reasons         JSONB NOT NULL DEFAULT '[]',
  version         INTEGER NOT NULL DEFAULT 1,
  assigned_admin_id TEXT,
  history         JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ts_moderation_attempts (
  id               TEXT PRIMARY KEY,
  idempotency_key  TEXT NOT NULL,
  sender_id        TEXT NOT NULL,
  conversation_id  TEXT NOT NULL,
  payload_hash     TEXT NOT NULL,
  raw_length       INTEGER NOT NULL,
  decision         TEXT NOT NULL CHECK (decision IN ('ALLOW','BLOCK','HOLD','ESCALATE','INPUT_LENGTH_EXCEEDED')),
  reasons          JSONB NOT NULL DEFAULT '[]',
  spans            JSONB NOT NULL DEFAULT '[]',
  matched_identifiers JSONB NOT NULL DEFAULT '[]',
  case_id          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sender_id, conversation_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS ts_outbox_jobs (
  id               TEXT PRIMARY KEY,
  job_type         TEXT NOT NULL CHECK (job_type IN ('ADMIN_NOTIFICATION','MESSAGE_DELIVERY','TIMELINE_EVENT')),
  payload          JSONB NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLAIMED','COMPLETED','FAILED','DEAD_LETTER')),
  claimed_by       TEXT,
  lease_expires_at TIMESTAMPTZ,
  retry_count      INTEGER NOT NULL DEFAULT 0,
  max_retries      INTEGER NOT NULL DEFAULT 3,
  last_error       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ts_timeline_events (
  event_id        TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  actor_id        TEXT NOT NULL,
  actor_role      TEXT NOT NULL,
  target_entity   TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL,
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ts_policies (
  id          SERIAL PRIMARY KEY,
  version     TEXT NOT NULL,
  epoch       INTEGER NOT NULL DEFAULT 1,
  config      JSONB NOT NULL,
  admin_id    TEXT NOT NULL,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export class PostgresTrustSafetyRepository
  implements ITrustSafetyCaseRepository, ITrustSafetyAttemptRepository,
    IOutboxRepository, ITimelineEventRepository, IPolicyRepository {

  private pool: Pool;
  private evidenceKey: Buffer;

  constructor(connectionString: string, evidenceKeySecret?: string) {
    if (!connectionString || connectionString.includes('fairbnb_db')) {
      throw new Error('MUST use ts_disposable_test, not fairbnb_db');
    }
    this.pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30000 });
    const rawKey = evidenceKeySecret || process.env.V2_EVIDENCE_KEY || 'v2-evidence-key-placeholder-32b';
    this.evidenceKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  async applySchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(DISPOSABLE_DB_DDL);
      const { rowCount } = await client.query('SELECT 1 FROM ts_policies LIMIT 1');
      if (rowCount === 0) {
        await client.query(
          'INSERT INTO ts_policies (version, epoch, config, admin_id, reason) VALUES ($1,$2,$3,$4,$5)',
          [DEFAULT_TRUST_SAFETY_POLICY.version, DEFAULT_TRUST_SAFETY_POLICY.epoch,
           JSON.stringify(DEFAULT_TRUST_SAFETY_POLICY), 'system', 'Initial policy seed'],
        );
      }
    } finally { client.release(); }
  }

  async dropSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        DROP TABLE IF EXISTS ts_policies;
        DROP TABLE IF EXISTS ts_timeline_events;
        DROP TABLE IF EXISTS ts_outbox_jobs;
        DROP TABLE IF EXISTS ts_moderation_attempts;
        DROP TABLE IF EXISTS ts_moderation_cases;
      `);
    } finally { client.release(); }
  }

  async end(): Promise<void> { await this.pool.end(); }

  // ITrustSafetyCaseRepository
  async createCase(caseData: Omit<TrustSafetyCase,'id'|'version'|'history'|'createdAt'|'updatedAt'>): Promise<TrustSafetyCase> {
    const id = `case_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const client = await this.pool.connect();
    try {
      const r = await client.query(
        `INSERT INTO ts_moderation_cases (id,status,priority,sender_id,recipient_id,conversation_id,
          property_id,attempt_id,masked_snippet,raw_evidence_encrypted,key_version,reasons,version,history,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,'[]',$13,$14) RETURNING *`,
        [id,caseData.status,caseData.priority,caseData.senderId,caseData.recipientId,caseData.conversationId,
         caseData.propertyId??null,caseData.attemptId,caseData.maskedSnippet,
         caseData.rawEvidenceEncrypted??null,caseData.keyVersion??null,
         JSON.stringify(caseData.reasons),now,now],
      );
      return this.rowToCase(r.rows[0]);
    } finally { client.release(); }
  }

  async findById(caseId: string): Promise<TrustSafetyCase|null> {
    const {rows} = await this.pool.query('SELECT * FROM ts_moderation_cases WHERE id=$1',[caseId]);
    return rows.length ? this.rowToCase(rows[0]) : null;
  }

  async updateCaseStatus(caseId: string, expectedVersion: number,
    action: {actorId:string;reason:string;newStatus:CaseStatus;notes?:string}): Promise<TrustSafetyCase> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const {rows} = await client.query('SELECT * FROM ts_moderation_cases WHERE id=$1 FOR UPDATE',[caseId]);
      if (!rows.length) { await client.query('ROLLBACK'); throw new Error(`Case ${caseId} not found`); }
      const existing = this.rowToCase(rows[0]);
      if (existing.version !== expectedVersion) {
        await client.query('ROLLBACK');
        throw new ConcurrencyConflictError(`Case ${caseId} version mismatch: expected ${expectedVersion}, found ${existing.version}.`);
      }
      const now = new Date().toISOString();
      const reviewerAction: ReviewerAction = {
        actionId: `act_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        actorId: action.actorId, actorRole: 'ADMIN', timestamp: now,
        reason: action.reason, previousStatus: existing.status,
        newStatus: action.newStatus, notes: action.notes,
      };
      const newHistory = [...existing.history, reviewerAction];
      const newVersion = existing.version + 1;
      await client.query('UPDATE ts_moderation_cases SET status=$1,version=$2,history=$3,updated_at=$4 WHERE id=$5',
        [action.newStatus,newVersion,JSON.stringify(newHistory),now,caseId]);
      await client.query('COMMIT');
      return {...existing,status:action.newStatus,version:newVersion,history:newHistory,updatedAt:now};
    } catch(err) { await client.query('ROLLBACK').catch(()=>{}); throw err; }
    finally { client.release(); }
  }

  async listCases(filters?: {status?:CaseStatus;priority?:CasePriority;senderId?:string;propertyId?:string;limit?:number;offset?:number}):
    Promise<{items:TrustSafetyCase[];total:number}> {
    const conds: string[] = []; const params: any[] = []; let i = 1;
    if (filters?.status) { conds.push(`status=$${i++}`); params.push(filters.status); }
    if (filters?.priority) { conds.push(`priority=$${i++}`); params.push(filters.priority); }
    if (filters?.senderId) { conds.push(`sender_id=$${i++}`); params.push(filters.senderId); }
    if (filters?.propertyId) { conds.push(`property_id=$${i++}`); params.push(filters.propertyId); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const limit = filters?.limit??20; const offset = filters?.offset??0;
    const [{rows},{rows:cr}] = await Promise.all([
      this.pool.query(`SELECT * FROM ts_moderation_cases ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,[...params,limit,offset]),
      this.pool.query(`SELECT COUNT(*)::int AS total FROM ts_moderation_cases ${where}`,params),
    ]);
    return {items:rows.map(r=>this.rowToCase(r)),total:cr[0].total};
  }

  async getStats(senderId?: string): Promise<{totalAttempts:number;confirmedBreaches:number;dismissedCases:number;appealedCases:number}> {
    const sf = senderId?`WHERE sender_id=$1`:''; const p = senderId?[senderId]:[];
    const [at,co,di,ap] = await Promise.all([
      this.pool.query(`SELECT COUNT(*)::int AS c FROM ts_moderation_attempts ${sf}`,p),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM ts_moderation_cases WHERE status='CONFIRMED_POLICY_BREACH'${senderId?' AND sender_id=$1':''}`,p),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM ts_moderation_cases WHERE status='DISMISSED'${senderId?' AND sender_id=$1':''}`,p),
      this.pool.query(`SELECT COUNT(*)::int AS c FROM ts_moderation_cases WHERE status='APPEALED'${senderId?' AND sender_id=$1':''}`,p),
    ]);
    return {totalAttempts:at.rows[0].c,confirmedBreaches:co.rows[0].c,dismissedCases:di.rows[0].c,appealedCases:ap.rows[0].c};
  }

  // ITrustSafetyAttemptRepository
  async recordAttempt(attemptData: Omit<TrustSafetyAttempt,'id'|'createdAt'>): Promise<TrustSafetyAttempt> {
    const id = `att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query(
        'SELECT * FROM ts_moderation_attempts WHERE sender_id=$1 AND conversation_id=$2 AND idempotency_key=$3 FOR UPDATE',
        [attemptData.senderId,attemptData.conversationId,attemptData.idempotencyKey]);
      if (existing.rows.length > 0) {
        const ea = this.rowToAttempt(existing.rows[0]);
        if (ea.payloadHash !== attemptData.payloadHash) {
          await client.query('ROLLBACK');
          throw new IdempotencyConflictError(`Key ${attemptData.idempotencyKey} reused with different payload`);
        }
        await client.query('ROLLBACK');
        return ea;
      }
      const r = await client.query(
        `INSERT INTO ts_moderation_attempts (id,idempotency_key,sender_id,conversation_id,payload_hash,
          raw_length,decision,reasons,spans,matched_identifiers,case_id,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [id,attemptData.idempotencyKey,attemptData.senderId,attemptData.conversationId,
         attemptData.payloadHash,attemptData.rawLength,attemptData.decision,
         JSON.stringify(attemptData.reasons),JSON.stringify(attemptData.spans),
         JSON.stringify(attemptData.matchedIdentifiers),attemptData.caseId??null,now]);
      await client.query('COMMIT');
      return this.rowToAttempt(r.rows[0]);
    } catch(err) { await client.query('ROLLBACK').catch(()=>{}); throw err; }
    finally { client.release(); }
  }

  async findAttempt(senderId:string,conversationId:string,idempotencyKey:string): Promise<TrustSafetyAttempt|null> {
    const {rows} = await this.pool.query(
      'SELECT * FROM ts_moderation_attempts WHERE sender_id=$1 AND conversation_id=$2 AND idempotency_key=$3',
      [senderId,conversationId,idempotencyKey]);
    return rows.length ? this.rowToAttempt(rows[0]) : null;
  }

  // IOutboxRepository
  async enqueue(jobType:OutboxJobType,payload:Record<string,any>,maxRetries:number=3): Promise<OutboxJob> {
    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const {rows} = await this.pool.query(
      `INSERT INTO ts_outbox_jobs (id,job_type,payload,status,retry_count,max_retries,created_at,updated_at)
       VALUES ($1,$2,$3,'PENDING',0,$4,$5,$6) RETURNING *`,
      [id,jobType,JSON.stringify(payload),maxRetries,now,now]);
    return this.rowToJob(rows[0]);
  }

  async claimPendingJobs(workerId:string,limit:number,leaseDurationMs:number): Promise<OutboxJob[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const now = new Date();
      const leaseExpires = new Date(now.getTime()+leaseDurationMs).toISOString();
      const {rows} = await client.query(
        `SELECT * FROM ts_outbox_jobs WHERE status='PENDING' OR (status='CLAIMED' AND lease_expires_at<NOW())
         ORDER BY created_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED`,
        [limit]);
      const claimed: OutboxJob[] = [];
      for (const row of rows) {
        const ur = await client.query(
          `UPDATE ts_outbox_jobs SET status='CLAIMED',claimed_by=$1,lease_expires_at=$2,updated_at=$3 WHERE id=$4 RETURNING *`,
          [workerId,leaseExpires,now.toISOString(),row.id]);
        claimed.push(this.rowToJob(ur.rows[0]));
      }
      await client.query('COMMIT');
      return claimed;
    } catch(err) { await client.query('ROLLBACK').catch(()=>{}); throw err; }
    finally { client.release(); }
  }

  async completeJob(jobId:string,workerId:string): Promise<void> {
    const {rowCount} = await this.pool.query(
      `UPDATE ts_outbox_jobs SET status='COMPLETED',claimed_by=NULL,lease_expires_at=NULL,updated_at=NOW()
       WHERE id=$1 AND claimed_by=$2`,[jobId,workerId]);
    if (rowCount===0) throw new Error(`Job ${jobId} not found or not owned by ${workerId}`);
  }

  async failJob(jobId:string,workerId:string,error:string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const {rows} = await client.query(
        'SELECT * FROM ts_outbox_jobs WHERE id=$1 AND claimed_by=$2 FOR UPDATE',[jobId,workerId]);
      if (!rows.length) { await client.query('ROLLBACK'); throw new Error(`Job ${jobId} not found`); }
      const j = rows[0];
      const newRetry = j.retry_count+1;
      const newStatus: OutboxJobStatus = newRetry>=j.max_retries ? 'DEAD_LETTER' : 'PENDING';
      await client.query(
        `UPDATE ts_outbox_jobs SET status=$1,retry_count=$2,last_error=$3,claimed_by=NULL,lease_expires_at=NULL,updated_at=NOW() WHERE id=$4`,
        [newStatus,newRetry,error,jobId]);
      await client.query('COMMIT');
    } catch(err) { await client.query('ROLLBACK').catch(()=>{}); throw err; }
    finally { client.release(); }
  }

  async recoverExpiredLeases(): Promise<number> {
    const {rowCount} = await this.pool.query(
      `UPDATE ts_outbox_jobs SET status='PENDING',claimed_by=NULL,lease_expires_at=NULL,updated_at=NOW()
       WHERE status='CLAIMED' AND lease_expires_at<NOW()`);
    return rowCount??0;
  }

  // ITimelineEventRepository (append-only)
  async appendEvent(data: Omit<TrustSafetyEvent,'eventId'|'ingestedAt'>): Promise<TrustSafetyEvent> {
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const ingestedAt = new Date().toISOString();
    const {rows} = await this.pool.query(
      `INSERT INTO ts_timeline_events (event_id,event_type,actor_id,actor_role,target_entity,target_id,
        correlation_id,payload,occurred_at,ingested_at,version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [eventId,data.eventType,data.actorId,data.actorRole,data.targetEntity,data.targetId,
       data.correlationId,JSON.stringify(data.payload),data.occurredAt,ingestedAt,data.version]);
    return this.rowToEvent(rows[0]);
  }

  async queryEvents(filters:{targetEntity?:string;targetId?:string;actorId?:string;limit?:number}): Promise<TrustSafetyEvent[]> {
    const conds: string[] = []; const params: any[] = []; let i = 1;
    if (filters.targetEntity) { conds.push(`target_entity=$${i++}`); params.push(filters.targetEntity); }
    if (filters.targetId) { conds.push(`target_id=$${i++}`); params.push(filters.targetId); }
    if (filters.actorId) { conds.push(`actor_id=$${i++}`); params.push(filters.actorId); }
    const where = conds.length?`WHERE ${conds.join(' AND ')}`:'';
    params.push(filters.limit??50);
    const {rows} = await this.pool.query(
      `SELECT * FROM ts_timeline_events ${where} ORDER BY occurred_at DESC LIMIT $${i}`,params);
    return rows.map(r=>this.rowToEvent(r));
  }

  // IPolicyRepository
  async getActivePolicy(): Promise<TrustSafetyPolicy> {
    const {rows} = await this.pool.query('SELECT * FROM ts_policies ORDER BY epoch DESC LIMIT 1');
    if (!rows.length) return {...DEFAULT_TRUST_SAFETY_POLICY};
    return {...DEFAULT_TRUST_SAFETY_POLICY,...rows[0].config,epoch:rows[0].epoch,version:rows[0].version};
  }

  async updatePolicy(policy:TrustSafetyPolicy,adminId:string,reason:string): Promise<TrustSafetyPolicy> {
    const current = await this.getActivePolicy();
    const newEpoch = current.epoch+1;
    const updated = {...policy,epoch:newEpoch};
    await this.pool.query(
      'INSERT INTO ts_policies (version,epoch,config,admin_id,reason) VALUES ($1,$2,$3,$4,$5)',
      [updated.version,newEpoch,JSON.stringify(updated),adminId,reason]);
    await this.appendEvent({
      eventType:'POLICY_UPDATED',actorId:adminId,actorRole:'ADMIN',
      targetEntity:'POLICY',targetId:String(updated.version),
      correlationId:`pol_epoch_${newEpoch}`,
      payload:{version:updated.version,epoch:newEpoch,reason},
      occurredAt:new Date().toISOString(),version:newEpoch,
    });
    return updated;
  }

  // Evidence encryption
  encryptEvidence(plainText: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm',this.evidenceKey,iv);
    let enc = cipher.update(plainText,'utf8','hex'); enc += cipher.final('hex');
    return iv.toString('hex')+':'+cipher.getAuthTag().toString('hex')+':'+enc;
  }

  decryptEvidence(cipherPayload: string): string {
    const [ivH,tagH,enc] = cipherPayload.split(':');
    if (!ivH||!tagH||!enc) return '[Error: Corrupt evidence cipher]';
    const decipher = crypto.createDecipheriv('aes-256-gcm',this.evidenceKey,Buffer.from(ivH,'hex'));
    decipher.setAuthTag(Buffer.from(tagH,'hex'));
    let dec = decipher.update(enc,'hex','utf8'); dec += decipher.final('utf8');
    return dec;
  }

  async recordCaseReveal(caseId:string,actorId:string,actorRole:'ADMIN'='ADMIN'): Promise<{action:ReviewerAction;rawEvidence:string}> {
    const existing = await this.findById(caseId);
    if (!existing) throw new Error(`Case ${caseId} not found`);
    const now = new Date().toISOString();
    const actionRecord: ReviewerAction = {
      actionId:`act_reveal_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      actorId,actorRole,timestamp:now,
      reason:'Audited evidence reveal by compliance officer',
      previousStatus:existing.status,newStatus:existing.status,
      notes:'Sensitive contact information unmasked under audit',
    };
    const newHistory = [...existing.history,actionRecord];
    await this.pool.query('UPDATE ts_moderation_cases SET history=$1,updated_at=$2 WHERE id=$3',
      [JSON.stringify(newHistory),now,caseId]);
    await this.appendEvent({
      eventType:'EVIDENCE_REVEALED',actorId,actorRole,targetEntity:'CASE',targetId:caseId,
      correlationId:actionRecord.actionId,payload:{caseId,actorId,timestamp:now},
      occurredAt:now,version:1,
    });
    let rawEvidence = existing.maskedSnippet;
    if (existing.rawEvidenceEncrypted) {
      try { rawEvidence = this.decryptEvidence(existing.rawEvidenceEncrypted); }
      catch(_) { rawEvidence = '[Decryption failed: Key mismatch]'; }
    }
    return {action:actionRecord,rawEvidence};
  }

  // Row mappers
  private rowToCase(r: any): TrustSafetyCase {
    return {id:r.id,status:r.status,priority:r.priority,senderId:r.sender_id,recipientId:r.recipient_id,
      conversationId:r.conversation_id,propertyId:r.property_id??undefined,attemptId:r.attempt_id??'',
      maskedSnippet:r.masked_snippet,rawEvidenceEncrypted:r.raw_evidence_encrypted??undefined,
      keyVersion:r.key_version??undefined,
      reasons:Array.isArray(r.reasons)?r.reasons:JSON.parse(r.reasons??'[]'),
      version:r.version,assignedAdminId:r.assigned_admin_id??undefined,
      history:Array.isArray(r.history)?r.history:JSON.parse(r.history??'[]'),
      createdAt:r.created_at instanceof Date?r.created_at.toISOString():r.created_at,
      updatedAt:r.updated_at instanceof Date?r.updated_at.toISOString():r.updated_at};
  }
  private rowToAttempt(r: any): TrustSafetyAttempt {
    return {id:r.id,idempotencyKey:r.idempotency_key,senderId:r.sender_id,conversationId:r.conversation_id,
      payloadHash:r.payload_hash,rawLength:r.raw_length,decision:r.decision,
      reasons:Array.isArray(r.reasons)?r.reasons:JSON.parse(r.reasons??'[]'),
      spans:Array.isArray(r.spans)?r.spans:JSON.parse(r.spans??'[]'),
      matchedIdentifiers:Array.isArray(r.matched_identifiers)?r.matched_identifiers:JSON.parse(r.matched_identifiers??'[]'),
      caseId:r.case_id??undefined,
      createdAt:r.created_at instanceof Date?r.created_at.toISOString():r.created_at};
  }
  private rowToJob(r: any): OutboxJob {
    return {id:r.id,jobType:r.job_type,payload:typeof r.payload==='object'?r.payload:JSON.parse(r.payload),
      status:r.status,claimedBy:r.claimed_by??undefined,
      leaseExpiresAt:r.lease_expires_at?(r.lease_expires_at instanceof Date?r.lease_expires_at.toISOString():r.lease_expires_at):undefined,
      retryCount:r.retry_count,maxRetries:r.max_retries,lastError:r.last_error??undefined,
      createdAt:r.created_at instanceof Date?r.created_at.toISOString():r.created_at,
      updatedAt:r.updated_at instanceof Date?r.updated_at.toISOString():r.updated_at};
  }
  private rowToEvent(r: any): TrustSafetyEvent {
    return {eventId:r.event_id,eventType:r.event_type,actorId:r.actor_id,actorRole:r.actor_role,
      targetEntity:r.target_entity,targetId:r.target_id,correlationId:r.correlation_id,
      payload:typeof r.payload==='object'?r.payload:JSON.parse(r.payload),
      occurredAt:r.occurred_at instanceof Date?r.occurred_at.toISOString():r.occurred_at,
      ingestedAt:r.ingested_at instanceof Date?r.ingested_at.toISOString():r.ingested_at,
      version:r.version};
  }
}
