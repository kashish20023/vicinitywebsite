import * as crypto from 'crypto';
import {
  CasePriority,
  CaseStatus,
  ConcurrencyConflictError,
  IdempotencyConflictError,
  IOutboxRepository,
  IPolicyRepository,
  ITimelineEventRepository,
  ITrustSafetyAttemptRepository,
  ITrustSafetyCaseRepository,
  OutboxJob,
  OutboxJobStatus,
  OutboxJobType,
  TrustSafetyAttempt,
  TrustSafetyCase,
  ReviewerAction,
  TrustSafetyEvent,
} from './trust-safety-persistence.interfaces.js';
import { TrustSafetyPolicy, DEFAULT_TRUST_SAFETY_POLICY } from '../policy/trust-safety-policy.types.js';

export class InMemoryTrustSafetyRepository
  implements
    ITrustSafetyCaseRepository,
    ITrustSafetyAttemptRepository,
    IOutboxRepository,
    ITimelineEventRepository,
    IPolicyRepository
{
  private cases = new Map<string, TrustSafetyCase>();
  private attempts = new Map<string, TrustSafetyAttempt>(); // key: `${senderId}:${conversationId}:${idempotencyKey}`
  private attemptsById = new Map<string, TrustSafetyAttempt>();
  private outboxJobs = new Map<string, OutboxJob>();
  private events: TrustSafetyEvent[] = [];
  private activePolicy: TrustSafetyPolicy = { ...DEFAULT_TRUST_SAFETY_POLICY };

  // Counter sequences
  private caseSeq = 1;
  private attemptSeq = 1;
  private jobSeq = 1;
  private eventSeq = 1;

  // --- ITrustSafetyCaseRepository ---

  public async createCase(
    data: Omit<TrustSafetyCase, 'id' | 'version' | 'history' | 'createdAt' | 'updatedAt'>,
  ): Promise<TrustSafetyCase> {
    const id = `case_${Date.now()}_${this.caseSeq++}`;
    const now = new Date().toISOString();
    const newCase: TrustSafetyCase = {
      ...data,
      id,
      version: 1,
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    this.cases.set(id, newCase);
    return { ...newCase, history: [...newCase.history] };
  }

  public async findById(caseId: string): Promise<TrustSafetyCase | null> {
    const found = this.cases.get(caseId);
    if (!found) return null;
    return { ...found, history: [...found.history] };
  }

  public async updateCaseStatus(
    caseId: string,
    expectedVersion: number,
    action: {
      actorId: string;
      reason: string;
      newStatus: CaseStatus;
      notes?: string;
    },
  ): Promise<TrustSafetyCase> {
    const existing = this.cases.get(caseId);
    if (!existing) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Optimistic concurrency check (F12)
    if (existing.version !== expectedVersion) {
      throw new ConcurrencyConflictError(
        `Concurrency conflict on case ${caseId}: expected version ${expectedVersion} but current is ${existing.version}`,
      );
    }

    const now = new Date().toISOString();
    const previousStatus = existing.status;
    const actionRecord = {
      actionId: `act_${Date.now()}_${existing.history.length + 1}`,
      actorId: action.actorId,
      actorRole: 'ADMIN' as const,
      timestamp: now,
      reason: action.reason,
      previousStatus,
      newStatus: action.newStatus,
      notes: action.notes,
    };

    const updated: TrustSafetyCase = {
      ...existing,
      status: action.newStatus,
      version: existing.version + 1,
      updatedAt: now,
      history: [...existing.history, actionRecord],
    };

    this.cases.set(caseId, updated);
    return { ...updated, history: [...updated.history] };
  }

  public async listCases(filters?: {
    status?: CaseStatus;
    priority?: CasePriority;
    senderId?: string;
    propertyId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: TrustSafetyCase[]; total: number }> {
    let items = Array.from(this.cases.values());

    if (filters?.status) {
      items = items.filter(c => c.status === filters.status);
    }
    if (filters?.priority) {
      items = items.filter(c => c.priority === filters.priority);
    }
    if (filters?.senderId) {
      items = items.filter(c => c.senderId === filters.senderId);
    }
    if (filters?.propertyId) {
      items = items.filter(c => c.propertyId === filters.propertyId);
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paginated = items.slice(offset, offset + limit).map(c => ({ ...c, history: [...c.history] }));

    return { items: paginated, total };
  }

  public async getStats(senderId?: string): Promise<{
    totalAttempts: number;
    confirmedBreaches: number;
    dismissedCases: number;
    appealedCases: number;
  }> {
    let relevantCases = Array.from(this.cases.values());
    let relevantAttempts = Array.from(this.attemptsById.values());

    if (senderId) {
      relevantCases = relevantCases.filter(c => c.senderId === senderId);
      relevantAttempts = relevantAttempts.filter(a => a.senderId === senderId);
    }

    return {
      totalAttempts: relevantAttempts.length,
      confirmedBreaches: relevantCases.filter(c => c.status === 'CONFIRMED_POLICY_BREACH').length,
      dismissedCases: relevantCases.filter(c => c.status === 'DISMISSED').length,
      appealedCases: relevantCases.filter(c => c.status === 'APPEALED').length,
    };
  }

  // --- ITrustSafetyAttemptRepository ---

  public async recordAttempt(
    data: Omit<TrustSafetyAttempt, 'id' | 'createdAt'>,
  ): Promise<TrustSafetyAttempt> {
    const key = `${data.senderId}:${data.conversationId}:${data.idempotencyKey}`;
    const existing = this.attempts.get(key);

    if (existing) {
      // Idempotency check: same payload returns existing without duplicate side effects
      if (existing.payloadHash === data.payloadHash) {
        return { ...existing };
      }
      // Reusing idempotency key with different payload is a conflict error
      throw new IdempotencyConflictError(
        `Idempotency key ${data.idempotencyKey} was already used with a different message payload`,
      );
    }

    const id = `att_${Date.now()}_${this.attemptSeq++}`;
    const now = new Date().toISOString();
    const newAttempt: TrustSafetyAttempt = {
      ...data,
      id,
      createdAt: now,
    };

    this.attempts.set(key, newAttempt);
    this.attemptsById.set(id, newAttempt);
    return { ...newAttempt };
  }

  public async findAttempt(
    senderId: string,
    conversationId: string,
    idempotencyKey: string,
  ): Promise<TrustSafetyAttempt | null> {
    const key = `${senderId}:${conversationId}:${idempotencyKey}`;
    const found = this.attempts.get(key);
    return found ? { ...found } : null;
  }

  // --- IOutboxRepository ---

  public async enqueue(
    jobType: OutboxJobType,
    payload: Record<string, any>,
    maxRetries: number = 3,
  ): Promise<OutboxJob> {
    const id = `job_${Date.now()}_${this.jobSeq++}`;
    const now = new Date().toISOString();
    const job: OutboxJob = {
      id,
      jobType,
      payload,
      status: 'PENDING',
      retryCount: 0,
      maxRetries,
      createdAt: now,
      updatedAt: now,
    };
    this.outboxJobs.set(id, job);
    return { ...job };
  }

  public async claimPendingJobs(
    workerId: string,
    limit: number,
    leaseDurationMs: number,
  ): Promise<OutboxJob[]> {
    const nowMs = Date.now();
    const now = new Date(nowMs).toISOString();
    const leaseExpires = new Date(nowMs + leaseDurationMs).toISOString();
    const claimed: OutboxJob[] = [];

    for (const job of this.outboxJobs.values()) {
      if (claimed.length >= limit) break;

      const isPending = job.status === 'PENDING';
      const isExpiredLease =
        job.status === 'CLAIMED' &&
        job.leaseExpiresAt &&
        new Date(job.leaseExpiresAt).getTime() < nowMs;

      if (isPending || isExpiredLease) {
        job.status = 'CLAIMED';
        job.claimedBy = workerId;
        job.leaseExpiresAt = leaseExpires;
        job.updatedAt = now;
        claimed.push({ ...job });
      }
    }

    return claimed;
  }

  public async completeJob(jobId: string, workerId: string): Promise<void> {
    const job = this.outboxJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    if (job.claimedBy !== workerId && job.status === 'CLAIMED') {
      throw new Error(`Job ${jobId} is claimed by worker ${job.claimedBy}, not ${workerId}`);
    }

    job.status = 'COMPLETED';
    job.leaseExpiresAt = undefined;
    job.updatedAt = new Date().toISOString();
  }

  public async failJob(
    jobId: string,
    workerId: string,
    error: string,
  ): Promise<void> {
    const job = this.outboxJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.retryCount++;
    job.lastError = error;
    job.updatedAt = new Date().toISOString();
    job.claimedBy = undefined;
    job.leaseExpiresAt = undefined;

    if (job.retryCount >= job.maxRetries) {
      job.status = 'DEAD_LETTER';
    } else {
      job.status = 'PENDING';
    }
  }

  public async recoverExpiredLeases(): Promise<number> {
    const nowMs = Date.now();
    let count = 0;
    for (const job of this.outboxJobs.values()) {
      if (
        job.status === 'CLAIMED' &&
        job.leaseExpiresAt &&
        new Date(job.leaseExpiresAt).getTime() < nowMs
      ) {
        job.status = 'PENDING';
        job.claimedBy = undefined;
        job.leaseExpiresAt = undefined;
        job.updatedAt = new Date().toISOString();
        count++;
      }
    }
    return count;
  }

  // --- ITimelineEventRepository ---

  public async appendEvent(
    data: Omit<TrustSafetyEvent, 'eventId' | 'ingestedAt'>,
  ): Promise<TrustSafetyEvent> {
    const eventId = `evt_${Date.now()}_${this.eventSeq++}`;
    const ingestedAt = new Date().toISOString();
    const event: TrustSafetyEvent = {
      ...data,
      eventId,
      ingestedAt,
    };
    this.events.push(event);
    return { ...event };
  }

  public async queryEvents(filters: {
    targetEntity?: string;
    targetId?: string;
    actorId?: string;
    limit?: number;
  }): Promise<TrustSafetyEvent[]> {
    let list = [...this.events];
    if (filters.targetEntity) {
      list = list.filter(e => e.targetEntity === filters.targetEntity);
    }
    if (filters.targetId) {
      list = list.filter(e => e.targetId === filters.targetId);
    }
    if (filters.actorId) {
      list = list.filter(e => e.actorId === filters.actorId);
    }
    list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    if (filters.limit) {
      list = list.slice(0, filters.limit);
    }
    return list;
  }

  // --- IPolicyRepository ---

  public async getActivePolicy(): Promise<TrustSafetyPolicy> {
    return { ...this.activePolicy };
  }

  public async updatePolicy(
    policy: TrustSafetyPolicy,
    adminId: string,
    reason: string,
  ): Promise<TrustSafetyPolicy> {
    const updated: TrustSafetyPolicy = {
      ...policy,
      epoch: this.activePolicy.epoch + 1,
    };
    this.activePolicy = updated;

    await this.appendEvent({
      eventType: 'POLICY_UPDATED',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetEntity: 'POLICY',
      targetId: String(updated.version),
      correlationId: `pol_${updated.epoch}`,
      payload: { version: updated.version, epoch: updated.epoch, reason },
      occurredAt: new Date().toISOString(),
      version: updated.epoch,
    });

    return { ...this.activePolicy };
  }

  // Helper for tests: reset state
  public clearAll(): void {
    this.cases.clear();
    this.attempts.clear();
    this.attemptsById.clear();
    this.outboxJobs.clear();
    this.events = [];
    this.activePolicy = { ...DEFAULT_TRUST_SAFETY_POLICY };
  }

  private getEvidenceKey(): Buffer {
    const raw = process.env.JWT_SECRET || 'fairbnb_default_evidence_key_32_bytes!';
    return crypto.createHash('sha256').update(raw).digest();
  }

  public encryptEvidence(plainText: string): string {
    const key = this.getEvidenceKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
  }

  public decryptEvidence(cipherPayload: string): string {
    const [ivHex, authTagHex, encrypted] = cipherPayload.split(':');
    if (!ivHex || !authTagHex || !encrypted) return '[Error: Corrupt evidence cipher]';
    const key = this.getEvidenceKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public async recordCaseReveal(
    caseId: string,
    actorId: string,
    actorRole: 'ADMIN' = 'ADMIN',
  ): Promise<{ action: ReviewerAction; rawEvidence: string }> {
    const existing = this.cases.get(caseId);
    if (!existing) {
      throw new Error(`Case ${caseId} not found`);
    }

    const actionRecord: ReviewerAction = {
      actionId: `act_reveal_${Date.now()}_${existing.history.length + 1}`,
      actorId,
      actorRole,
      timestamp: new Date().toISOString(),
      reason: 'Audited evidence reveal by compliance officer',
      previousStatus: existing.status,
      newStatus: existing.status,
      notes: 'Sensitive contact information unmasked under audit',
    };

    existing.history.push(actionRecord);
    existing.updatedAt = actionRecord.timestamp;

    let rawEvidence = existing.maskedSnippet;
    if (existing.rawEvidenceEncrypted) {
      try {
        rawEvidence = this.decryptEvidence(existing.rawEvidenceEncrypted);
      } catch (e) {
        rawEvidence = '[Decryption failed: Key mismatch]';
      }
    }

    return { action: actionRecord, rawEvidence };
  }

}
