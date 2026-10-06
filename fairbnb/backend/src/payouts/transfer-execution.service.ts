import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { FinancialCoordinationService } from './financial-coordination.service.js';
import { CashfreeProvider, ProviderTransferResult } from './providers/cashfree.provider.js';

export interface ExecuteTransfersOptions {
  bookingId: string;
  expectedRevisionNumber: number;
  actorId?: string;
  idempotencyKey?: string;
}

export interface TransferExecutionResult {
  settlementId: string;
  revisionNumber: number;
  overallStatus: 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' | 'UNKNOWN';
  transfers: {
    allocationKey: string;
    recipientRole: string;
    recipientUserId: string | null;
    amountPaise: bigint;
    operationReference: string;
    status: string;
    providerReference?: string;
    failureReason?: string;
  }[];
}

@Injectable()
export class TransferExecutionService {
  private readonly logger = new Logger(TransferExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coordinationService: FinancialCoordinationService,
    private readonly cashfreeProvider: CashfreeProvider,
  ) {}

  /**
   * Orchestrates durable recipient transfer execution for authorized allocations.
   * Enforces reservation before external dispatch, provider calls outside transactions,
   * handling of UNKNOWN/timeouts, and partial success isolation.
   */
  async executeTransfersForSettlement(input: {
    bookingId: string;
    expectedRevisionNumber: number;
    actorId: string;
  }): Promise<{
    settlementId: string;
    bookingId: string;
    revisionNumber?: number;
    status: string;
    overallStatus?: string;
    transfers: any[];
  }> {
    const { bookingId, expectedRevisionNumber, actorId } = input;

    // Check payout disbursement enabled before creating any reservations
    this.cashfreeProvider.guardPayoutsEnabled();

    // STEP 6: Reserve Transfer Intents Under Booking Financial Lock
    // Recheck current revision, authorization, holds, recipient, reserve/claim amount, persist intent.
    const reservedBatch = await this.coordinationService.withBookingFinancialLock(
      bookingId,
      async (tx) => {
        const settlement = await tx.settlement.findUnique({
          where: { bookingId },
          include: {
            booking: { include: { property: true } },
            revisions: {
              where: { revisionNumber: expectedRevisionNumber },
              include: { allocations: true },
            },
            transferIntents: {
              include: { attempts: true },
            },
          },
        });

        if (!settlement) {
          throw new NotFoundException(`Settlement for booking "${bookingId}" not found.`);
        }

        const revision = settlement.revisions[0];
        if (!revision) {
          throw new BadRequestException(
            `Revision #${expectedRevisionNumber} does not exist for settlement "${settlement.id}".`,
          );
        }

        // Check if any transfer intent is in UNKNOWN state
        const unknownIntent = settlement.transferIntents.find(
          (ti) => ti.status === 'UNKNOWN',
        );
        if (unknownIntent) {
          throw new ConflictException(
            `Transfer intent "${unknownIntent.id}" for "${unknownIntent.allocationKey}" is in UNKNOWN state. Reconcile or verify before retrying.`,
          );
        }

        // Must be APPROVED by an admin for this exact revision before any transfer dispatch.
        // PARTIALLY_SETTLED means some already completed; remaining eligibles can retry.
        // READY means calculated but NOT yet admin-authorized → reject.
        if (!['APPROVED', 'PARTIALLY_SETTLED'].includes(settlement.status)) {
          throw new ConflictException(
            `Settlement "${settlement.id}" requires explicit admin authorization before transfer execution ` +
            `(Current status: "${settlement.status}", Holds: [${settlement.holdReasons.join(', ')}]). ` +
            `Use POST /admin/settlements/${bookingId}/authorize first.`,
          );
        }

        // Double-check: the authorized revision must match exactly what we are about to execute.
        // Protects against stale authorization when a refund or refresh created a new revision.
        if (settlement.currentRevisionId && revision.id !== settlement.currentRevisionId) {
          throw new ConflictException(
            `Stale authorization detected: the settlement was authorized for a different revision. ` +
            `The current active revision is not #${expectedRevisionNumber}. ` +
            `Re-authorize the current revision before executing transfers.`,
          );
        }

        // Filter eligible recipient allocations (exclude PLATFORM and TAX accounting components)
        const recipientAllocations = revision.allocations.filter(
          (a) =>
            ['HOST', 'CO_HOST'].includes(a.recipientRole) &&
            a.netEntitledPaise > 0n &&
            ['ELIGIBLE', 'APPROVED'].includes(a.status),
        );

        if (recipientAllocations.length === 0) {
          // Check if all are already paid
          const allPaid = revision.allocations
            .filter((a) => ['HOST', 'CO_HOST'].includes(a.recipientRole))
            .every((a) => a.status === 'PAID');

          if (allPaid) {
            throw new ConflictException(
              `All recipient allocations for revision #${expectedRevisionNumber} have already been paid.`,
            );
          }

          throw new ConflictException(
            `No eligible or approved recipient allocations found for execution in revision #${expectedRevisionNumber}.`,
          );
        }

        const intentsToProcess: any[] = [];

        for (const alloc of recipientAllocations) {
          // Derive deterministic, immutable operation reference
          const opRef = `xfer_${bookingId}_rev${expectedRevisionNumber}_${alloc.allocationKey.replace(/[^a-zA-Z0-9]/g, '_')}`;

          // Check if an intent already exists for this operation reference
          let intent = settlement.transferIntents.find(
            (ti) => ti.operationReference === opRef,
          );

          if (!intent) {
            intent = await tx.payoutTransferIntent.create({
              data: {
                settlementId: settlement.id,
                allocationKey: alloc.allocationKey,
                recipientUserId: alloc.recipientUserId,
                amountPaise: alloc.netEntitledPaise,
                currency: settlement.currency,
                operationReference: opRef,
                status: 'RESERVED',
                provider: this.cashfreeProvider.getEnvironment() === 'MOCK' ? 'MOCK_PROVIDER' : 'CASHFREE',
              },
              include: { attempts: true },
            });
          } else if (intent.status === 'COMPLETED') {
            // Already completed, skip external dispatch
            continue;
          } else if (intent.status === 'UNKNOWN') {
            // In-flight/ambiguous transfer. Cannot initiate a new one until reconciled!
            throw new ConflictException(
              `Transfer intent "${intent.id}" for "${alloc.allocationKey}" is in UNKNOWN state. Reconcile or verify before retrying.`,
            );
          } else if (intent.status === 'FAILED') {
            // Failed earlier, mark RESERVED for a new attempt
            intent = await tx.payoutTransferIntent.update({
              where: { id: intent.id },
              data: { status: 'RESERVED', failureReason: null },
              include: { attempts: true },
            });
          }

          // Mark allocation as PROCESSING
          await tx.settlementAllocation.update({
            where: { id: alloc.id },
            data: { status: 'PROCESSING' },
          });

          intentsToProcess.push({
            intent,
            alloc,
          });
        }

        // Mark settlement as PROCESSING and revision as isExecuted = true
        await tx.settlement.update({
          where: { id: settlement.id },
          data: { status: 'PROCESSING' },
        });

        await tx.settlementRevision.update({
          where: { id: revision.id },
          data: { isExecuted: true },
        });

        return {
          settlementId: settlement.id,
          revisionNumber: expectedRevisionNumber,
          intents: intentsToProcess,
        };
      },
    );

    // STEP 6: Execute Provider Calls OUTSIDE Database Transaction
    const transferResults: any[] = [];

    for (const item of reservedBatch.intents) {
      const { intent, alloc } = item;
      const amountRupees = Number(intent.amountPaise) / 100;
      const attemptNumber = (intent.attempts?.length || 0) + 1;
      const attemptKey = `${intent.operationReference}_att${attemptNumber}`;

      let providerOutcome: ProviderTransferResult;
      try {
        providerOutcome = await this.cashfreeProvider.executeTransfer({
          transferId: attemptKey,
          amount: amountRupees,
          currency: intent.currency,
          beneficiaryId: alloc.recipientUserId || 'UNKNOWN_BENE',
          narration: `FairBnB payout for booking ${bookingId}`,
        });
      } catch (err: any) {
        if (err instanceof ServiceUnavailableException) {
          throw err;
        }
        // Exception during HTTP request is UNKNOWN, never assume failure!
        providerOutcome = {
          status: 'UNKNOWN',
          failureReason: `PROVIDER_EXCEPTION: ${err.message}`,
        };
      }

      // STEP 7: Persist & Reconcile Verified Result Under Lock
      const reconciled = await this.coordinationService.withBookingFinancialLock(
        bookingId,
        async (tx) => {
          const rawResponseWithSim = {
            ...(providerOutcome.rawResponse || {}),
            simulated: Boolean(providerOutcome._simulated),
            isSimulated: Boolean(providerOutcome._simulated),
          };

          // Record attempt
          await tx.payoutTransferAttempt.create({
            data: {
              transferIntentId: intent.id,
              attemptNumber,
              idempotencyKey: attemptKey,
              providerReference: providerOutcome.providerReference,
              status: providerOutcome.status,
              rawResponse: rawResponseWithSim,
            },
          });

          let nextIntentStatus = intent.status;
          let nextAllocStatus = alloc.status;

          if (providerOutcome.status === 'SUCCESS') {
            nextIntentStatus = 'COMPLETED';
            nextAllocStatus = 'PAID';
          } else if (providerOutcome.status === 'FAILED') {
            nextIntentStatus = 'FAILED';
            nextAllocStatus = 'ELIGIBLE'; // Allowed to be retried
          } else if (providerOutcome.status === 'UNKNOWN') {
            nextIntentStatus = 'UNKNOWN';
            nextAllocStatus = 'PROCESSING'; // Stays locked in processing
          }

          const updatedIntent = await tx.payoutTransferIntent.update({
            where: { id: intent.id },
            data: {
              status: nextIntentStatus,
              providerTransferId: providerOutcome.providerReference,
              failureReason: providerOutcome.failureReason,
              providerResponse: rawResponseWithSim,
            },
          });

          await tx.settlementAllocation.update({
            where: { id: alloc.id },
            data: { status: nextAllocStatus },
          });

          // Record FinancialAuditEvent
          await tx.financialAuditEvent.create({
            data: {
              bookingId,
              settlementId: reservedBatch.settlementId,
              eventType:
                providerOutcome.status === 'SUCCESS'
                  ? 'TRANSFER_COMPLETED'
                  : providerOutcome.status === 'FAILED'
                  ? 'TRANSFER_FAILED'
                  : 'TRANSFER_UNKNOWN',
              actorId,
              payload: {
                transferIntentId: intent.id,
                allocationKey: alloc.allocationKey,
                amountPaise: intent.amountPaise.toString(),
                status: nextIntentStatus,
                providerReference: providerOutcome.providerReference,
                failureReason: providerOutcome.failureReason,
                isSimulated: Boolean(providerOutcome._simulated),
              },
            },
          });

          return updatedIntent;
        },
      );

      transferResults.push({
        allocationKey: alloc.allocationKey,
        recipientRole: alloc.recipientRole,
        recipientUserId: alloc.recipientUserId,
        amountPaise: intent.amountPaise,
        operationReference: intent.operationReference,
        status: reconciled.status,
        providerReference: reconciled.providerTransferId || undefined,
        failureReason: reconciled.failureReason || undefined,
        isSimulated: Boolean(providerOutcome._simulated),
      });
    }

    // Determine final overall settlement status
    const allCompleted = transferResults.every((t) => t.status === 'COMPLETED');
    const anyCompleted = transferResults.some((t) => t.status === 'COMPLETED');
    const anyUnknown = transferResults.some((t) => t.status === 'UNKNOWN');
    const allFailed = transferResults.every((t) => t.status === 'FAILED');

    let overallStatus: 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' | 'UNKNOWN' = 'COMPLETED';
    let settlementDbStatus: any = 'SETTLED';

    if (allCompleted) {
      overallStatus = 'COMPLETED';
      settlementDbStatus = 'SETTLED';
    } else if (anyCompleted && !allCompleted) {
      overallStatus = 'PARTIAL_SUCCESS';
      settlementDbStatus = 'PARTIALLY_SETTLED';
    } else if (anyUnknown) {
      overallStatus = 'UNKNOWN';
      settlementDbStatus = 'PROCESSING';
    } else if (allFailed) {
      overallStatus = 'FAILED';
      settlementDbStatus = 'READY'; // Ready for retry
    }

    await this.coordinationService.withBookingFinancialLock(
      bookingId,
      async (tx) => {
        await tx.settlement.update({
          where: { id: reservedBatch.settlementId },
          data: { status: settlementDbStatus },
        });
      },
    );

    return {
      settlementId: reservedBatch.settlementId,
      bookingId,
      revisionNumber: expectedRevisionNumber,
      status: overallStatus,
      overallStatus,
      transfers: transferResults,
    };
  }

  /**
   * Reconciles an in-flight or UNKNOWN transfer intent with provider.
   */
  async reconcileUnknownTransfer(
    bookingId: string,
    transferIntentId: string,
    actorId?: string,
  ): Promise<any> {
    // 1. Fetch intent and verify under coordination lock
    const intent = await this.coordinationService.withBookingFinancialLock(
      bookingId,
      async (tx) => {
        const found = await tx.payoutTransferIntent.findUnique({
          where: { id: transferIntentId },
          include: {
            attempts: { orderBy: { attemptNumber: 'desc' }, take: 1 },
            settlement: {
              include: {
                revisions: {
                  orderBy: { revisionNumber: 'desc' },
                  take: 1,
                  include: { allocations: true },
                },
              },
            },
          },
        });

        if (!found) {
          throw new NotFoundException(
            `Transfer intent "${transferIntentId}" not found for booking "${bookingId}".`,
          );
        }

        return found;
      },
    );

    if (intent.status === 'COMPLETED') {
      return {
        status: 'COMPLETED',
        message: 'Transfer intent is already confirmed COMPLETED.',
        intent,
      };
    }

    // 2. Query provider outside lock
    const latestAttempt = intent.attempts[0];
    const queryKey = latestAttempt?.idempotencyKey || intent.operationReference;
    const providerOutcome =
      await this.cashfreeProvider.getTransferStatus(queryKey);

    // 3. Persist reconciled outcome under lock
    return this.coordinationService.withBookingFinancialLock(
      bookingId,
      async (tx) => {
        const currentIntent = await tx.payoutTransferIntent.findUnique({
          where: { id: transferIntentId },
        });

        if (!currentIntent) {
          throw new NotFoundException('Transfer intent not found during lock');
        }

        let nextIntentStatus = currentIntent.status;
        let nextAllocStatus = 'PROCESSING';

        if (providerOutcome.status === 'SUCCESS') {
          nextIntentStatus = 'COMPLETED';
          nextAllocStatus = 'PAID';
        } else if (providerOutcome.status === 'FAILED') {
          nextIntentStatus = 'FAILED';
          nextAllocStatus = 'ELIGIBLE'; // Retryable
        } else {
          nextIntentStatus = 'UNKNOWN';
          nextAllocStatus = 'PROCESSING';
        }

        const updatedIntent = await tx.payoutTransferIntent.update({
          where: { id: transferIntentId },
          data: {
            status: nextIntentStatus,
            providerTransferId:
              providerOutcome.providerReference ||
              currentIntent.providerTransferId,
            failureReason:
              providerOutcome.failureReason || currentIntent.failureReason,
          },
        });

        // Update corresponding allocation
        const currentRevision = intent.settlement?.revisions[0];
        const matchingAlloc = currentRevision?.allocations.find(
          (a) => a.recipientUserId === currentIntent.recipientUserId,
        );

        if (matchingAlloc) {
          await tx.settlementAllocation.update({
            where: { id: matchingAlloc.id },
            data: { status: nextAllocStatus },
          });
        }

        // Recompute overall settlement status
        const allIntents = await tx.payoutTransferIntent.findMany({
          where: { settlementId: intent.settlementId },
        });

        const allDone = allIntents.every((i) => i.status === 'COMPLETED');
        const anyDone = allIntents.some((i) => i.status === 'COMPLETED');

        let nextSettlementStatus: any = 'PROCESSING';
        if (allDone) nextSettlementStatus = 'SETTLED';
        else if (anyDone) nextSettlementStatus = 'PARTIALLY_SETTLED';
        else if (allIntents.every((i) => i.status === 'FAILED'))
          nextSettlementStatus = 'READY';

        await tx.settlement.update({
          where: { id: intent.settlementId },
          data: { status: nextSettlementStatus },
        });

        // Write FinancialAuditEvent
        await tx.financialAuditEvent.create({
          data: {
            bookingId,
            settlementId: intent.settlementId,
            eventType: 'TRANSFER_RECONCILED',
            actorId,
            payload: {
              transferIntentId,
              previousStatus: currentIntent.status,
              reconciledStatus: nextIntentStatus,
              providerReference: providerOutcome.providerReference,
              failureReason: providerOutcome.failureReason,
            },
          },
        });

        return {
          status: nextIntentStatus,
          providerReference: providerOutcome.providerReference,
          failureReason: providerOutcome.failureReason,
          intent: updatedIntent,
        };
      },
    );
  }
}
