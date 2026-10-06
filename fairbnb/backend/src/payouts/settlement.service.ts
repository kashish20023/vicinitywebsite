import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateSplit } from './split-calculator.js';
import {
  SplitCalculationInput,
  SplitCalculationResult,
} from './split-calculator.types.js';
import { toPaise } from './money.js';
import {
  SettlementStatus,
  SettlementAllocationStatus,
  EligibilityAssessment,
  SettlementPreparationResult,
} from './settlement.types.js';
import { FinancialCoordinationService } from './financial-coordination.service.js';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coordinationService: FinancialCoordinationService,
  ) {}

  /**
   * Prepares or refreshes the settlement for a booking under the per-booking coordination lock.
   * Keeps financial calculation and eligibility evaluation as separate responsibilities.
   */
  async prepareOrRefreshSettlement(
    bookingId: string,
    triggerReason: string = 'MANUAL_OR_EVENT_TRIGGER',
    actorId?: string,
  ): Promise<SettlementPreparationResult> {
    return this.coordinationService.withBookingFinancialLock(
      bookingId,
      async (tx) => {
        // 1. Fetch Authoritative Inputs under lock
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            property: true,
            guest: true,
            payments: true,
            refunds: {
              include: { components: true },
            },
            disputes: true,
            financeSnapshot: true,
            settlement: {
              include: {
                revisions: {
                  orderBy: { revisionNumber: 'desc' },
                  include: { allocations: true },
                },
              },
            },
          },
        });

        if (!booking) {
          throw new NotFoundException(`Booking "${bookingId}" not found.`);
        }

        if (!booking.financeSnapshot) {
          throw new BadRequestException(
            `Booking "${bookingId}" has no immutable financial snapshot. Cannot calculate settlement without immutable snapshot baseline.`,
          );
        }

        const snapshot = booking.financeSnapshot;

        // 2. Sum payments and classify refunds
        const successfulPayments = booking.payments.filter((p) =>
          ['PAID', 'COMPLETED'].includes(p.status),
        );

        let capturedPaise = 0n;
        for (const p of successfulPayments) {
          capturedPaise += toPaise(p.amount);
        }

        const completedRefundsForCalc: any[] = [];
        let inFlightRefundsCount = 0;
        let unreviewedRefundsCount = 0;

        for (const r of booking.refunds) {
          const amountP = r.amountPaise ?? toPaise(r.amount);
          const comp = r.components && r.components.length > 0 ? r.components[0] : null;
          if (r.status === 'COMPLETED') {
            completedRefundsForCalc.push({
              id: r.id,
              amountPaise: amountP,
              accommodationPaise: comp ? comp.accommodationPaise : 0n,
              cleaningPaise: comp ? comp.cleaningPaise : 0n,
              platformPaise: comp ? comp.platformPaise : 0n,
              taxPaise: comp ? comp.taxPaise : 0n,
            });
          } else if (
            ['PENDING', 'PROCESSING'].includes(r.status) ||
            ['RESERVED', 'PENDING_PROVIDER', 'UNKNOWN'].includes(r.reservationStatus)
          ) {
            inFlightRefundsCount++;
          }

          if (r.reviewStatus === 'NEEDS_REVIEW') {
            unreviewedRefundsCount++;
          }
        }

        // 3. Map Co-Host rule terms from snapshot
        let coHostAgreement: any = {
          status: (snapshot.coHostAgreementStatus as any) || 'NONE',
        };
        if (
          snapshot.coHostAgreementStatus === 'AGREED' &&
          snapshot.coHostRecipientUserId &&
          snapshot.coHostRuleType
        ) {
          coHostAgreement = {
            status: 'AGREED',
            recipientUserId: snapshot.coHostRecipientUserId,
            ruleType: snapshot.coHostRuleType as any,
            percentageBps: snapshot.coHostPercentageBps ?? undefined,
            fixedAmountPaise: snapshot.coHostFixedPaise ?? undefined,
          };
        }

        // 4. Run Pure Financial Calculation
        const calcInput: SplitCalculationInput = {
          bookingId: booking.id,
          currency: snapshot.currency,
          basePaise: snapshot.basePaise ?? 0n,
          cleaningPaise: snapshot.cleaningPaise ?? 0n,
          serviceFeePaise: snapshot.serviceFeePaise ?? 0n,
          taxPaise: snapshot.taxPaise ?? 0n,
          discountPaise: snapshot.discountPaise ?? 0n,
          guestTotalPaise: snapshot.guestTotalPaise ?? 0n,
          discountFunding: (snapshot.discountFunding as any) || 'NONE',
          completedRefunds: completedRefundsForCalc,
          coHostAgreement,
        };

        const calcResult: SplitCalculationResult = calculateSplit(calcInput);

        // 5. Run Eligibility Assessment
        const eligibility = this.assessEligibility({
          booking,
          snapshot,
          capturedPaise,
          successfulPayments,
          inFlightRefundsCount,
          unreviewedRefundsCount,
          calcResult,
        });

        // 6. Determine Settlement and Allocation Status
        const holdReasons = [...eligibility.holdReasons];
        if (calcResult.status === 'HELD') {
          for (const diag of calcResult.diagnostics) {
            if (!holdReasons.includes(diag.code)) {
              holdReasons.push(diag.code);
            }
          }
        }

        const settlementStatus: SettlementStatus =
          holdReasons.length === 0 && calcResult.status === 'CALCULATED'
            ? 'READY'
            : 'HELD';

        const allocationStatus: SettlementAllocationStatus =
          settlementStatus === 'READY' ? 'ELIGIBLE' : 'HELD';

        // Extract numbers from calcResult
        let hostNetPaise = 0n;
        let coHostNetPaise = 0n;
        let platformNetPaise = 0n;
        let taxNetPaise = 0n;
        let totalGrossPaise = snapshot.guestTotalPaise ?? 0n;
        let totalRefundedPaise = 0n;
        for (const cr of completedRefundsForCalc) {
          totalRefundedPaise += cr.amountPaise;
        }
        let totalNetPaise = totalGrossPaise > totalRefundedPaise ? totalGrossPaise - totalRefundedPaise : 0n;

        if (calcResult.status === 'CALCULATED') {
          hostNetPaise = calcResult.breakdown.hostAllocationPaise;
          coHostNetPaise = calcResult.breakdown.coHostAllocationPaise;
          platformNetPaise = calcResult.breakdown.platformAllocationPaise;
          taxNetPaise = calcResult.breakdown.taxAllocationPaise;
        } else {
          // In HELD state, derive proposed amounts from snapshot so hold reasons and entitlements remain visible!
          let hostProposed = (snapshot.basePaise ?? 0n) + (snapshot.cleaningPaise ?? 0n);
          let coHostProposed = 0n;
          if (snapshot.coHostAgreementStatus === 'AGREED' && snapshot.coHostPercentageBps) {
            coHostProposed = ((snapshot.basePaise ?? 0n) * snapshot.coHostPercentageBps + 5000n) / 10000n;
            hostProposed = hostProposed > coHostProposed ? hostProposed - coHostProposed : 0n;
          } else if (snapshot.coHostAgreementStatus === 'AGREED' && snapshot.coHostFixedPaise) {
            coHostProposed = snapshot.coHostFixedPaise;
            hostProposed = hostProposed > coHostProposed ? hostProposed - coHostProposed : 0n;
          }
          hostNetPaise = hostProposed;
          coHostNetPaise = coHostProposed;
          platformNetPaise = snapshot.serviceFeePaise ?? 0n;
          taxNetPaise = snapshot.taxPaise ?? 0n;
        }

        // 7. Ensure Parent Settlement exists
        let settlement = booking.settlement;
        if (!settlement) {
          settlement = await tx.settlement.create({
            data: {
              bookingId: booking.id,
              status: settlementStatus,
              holdReasons,
              currency: snapshot.currency,
            },
            include: {
              revisions: {
                orderBy: { revisionNumber: 'desc' },
                include: { allocations: true },
              },
            },
          });
        }

        // 8. Determine Revision Strategy
        const latestRevision =
          settlement.revisions && settlement.revisions.length > 0
            ? settlement.revisions[0]
            : null;

        let shouldCreateNewRevision = true;
        let nextRevisionNumber = 1;

        if (latestRevision) {
          nextRevisionNumber = latestRevision.revisionNumber + 1;
          // If amounts, status, and holds are identical and it is unexecuted, reuse latest revision
          const amountsMatch =
            latestRevision.hostNetPaise === hostNetPaise &&
            latestRevision.coHostNetPaise === coHostNetPaise &&
            latestRevision.platformNetPaise === platformNetPaise &&
            latestRevision.taxNetPaise === taxNetPaise &&
            latestRevision.totalRefundedPaise === totalRefundedPaise;

          if (amountsMatch && !latestRevision.isExecuted) {
            shouldCreateNewRevision = false;
          }
        }

        let activeRevision = latestRevision;

        if (shouldCreateNewRevision) {
          // Prepare allocation list
          const allocationsToCreate: any[] = [];

          // Host Allocation
          allocationsToCreate.push({
            recipientRole: 'HOST',
            recipientUserId: snapshot.hostUserId,
            allocationKey: `HOST:${snapshot.hostUserId}`,
            grossPaise: hostNetPaise,
            refundDeductionPaise: 0n,
            netEntitledPaise: hostNetPaise,
            status: allocationStatus,
            holdReasons: allocationStatus === 'HELD' ? holdReasons : [],
          });

          // Co-Host Allocation (if configured)
          if (snapshot.coHostRecipientUserId && coHostNetPaise > 0n) {
            allocationsToCreate.push({
              recipientRole: 'CO_HOST',
              recipientUserId: snapshot.coHostRecipientUserId,
              allocationKey: `CO_HOST:${snapshot.coHostRecipientUserId}`,
              grossPaise: coHostNetPaise,
              refundDeductionPaise: 0n,
              netEntitledPaise: coHostNetPaise,
              status: allocationStatus,
              holdReasons: allocationStatus === 'HELD' ? holdReasons : [],
            });
          }

          // Platform Allocation (accounting reserve)
          allocationsToCreate.push({
            recipientRole: 'PLATFORM',
            recipientUserId: null,
            allocationKey: 'PLATFORM:SYSTEM',
            grossPaise: platformNetPaise,
            refundDeductionPaise: 0n,
            netEntitledPaise: platformNetPaise,
            status: allocationStatus,
            holdReasons: allocationStatus === 'HELD' ? holdReasons : [],
          });

          // Tax Reserve Allocation (accounting reserve)
          allocationsToCreate.push({
            recipientRole: 'TAX_AUTHORITY',
            recipientUserId: null,
            allocationKey: 'TAX:GST',
            grossPaise: taxNetPaise,
            refundDeductionPaise: 0n,
            netEntitledPaise: taxNetPaise,
            status: allocationStatus,
            holdReasons: allocationStatus === 'HELD' ? holdReasons : [],
          });

          activeRevision = await tx.settlementRevision.create({
            data: {
              settlementId: settlement.id,
              revisionNumber: nextRevisionNumber,
              reason: triggerReason,
              totalGrossPaise,
              totalRefundedPaise,
              totalNetPaise,
              hostNetPaise,
              coHostNetPaise,
              platformNetPaise,
              taxNetPaise,
              isExecuted: false,
              allocations: {
                create: allocationsToCreate,
              },
            },
            include: { allocations: true },
          });

          // Check if a previously APPROVED status is now being superseded by a new revision.
          // Any existing authorization is INVALIDATED because the financial amounts changed.
          const previousStatus = booking.settlement?.status;
          const approvalInvalidated = previousStatus === 'APPROVED' && shouldCreateNewRevision;

          // Update Settlement parent — APPROVED is always downgraded when a new revision replaces it
          await tx.settlement.update({
            where: { id: settlement.id },
            data: {
              currentRevisionId: activeRevision.id,
              status: settlementStatus,
              holdReasons,
            },
          });

          if (approvalInvalidated) {
            // Record approval-invalidation audit event so operators can see what happened
            await tx.financialAuditEvent.create({
              data: {
                bookingId: booking.id,
                settlementId: settlement.id,
                eventType: 'SETTLEMENT_APPROVAL_INVALIDATED',
                actorId,
                payload: {
                  previousRevisionNumber: latestRevision?.revisionNumber,
                  newRevisionNumber: activeRevision.revisionNumber,
                  reason: triggerReason,
                  message:
                    'A new financial revision was created after approval. ' +
                    'The previous authorization is no longer valid. Re-authorize the current revision.',
                },
              },
            });
          }

          // Record FinancialAuditEvent
          await tx.financialAuditEvent.create({
            data: {
              bookingId: booking.id,
              settlementId: settlement.id,
              eventType:
                settlementStatus === 'READY'
                  ? 'SETTLEMENT_READY'
                  : 'SETTLEMENT_HELD',
              actorId,
              payload: {
                revisionNumber: activeRevision.revisionNumber,
                status: settlementStatus,
                holdReasons,
                hostNetPaise: hostNetPaise.toString(),
                coHostNetPaise: coHostNetPaise.toString(),
                platformNetPaise: platformNetPaise.toString(),
                taxNetPaise: taxNetPaise.toString(),
                triggerReason,
              },
            },
          });
        } else if (activeRevision) {
          // No new revision: update existing parent status if holds or amounts changed.
          // If previous status was APPROVED but amounts haven't changed (same revision), keep APPROVED.
          await tx.settlement.update({
            where: { id: settlement.id },
            data: {
              status: settlementStatus,
              holdReasons,
            },
          });
        }

        return {
          settlementId: settlement.id,
          bookingId: booking.id,
          status: settlementStatus,
          holdReasons,
          revisionNumber: activeRevision?.revisionNumber ?? 1,
          revisionId: activeRevision?.id ?? '',
          isNewRevision: shouldCreateNewRevision,
          totalGrossPaise,
          totalRefundedPaise,
          totalNetPaise,
          hostNetPaise,
          coHostNetPaise,
          platformNetPaise,
          taxNetPaise,
          allocations: (activeRevision?.allocations ?? []).map((a: any) => ({
            allocationKey: a.allocationKey,
            recipientRole: a.recipientRole,
            recipientUserId: a.recipientUserId,
            grossPaise: a.grossPaise,
            refundDeductionPaise: a.refundDeductionPaise,
            netEntitledPaise: a.netEntitledPaise,
            status: a.status as SettlementAllocationStatus,
            holdReasons: a.holdReasons,
          })),
        };
      },
    );
  }

  /**
   * Assesses business and technical eligibility rules for settlement execution.
   */
  private assessEligibility(ctx: {
    booking: any;
    snapshot: any;
    capturedPaise: bigint;
    successfulPayments: any[];
    inFlightRefundsCount: number;
    unreviewedRefundsCount: number;
    calcResult: SplitCalculationResult;
  }): EligibilityAssessment {
    const holdReasons: string[] = [];
    const details: Record<string, any> = {};

    // 1. Complete/reviewed snapshot
    if (ctx.snapshot.reviewStatus !== 'VALID') {
      holdReasons.push('SNAPSHOT_NEEDS_REVIEW');
      details.snapshotReviewStatus = ctx.snapshot.reviewStatus;
      details.snapshotReviewReasons = ctx.snapshot.reviewReasons;
    }

    // 2. Approved policy version
    if (ctx.snapshot.policyVersion === 'UNRESOLVED') {
      holdReasons.push('UNAPPROVED_POLICY_VERSION');
    }

    // 3. Supported booking state and payout timing
    // Payouts are eligible only once the stay is COMPLETED or CANCELLED with retained funds
    if (!['COMPLETED', 'CANCELLED'].includes(ctx.booking.status)) {
      holdReasons.push('BOOKING_NOT_COMPLETED');
      details.bookingStatus = ctx.booking.status;
    }

    // 4. Verified capture amount & currency
    const expectedPaise = ctx.snapshot.guestTotalPaise ?? 0n;
    if (ctx.capturedPaise !== expectedPaise) {
      holdReasons.push('CAPTURE_AMOUNT_MISMATCH');
      details.capturedPaise = ctx.capturedPaise;
      details.expectedPaise = expectedPaise;
    }

    if (ctx.successfulPayments.length > 1) {
      // Multiple successful captures require manual reconciliation
      holdReasons.push('MULTIPLE_CAPTURES_DETECTED');
      details.paymentCount = ctx.successfulPayments.length;
    }

    // 5. Mock payment provider restriction
    const isStrictLive =
      process.env.NODE_ENV === 'production' ||
      process.env.PAYOUT_STRICT_MODE === 'true';

    const hasMockPayment = ctx.successfulPayments.some((p) =>
      p.provider.toUpperCase().includes('MOCK'),
    );

    if (isStrictLive && hasMockPayment) {
      holdReasons.push('MOCK_PAYMENT_NOT_LIVE_ELIGIBLE');
    }

    // 6. In-flight and unreviewed refunds
    if (ctx.inFlightRefundsCount > 0) {
      holdReasons.push('IN_FLIGHT_REFUND_HOLD');
      details.inFlightRefundsCount = ctx.inFlightRefundsCount;
    }

    if (ctx.unreviewedRefundsCount > 0) {
      holdReasons.push('REFUND_NEEDS_REVIEW');
      details.unreviewedRefundsCount = ctx.unreviewedRefundsCount;
    }

    // 7. Active disputes
    const openDisputes = (ctx.booking.disputes || []).filter((d: any) =>
      ['OPEN', 'UNDER_REVIEW', 'PENDING'].includes(d.status),
    );
    if (openDisputes.length > 0) {
      holdReasons.push('ACTIVE_DISPUTE_HOLD');
      details.openDisputeIds = openDisputes.map((d: any) => d.id);
    }

    // 8. Cancelled booking with retained funds requires explicit entitlement policy
    if (ctx.booking.status === 'CANCELLED') {
      const completedRefundPaise =
        ctx.calcResult.status === 'CALCULATED'
          ? ctx.calcResult.breakdown.totalRefundedPaise
          : 0n;
      const retainedPaise = expectedPaise > completedRefundPaise ? expectedPaise - completedRefundPaise : 0n;
      if (retainedPaise > 0n) {
        // Until an explicit cancellation retained-funds split policy is recorded, hold for review
        holdReasons.push('CANCELLED_BOOKING_POLICY_REVIEW');
        details.retainedPaise = retainedPaise;
      }
    }

    return {
      isEligible: holdReasons.length === 0,
      holdReasons,
      details,
    };
  }

  /**
   * Bounded recovery of pending settlements after crash or missed events.
   * Runs automatically every 10 minutes to recover any unhandled settlements.
   * Does NOT disburse money automatically.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async recoverPendingSettlements(limit: number = 50): Promise<number> {
    const candidates = await this.prisma.booking.findMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED'] },
        OR: [
          { settlement: null },
          { settlement: { status: 'PENDING' } },
        ],
      },
      take: limit,
      select: { id: true },
    });

    let recovered = 0;
    for (const c of candidates) {
      try {
        await this.prepareOrRefreshSettlement(
          c.id,
          'CRASH_OR_MISSED_SETTLEMENT_RECOVERY',
        );
        recovered++;
      } catch (err: any) {
        // Log individual recovery failure without crashing the batch
        console.error(`Recovery failed for booking "${c.id}":`, err.message);
      }
    }

    return recovered;
  }
}
