import { SplitMessageDetector } from './split-message/split-message-detector.js';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { DeterministicPhoneDetector, AuthoritativeContext } from './detection/phone-detector.js';
import {
  ModerationEvaluationResult,
  TrustSafetyPolicy,
  DEFAULT_TRUST_SAFETY_POLICY,
  ModerationDecision,
} from './policy/trust-safety-policy.types.js';
import {
  CasePriority,
  CaseStatus,
  ConcurrencyConflictError,
  IdempotencyConflictError,
  OutboxJob,
  TrustSafetyAttempt,
  TrustSafetyCase,
  TrustSafetyEvent,
} from './persistence/trust-safety-persistence.interfaces.js';
import { InMemoryTrustSafetyRepository } from './persistence/in-memory-trust-safety.repository.js';

export interface SubmissionParams {
  idempotencyKey: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  propertyId?: string;
  content: string;
  context?: AuthoritativeContext;
}

export interface SubmissionResult {
  decision: ModerationDecision;
  attemptId: string;
  reasons: string[];
  requiresHumanReview: boolean;
  caseId?: string;
  isDuplicate?: boolean;
}

@Injectable()
export class TrustSafetyService {
  private readonly logger = new Logger(TrustSafetyService.name);
  private readonly repository: InMemoryTrustSafetyRepository;

  constructor() {
    this.repository = new InMemoryTrustSafetyRepository();
  }

  /**
   * Directly accesses the repository for test harness and module configuration.
   */
  public getRepository(): InMemoryTrustSafetyRepository {
    return this.repository;
  }

  /**
   * Main submission processor implementing atomicity, idempotency, detection,
   * case creation, outbox queuing, and timeline recording.
   */
  public async processSubmission(params: SubmissionParams): Promise<SubmissionResult> {
    const { idempotencyKey, senderId, recipientId, conversationId, propertyId, content, context } = params;

    // 1. Compute deterministic hash of payload
    const payloadHash = crypto.createHash('sha256').update(content || '').digest('hex');

    // 2. Check existing attempt for strict idempotency
    const existing = await this.repository.findAttempt(senderId, conversationId, idempotencyKey);
    if (existing) {
      if (existing.payloadHash === payloadHash) {
        this.logger.log(`Idempotent duplicate request detected for key ${idempotencyKey}. Returning existing result.`);
        return {
          decision: existing.decision,
          attemptId: existing.id,
          reasons: existing.reasons,
          requiresHumanReview: existing.decision === 'HOLD',
          caseId: existing.caseId,
          isDuplicate: true,
        };
      }
      throw new IdempotencyConflictError(
        `Idempotency key ${idempotencyKey} was already submitted with different content.`,
      );
    }

    // 3. Evaluate content under active policy
    const activePolicy = await this.repository.getActivePolicy();
    const evaluation = await SplitMessageDetector.evaluateWithHistory(senderId, conversationId, content, context, activePolicy);

    // 4. Case creation for BLOCK / HOLD
    let createdCaseId: string | undefined;
    if (evaluation.decision === 'BLOCK' || evaluation.decision === 'HOLD') {
      const maskedSnippet = this.maskContentSnippet(content);
      const prio: CasePriority = evaluation.decision === 'BLOCK' ? 'HIGH' : 'MEDIUM';

      const createdCase = await this.repository.createCase({
        status: 'OPEN',
        priority: prio,
        senderId,
        recipientId,
        conversationId,
        propertyId,
        attemptId: '', // updated right after
        maskedSnippet,
        reasons: evaluation.reasons,
        rawEvidenceEncrypted: this.repository.encryptEvidence(content),
        keyVersion: 'v1',
      });

      createdCaseId = createdCase.id;

      // 5. Enqueue durable admin notification outbox job
      await this.repository.enqueue('ADMIN_NOTIFICATION', {
        caseId: createdCase.id,
        senderId,
        conversationId,
        reasons: evaluation.reasons,
        maskedSnippet,
        timestamp: new Date().toISOString(),
      });

      // 6. Append audit timeline event
      await this.repository.appendEvent({
        eventType: `MESSAGE_MODERATED_${evaluation.decision}`,
        actorId: senderId,
        actorRole: context?.senderRole || 'GUEST',
        targetEntity: 'CONVERSATION',
        targetId: conversationId,
        correlationId: idempotencyKey,
        payload: {
          caseId: createdCase.id,
          decision: evaluation.decision,
          reasons: evaluation.reasons,
          evaluationTimeMs: evaluation.evaluationTimeMs,
        },
        occurredAt: new Date().toISOString(),
        version: 1,
      });
    } else {
      // Decision is ALLOW: Enqueue message delivery outbox job
      await this.repository.enqueue('MESSAGE_DELIVERY', {
        senderId,
        recipientId,
        conversationId,
        idempotencyKey,
        payloadHash,
        timestamp: new Date().toISOString(),
      });

      await this.repository.appendEvent({
        eventType: 'MESSAGE_MODERATED_ALLOW',
        actorId: senderId,
        actorRole: context?.senderRole || 'GUEST',
        targetEntity: 'CONVERSATION',
        targetId: conversationId,
        correlationId: idempotencyKey,
        payload: {
          decision: 'ALLOW',
          evaluationTimeMs: evaluation.evaluationTimeMs,
        },
        occurredAt: new Date().toISOString(),
        version: 1,
      });
    }

    // 7. Persist moderation attempt
    const attempt = await this.repository.recordAttempt({
      idempotencyKey,
      senderId,
      conversationId,
      payloadHash,
      rawLength: content.length,
      decision: evaluation.decision,
      reasons: evaluation.reasons,
      spans: evaluation.spans,
      matchedIdentifiers: evaluation.matchedIdentifiers,
      caseId: createdCaseId,
    });

    return {
      decision: evaluation.decision,
      attemptId: attempt.id,
      reasons: evaluation.reasons,
      requiresHumanReview: evaluation.requiresHumanReview,
      caseId: createdCaseId,
      isDuplicate: false,
    };
  }

  // --- Case Management ---

  public async getCaseById(caseId: string): Promise<TrustSafetyCase | null> {
    return this.repository.findById(caseId);
  }

  public async listCases(filters?: {
    status?: CaseStatus;
    priority?: CasePriority;
    senderId?: string;
    propertyId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: TrustSafetyCase[]; total: number }> {
    return this.repository.listCases(filters);
  }

  public async reviewCase(
    caseId: string,
    expectedVersion: number,
    action: {
      actorId: string;
      reason: string;
      newStatus: CaseStatus;
      notes?: string;
    },
  ): Promise<TrustSafetyCase> {
    const updated = await this.repository.updateCaseStatus(caseId, expectedVersion, action);

    // Append review timeline event
    await this.repository.appendEvent({
      eventType: `CASE_REVIEW_${action.newStatus}`,
      actorId: action.actorId,
      actorRole: 'ADMIN',
      targetEntity: 'CASE',
      targetId: caseId,
      correlationId: `act_${Date.now()}`,
      payload: {
        newStatus: action.newStatus,
        reason: action.reason,
        notes: action.notes,
        version: updated.version,
      },
      occurredAt: new Date().toISOString(),
      version: updated.version,
    });

    return updated;
  }

  public async getUserStats(userId: string) {
    return this.repository.getStats(userId);
  }

  // --- Outbox Processor ---

  public async processOutboxBatch(
    workerId: string,
    limit: number = 10,
    leaseDurationMs: number = 5000,
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    const jobs = await this.repository.claimPendingJobs(workerId, limit, leaseDurationMs);
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        // Execute job dispatch
        await this.executeJobDispatch(job);
        await this.repository.completeJob(job.id, workerId);
        succeeded++;
      } catch (err: any) {
        await this.repository.failJob(job.id, workerId, err?.message || 'Unknown job failure');
        failed++;
      }
    }

    return { processed: jobs.length, succeeded, failed };
  }

  public async recoverExpiredLeases(): Promise<number> {
    return this.repository.recoverExpiredLeases();
  }

  private async executeJobDispatch(job: OutboxJob): Promise<void> {
    // In production, dispatches to internal admin notification service or socket
    this.logger.log(`Dispatched outbox job ${job.id} of type ${job.jobType}`);
  }

  private maskContentSnippet(content: string): string {
    if (!content) return '';
    // Mask potential phone numbers in snippet preview
    let masked = content.replace(/\b[0-9]{5,15}\b/g, (match) => {
      if (match.length <= 4) return match;
      return match.substring(0, 2) + '****' + match.substring(match.length - 2);
    });
    if (masked.length > 200) {
      masked = masked.substring(0, 197) + '...';
    }
    return masked;
  }

  public async revealCaseEvidence(
    caseId: string,
    actorId: string,
    actorRole: 'ADMIN' = 'ADMIN',
  ): Promise<{ action: any; rawEvidence: string }> {
    const result = await this.repository.recordCaseReveal(caseId, actorId, actorRole);

    // Append reveal timeline event
    await this.repository.appendEvent({
      eventType: 'CASE_EVIDENCE_REVEALED',
      actorId,
      actorRole,
      targetEntity: 'CASE',
      targetId: caseId,
      correlationId: result.action.actionId,
      payload: {
        actionId: result.action.actionId,
        actorId,
        reason: result.action.reason,
        timestamp: result.action.timestamp,
      },
      occurredAt: result.action.timestamp,
      version: 1,
    });

    return result;
  }

}
