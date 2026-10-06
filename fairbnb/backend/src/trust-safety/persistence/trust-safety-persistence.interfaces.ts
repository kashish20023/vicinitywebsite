import { ModerationDecision, ModerationReasonCode, SpanMapping, TrustSafetyPolicy } from '../policy/trust-safety-policy.types.js';

export type CaseStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'CONFIRMED_POLICY_BREACH'
  | 'DISMISSED'
  | 'APPEALED'
  | 'RESOLVED';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ReviewerAction {
  actionId: string;
  actorId: string;
  actorRole: 'ADMIN';
  timestamp: string;
  reason: string;
  previousStatus: CaseStatus;
  newStatus: CaseStatus;
  notes?: string;
}

export interface TrustSafetyCase {
  id: string;
  status: CaseStatus;
  priority: CasePriority;
  senderId: string;
  recipientId: string;
  conversationId: string;
  propertyId?: string;
  attemptId: string;
  maskedSnippet: string;
  rawEvidenceEncrypted?: string;
  keyVersion?: string;
  reasons: ModerationReasonCode[];
  version: number;
  assignedAdminId?: string;
  history: ReviewerAction[];
  createdAt: string;
  updatedAt: string;
}

export interface TrustSafetyAttempt {
  id: string;
  idempotencyKey: string;
  senderId: string;
  conversationId: string;
  payloadHash: string;
  rawLength: number;
  decision: ModerationDecision;
  reasons: ModerationReasonCode[];
  spans: SpanMapping[];
  matchedIdentifiers: string[];
  caseId?: string;
  createdAt: string;
}

export type OutboxJobType = 'ADMIN_NOTIFICATION' | 'MESSAGE_DELIVERY' | 'TIMELINE_EVENT';
export type OutboxJobStatus = 'PENDING' | 'CLAIMED' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

export interface OutboxJob {
  id: string;
  jobType: OutboxJobType;
  payload: Record<string, any>;
  status: OutboxJobStatus;
  claimedBy?: string;
  leaseExpiresAt?: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustSafetyEvent {
  eventId: string;
  eventType: string;
  actorId: string;
  actorRole: string;
  targetEntity: string;
  targetId: string;
  correlationId: string;
  payload: Record<string, any>;
  occurredAt: string;
  ingestedAt: string;
  version: number;
}

export class ConcurrencyConflictError extends Error {
  constructor(message: string = 'Conflict: Resource has been modified by another transaction') {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

export class IdempotencyConflictError extends Error {
  constructor(message: string = 'Conflict: Idempotency key reused with different payload') {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

export interface ITrustSafetyCaseRepository {
  createCase(caseData: Omit<TrustSafetyCase, 'id' | 'version' | 'history' | 'createdAt' | 'updatedAt'>): Promise<TrustSafetyCase>;
  findById(caseId: string): Promise<TrustSafetyCase | null>;
  updateCaseStatus(
    caseId: string,
    expectedVersion: number,
    action: {
      actorId: string;
      reason: string;
      newStatus: CaseStatus;
      notes?: string;
    },
  ): Promise<TrustSafetyCase>;
  listCases(filters?: {
    status?: CaseStatus;
    priority?: CasePriority;
    senderId?: string;
    propertyId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: TrustSafetyCase[]; total: number }>;
  getStats(senderId?: string): Promise<{
    totalAttempts: number;
    confirmedBreaches: number;
    dismissedCases: number;
    appealedCases: number;
  }>;
}

export interface ITrustSafetyAttemptRepository {
  recordAttempt(attemptData: Omit<TrustSafetyAttempt, 'id' | 'createdAt'>): Promise<TrustSafetyAttempt>;
  findAttempt(senderId: string, conversationId: string, idempotencyKey: string): Promise<TrustSafetyAttempt | null>;
}

export interface IOutboxRepository {
  enqueue(jobType: OutboxJobType, payload: Record<string, any>, maxRetries?: number): Promise<OutboxJob>;
  claimPendingJobs(workerId: string, limit: number, leaseDurationMs: number): Promise<OutboxJob[]>;
  completeJob(jobId: string, workerId: string): Promise<void>;
  failJob(jobId: string, workerId: string, error: string): Promise<void>;
  recoverExpiredLeases(): Promise<number>;
}

export interface ITimelineEventRepository {
  appendEvent(event: Omit<TrustSafetyEvent, 'eventId' | 'ingestedAt'>): Promise<TrustSafetyEvent>;
  queryEvents(filters: {
    targetEntity?: string;
    targetId?: string;
    actorId?: string;
    limit?: number;
  }): Promise<TrustSafetyEvent[]>;
}

export interface IPolicyRepository {
  getActivePolicy(): Promise<TrustSafetyPolicy>;
  updatePolicy(policy: TrustSafetyPolicy, adminId: string, reason: string): Promise<TrustSafetyPolicy>;
}
