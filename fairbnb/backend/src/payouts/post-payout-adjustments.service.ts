import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { FinancialCoordinationService } from './financial-coordination.service.js';

export interface CreatePostPayoutAdjustmentDto {
  bookingId: string;
  sourceEvent: 'REFUND_POST_PAYOUT' | 'CHARGEBACK' | 'REVERSAL' | 'MANUAL_AUDIT';
  sourceReferenceId?: string;
  affectedRecipientUserId: string;
  affectedRecipientRole: 'HOST' | 'CO_HOST' | 'PLATFORM';
  revisedEntitlementPaise: bigint;
  evidenceNotes?: string;
  actorUserId?: string;
  metadata?: any;
}

export interface PayoutAdjustmentRecord {
  id: string;
  settlementId: string;
  sourceEvent: string;
  sourceReferenceId?: string | null;
  originalRevisionId?: string | null;
  affectedRecipientUserId?: string | null;
  affectedRecipientRole: string;
  alreadyPaidPaise: bigint;
  revisedEntitlementPaise: bigint;
  recoveryObligationPaise: bigint;
  status: string;
  evidenceNotes?: string | null;
  createdAt: Date;
}

@Injectable()
export class PostPayoutAdjustmentsService {
  private readonly logger = new Logger(PostPayoutAdjustmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coordinationService: FinancialCoordinationService,
  ) {}

  /**
   * Records an append-only post-payout adjustment when refunds, chargebacks, or reversals
   * occur after recipient transfers have already been executed.
   * Preserves successful transfer history without silent deductions from unrelated bookings.
   */
  async recordPostPayoutAdjustment(
    dto: CreatePostPayoutAdjustmentDto,
    existingTx?: Prisma.TransactionClient,
  ): Promise<PayoutAdjustmentRecord> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const settlement = await tx.settlement.findUnique({
        where: { bookingId: dto.bookingId },
        include: {
            revisions: {
              where: { isExecuted: true },
              orderBy: { revisionNumber: 'desc' },
              include: { allocations: true },
            },
            transferIntents: {
              where: { status: 'COMPLETED' },
            },
          },
        });

        if (!settlement) {
          throw new NotFoundException(
            `Settlement for booking "${dto.bookingId}" not found.`,
          );
        }

        const executedRevision = settlement.revisions[0];
        if (!executedRevision) {
          throw new BadRequestException(
            `No executed revisions found for settlement "${settlement.id}". Use regular settlement revision before payout execution.`,
          );
        }

        // Sum already paid amount for this specific recipient from completed transfer intents
        let alreadyPaidPaise = 0n;
        const recipientTransfers = settlement.transferIntents.filter(
          (ti) => ti.recipientUserId === dto.affectedRecipientUserId,
        );
        for (const ti of recipientTransfers) {
          alreadyPaidPaise += ti.amountPaise;
        }

        // Calculate recovery obligation:
        // If already paid 900,000 paise, and revised entitlement is 600,000 paise -> recovery obligation is 300,000 paise.
        const recoveryObligationPaise =
          alreadyPaidPaise > dto.revisedEntitlementPaise
            ? alreadyPaidPaise - dto.revisedEntitlementPaise
            : 0n;

        const adjustment = await tx.payoutAdjustment.create({
          data: {
            settlementId: settlement.id,
            sourceEvent: dto.sourceEvent,
            sourceReferenceId: dto.sourceReferenceId,
            originalRevisionId: executedRevision.id,
            affectedRecipientUserId: dto.affectedRecipientUserId,
            affectedRecipientRole: dto.affectedRecipientRole,
            alreadyPaidPaise,
            revisedEntitlementPaise: dto.revisedEntitlementPaise,
            recoveryObligationPaise,
            status: 'PENDING',
            actorUserId: dto.actorUserId,
            evidenceNotes: dto.evidenceNotes,
            metadata: dto.metadata,
          },
        });

        // Record FinancialAuditEvent
        await tx.financialAuditEvent.create({
          data: {
            bookingId: dto.bookingId,
            settlementId: settlement.id,
            eventType: 'ADJUSTMENT_RECORDED',
            actorId: dto.actorUserId,
            payload: {
              adjustmentId: adjustment.id,
              sourceEvent: dto.sourceEvent,
              affectedRecipientUserId: dto.affectedRecipientUserId,
              alreadyPaidPaise: alreadyPaidPaise.toString(),
              revisedEntitlementPaise: dto.revisedEntitlementPaise.toString(),
              recoveryObligationPaise: recoveryObligationPaise.toString(),
              evidenceNotes: dto.evidenceNotes,
            },
          },
        });

        return adjustment;
    };

    if (existingTx) {
      return execute(existingTx);
    }

    return this.coordinationService.withBookingFinancialLock(
      dto.bookingId,
      execute,
    );
  }

  /**
   * Queries all adjustments for a booking/settlement.
   */
  async getAdjustmentsForBooking(bookingId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { bookingId },
      include: {
        adjustments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!settlement) {
      return [];
    }

    return settlement.adjustments;
  }
}
