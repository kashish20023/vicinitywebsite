import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SettlementService } from './settlement.service.js';
import { TransferExecutionService } from './transfer-execution.service.js';
import { PostPayoutAdjustmentsService } from './post-payout-adjustments.service.js';
import { FinancialCoordinationService } from './financial-coordination.service.js';
import { CashfreeProvider } from './providers/cashfree.provider.js';

/**
 * Recursively converts BigInt fields to strings for safe JSON serialization.
 */
export function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInts);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeBigInts(obj[key]);
    }
    return res;
  }
  return obj;
}

@Controller('admin/settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSettlementController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settlementService: SettlementService,
    private readonly transferExecutionService: TransferExecutionService,
    private readonly adjustmentsService: PostPayoutAdjustmentsService,
    private readonly coordinationService: FinancialCoordinationService,
  ) {}

  @Get()
  async listSettlements(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [total, settlements] = await Promise.all([
      this.prisma.settlement.count({ where }),
      this.prisma.settlement.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              checkIn: true,
              checkOut: true,
              property: { select: { id: true, title: true, hostId: true } },
            },
          },
          revisions: {
            orderBy: { revisionNumber: 'desc' },
            take: 1,
            include: { allocations: true },
          },
        },
      }),
    ]);

    return serializeBigInts({
      data: settlements,
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  }

  @Get(':bookingId')
  async getSettlementDetails(@Param('bookingId') bookingId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            property: true,
            guest: { select: { id: true, name: true, email: true, phone: true } },
            financeSnapshot: true,
            payments: true,
            refunds: { include: { components: true } },
          },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: { allocations: true },
        },
        transferIntents: {
          include: { attempts: true },
          orderBy: { createdAt: 'desc' },
        },
        adjustments: {
          orderBy: { createdAt: 'desc' },
        },
        auditEvents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException(`Settlement for booking "${bookingId}" not found.`);
    }

    const enrichedSettlement = {
      ...settlement,
      transferIntents: (settlement.transferIntents || []).map((ti: any) => ({
        ...ti,
        isSimulated:
          ti.provider === 'MOCK_PROVIDER' ||
          ti.provider === 'SIMULATED_MOCK' ||
          Boolean((ti.providerResponse as any)?.simulated) ||
          Boolean((ti.providerResponse as any)?.isSimulated),
      })),
    };

    return serializeBigInts(enrichedSettlement);
  }

  @Post(':bookingId/refresh')
  async refreshSettlement(
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
    @CurrentUser() adminUser: any,
  ) {
    const result = await this.settlementService.prepareOrRefreshSettlement(
      bookingId,
      body.reason || 'ADMIN_REFRESH',
      adminUser?.id,
    );
    return serializeBigInts(result);
  }

  @Post(':bookingId/authorize')
  async authorizeSettlement(
    @Param('bookingId') bookingId: string,
    @Body() body: { revisionNumber: number },
    @CurrentUser() adminUser: any,
  ) {
    if (!body.revisionNumber) {
      throw new BadRequestException('revisionNumber is required for explicit authorization.');
    }

    // Run INSIDE the per-booking financial lock to prevent concurrent settlement refresh
    // or refund processing from changing amounts under us between our read and our write.
    return this.coordinationService.withBookingFinancialLock(bookingId, async (tx) => {
      const settlement = await tx.settlement.findUnique({
        where: { bookingId },
        include: {
          revisions: {
            where: { revisionNumber: body.revisionNumber },
            include: { allocations: true },
          },
        },
      });

      if (!settlement) {
        throw new NotFoundException(`Settlement for booking "${bookingId}" not found.`);
      }

      const revision = settlement.revisions[0];
      if (!revision) {
        throw new NotFoundException(`Revision #${body.revisionNumber} not found.`);
      }

      // Only READY settlements may be authorized. HELD means unresolved conditions exist.
      // APPROVED means already authorized (idempotent re-authorization of the same revision is ok).
      if (!['READY', 'APPROVED'].includes(settlement.status)) {
        throw new BadRequestException(
          `Cannot authorize settlement in status "${settlement.status}" with active holds: [${settlement.holdReasons.join(', ')}].`,
        );
      }

      // Verify this is the CURRENT revision — not a superseded one.
      // If a new revision was created after a previous authorization, currentRevisionId will differ.
      if (settlement.currentRevisionId && revision.id !== settlement.currentRevisionId) {
        throw new BadRequestException(
          `Revision #${body.revisionNumber} is not the current active revision. ` +
          `A newer revision exists. Re-prepare the settlement and authorize the current revision.`,
        );
      }

      // Bind approval strictly to this revision's allocations
      await tx.settlement.update({
        where: { id: settlement.id },
        data: { status: 'APPROVED' },
      });

      await tx.settlementAllocation.updateMany({
        where: { revisionId: revision.id, status: 'ELIGIBLE' },
        data: { status: 'APPROVED' },
      });

      await tx.financialAuditEvent.create({
        data: {
          bookingId,
          settlementId: settlement.id,
          eventType: 'SETTLEMENT_APPROVED',
          actorId: adminUser?.id,
          payload: {
            authorizedRevisionNumber: body.revisionNumber,
            revisionId: revision.id,
          },
        },
      });

      return {
        success: true,
        message: `Settlement for booking "${bookingId}" revision #${body.revisionNumber} authorized for transfer execution.`,
      };
    });
  }

  @Post(':bookingId/execute')
  async executeTransfers(
    @Param('bookingId') bookingId: string,
    @Body() body: { revisionNumber: number },
    @CurrentUser() adminUser: any,
  ) {
    if (!body.revisionNumber) {
      throw new BadRequestException('revisionNumber is required.');
    }

    const result = await this.transferExecutionService.executeTransfersForSettlement({
      bookingId,
      expectedRevisionNumber: body.revisionNumber,
      actorId: adminUser?.id,
    });

    return serializeBigInts(result);
  }

  @Get(':bookingId/adjustments')
  async getAdjustments(@Param('bookingId') bookingId: string) {
    const adjustments = await this.adjustmentsService.getAdjustmentsForBooking(bookingId);
    return serializeBigInts(adjustments);
  }

  @Post(':bookingId/reconcile')
  async reconcileTransfer(
    @Param('bookingId') bookingId: string,
    @Body() body: { transferIntentId: string },
    @CurrentUser() adminUser: any,
  ) {
    if (!body?.transferIntentId) {
      throw new BadRequestException('transferIntentId is required');
    }
    const result = await this.transferExecutionService.reconcileUnknownTransfer(
      bookingId,
      body.transferIntentId,
      adminUser?.id,
    );
    return serializeBigInts(result);
  }

  @Post(':bookingId/refund')
  async refundWithBreakdown(
    @Param('bookingId') bookingId: string,
    @Body()
    body: {
      accommodationRefundPaise: string | number;
      cleaningRefundPaise?: string | number;
      platformFeeRefundPaise?: string | number;
      taxRefundPaise?: string | number;
      reason?: string;
    },
    @CurrentUser() adminUser: any,
  ) {
    const accommodationRefundPaise = BigInt(body.accommodationRefundPaise || 0);
    const cleaningRefundPaise = BigInt(body.cleaningRefundPaise || 0);
    const platformFeeRefundPaise = BigInt(body.platformFeeRefundPaise || 0);
    const taxRefundPaise = BigInt(body.taxRefundPaise || 0);
    const totalPaise =
      accommodationRefundPaise +
      cleaningRefundPaise +
      platformFeeRefundPaise +
      taxRefundPaise;

    if (totalPaise <= 0n) {
      throw new BadRequestException(
        'Refund total paise must be greater than zero',
      );
    }

    const reservation = await this.coordinationService.withBookingFinancialLock(
      bookingId,
      async (tx) => {
        return this.coordinationService.reserveRefund(tx, {
          bookingId,
          amountPaise: totalPaise,
          operationReference: `ref_admin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          reason: body.reason || 'Admin component-based refund',
          processedById: adminUser?.id,
          breakdown: {
            accommodationPaise: accommodationRefundPaise,
            cleaningPaise: cleaningRefundPaise,
            platformPaise: platformFeeRefundPaise,
            taxPaise: taxRefundPaise,
          },
        });
      },
    );

    // Automatically refresh settlement to calculate revised split or generate post-payout adjustments
    const settlementResult =
      await this.settlementService.prepareOrRefreshSettlement(
        bookingId,
        'ADMIN_COMPONENT_REFUND',
        adminUser?.id,
      );

    return serializeBigInts({
      reservation,
      settlementResult,
    });
  }
}

@Controller(['payouts/cashfree', 'payouts'])
export class CashfreeWebhookController {
  constructor(
    private readonly cashfreeProvider: CashfreeProvider,
    private readonly prisma: PrismaService,
    private readonly coordinationService: FinancialCoordinationService,
    private readonly adjustmentsService: PostPayoutAdjustmentsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handlePayoutWebhook(@Body() payload: any) {
    // 1. Strictly verify Cashfree Payouts Webhook V1 signature (POST parameter contract)
    if (!this.cashfreeProvider.verifyPayoutWebhookV1Signature(payload)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventType = payload.event || payload.type || payload.event_type;
    const transferId =
      payload.transferId || payload.transfer_id || payload.referenceId;

    if (!transferId) {
      return { success: true, message: 'Acknowledged (no transferId)' };
    }

    // Find transfer intent matching operationReference or attempt idempotencyKey
    const intent = await this.prisma.payoutTransferIntent.findFirst({
      where: {
        OR: [
          { operationReference: transferId },
          { attempts: { some: { idempotencyKey: transferId } } },
        ],
      },
      include: { settlement: true },
    });

    if (!intent) {
      return { success: true, message: 'Transfer intent not found in records' };
    }

    // Reconcile according to Cashfree Payouts Webhook V1 confirmation semantics under financial coordination lock
    await this.coordinationService.withBookingFinancialLock(
      intent.settlement.bookingId,
      async (tx) => {
        const currentIntent = await tx.payoutTransferIntent.findUnique({
          where: { id: intent.id },
        });
        if (!currentIntent) return;

        let nextIntentStatus = currentIntent.status;
        let nextAllocStatus = 'PROCESSING';
        let shouldUpdateAlloc = false;

        const isSuccessEvent = eventType === 'TRANSFER_SUCCESS';
        const isAckEvent = eventType === 'TRANSFER_ACKNOWLEDGED';
        const isReversedEvent = eventType === 'TRANSFER_REVERSED';
        const isFailedEvent =
          eventType === 'TRANSFER_FAILED' || eventType === 'TRANSFER_REJECTED';

        const ackRaw = payload.acknowledged;
        const isFullyAcknowledged =
          isAckEvent ||
          (isSuccessEvent &&
            (ackRaw === 1 || ackRaw === '1' || ackRaw === true));
        const isDebitOnlySuccess =
          isSuccessEvent && (ackRaw === 0 || ackRaw === '0');

        if (isFullyAcknowledged) {
          // Terminal confirmation: Beneficiary bank deposited the money
          // Ensure idempotency: only update from non-completed state
          if (currentIntent.status !== 'COMPLETED') {
            nextIntentStatus = 'COMPLETED';
            nextAllocStatus = 'PAID';
            shouldUpdateAlloc = true;
          }
        } else if (isDebitOnlySuccess) {
          // Debit succeeded on remitter side, but beneficiary credit has NOT yet been confirmed by beneficiary bank!
          // Must NOT mark as final COMPLETED or PAID!
          if (currentIntent.status !== 'COMPLETED') {
            nextIntentStatus =
              currentIntent.status === 'RESERVED'
                ? 'SUBMITTED'
                : currentIntent.status;
            nextAllocStatus = 'PROCESSING';
            shouldUpdateAlloc = true;
          }
        } else if (isFailedEvent) {
          if (currentIntent.status !== 'COMPLETED') {
            nextIntentStatus = 'FAILED';
            nextAllocStatus = 'ELIGIBLE';
            shouldUpdateAlloc = true;
          }
        } else if (isReversedEvent) {
          // Beneficiary bank reversed the transfer after initial debit
          nextIntentStatus = 'FAILED';
          nextAllocStatus = 'REVERSED';
          shouldUpdateAlloc = true;

          // Post-payout reversal adjustment
          const recipientRole: 'HOST' | 'CO_HOST' =
            intent.allocationKey.startsWith('CO_HOST') ? 'CO_HOST' : 'HOST';
            await this.adjustmentsService.recordPostPayoutAdjustment(
              {
                bookingId: intent.settlement.bookingId,
                sourceEvent: 'REVERSAL',
                sourceReferenceId: transferId,
                affectedRecipientRole: recipientRole,
                affectedRecipientUserId:
                  intent.recipientUserId || 'UNKNOWN_RECIPIENT',
                revisedEntitlementPaise: 0n,
                actorUserId: 'CASHFREE_WEBHOOK',
                evidenceNotes: JSON.stringify(payload),
              },
              tx,
            );
        }

        await tx.payoutTransferIntent.update({
          where: { id: intent.id },
          data: {
            status: nextIntentStatus,
            providerTransferId:
              payload.utr || payload.referenceId || currentIntent.providerTransferId,
            providerResponse: payload,
          },
        });

        if (shouldUpdateAlloc) {
          // Update matching allocation in the latest revision
          const currentSettlement = await tx.settlement.findUnique({
            where: { id: intent.settlementId },
            include: {
              revisions: {
                orderBy: { revisionNumber: 'desc' },
                take: 1,
                include: { allocations: true },
              },
            },
          });
          const currentRevision = currentSettlement?.revisions[0];
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
        }

        // Record FinancialAuditEvent for complete auditability
        await tx.financialAuditEvent.create({
          data: {
            bookingId: intent.settlement.bookingId,
            settlementId: intent.settlementId,
            eventType: `WEBHOOK_${eventType}`,
            payload: {
              ...payload,
              acknowledged: payload.acknowledged,
              resultingIntentStatus: nextIntentStatus,
              isFullyAcknowledged,
            },
          },
        });
      },
    );

    return { success: true, message: 'Webhook processed successfully' };
  }
}

@Controller('payouts/me')
@UseGuards(JwtAuthGuard)
export class RecipientPayoutController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('entitlements')
  async getMyEntitlements(@CurrentUser() user: any) {
    const userId = user.id;

    // Query active allocations across revisions where user is host or co-host
    const allocations = await this.prisma.settlementAllocation.findMany({
      where: {
        recipientUserId: userId,
      },
      include: {
        revision: {
          include: {
            settlement: {
              include: {
                booking: {
                  select: {
                    id: true,
                    status: true,
                    checkIn: true,
                    checkOut: true,
                    totalAmount: true,
                    property: { select: { id: true, title: true } },
                  },
                },
                transferIntents: {
                  where: { recipientUserId: userId },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let estimatedHeldPaise = 0n;
    let payablePaise = 0n;
    let processingPaise = 0n;
    let paidPaise = 0n;

    const bookingSummaries: any[] = [];
    const seenSettlements = new Set<string>();

    for (const alloc of allocations) {
      const settlement = alloc.revision.settlement;
      // Filter only current active revision to prevent double-counting old revisions!
      if (settlement.currentRevisionId !== alloc.revisionId) {
        continue;
      }

      if (alloc.status === 'HELD') {
        estimatedHeldPaise += alloc.netEntitledPaise;
      } else if (alloc.status === 'ELIGIBLE' || alloc.status === 'APPROVED') {
        payablePaise += alloc.netEntitledPaise;
      } else if (alloc.status === 'PROCESSING') {
        processingPaise += alloc.netEntitledPaise;
      } else if (alloc.status === 'PAID') {
        paidPaise += alloc.netEntitledPaise;
      }

      const latestIntent = settlement.transferIntents[0];
      const isSimulated = latestIntent
        ? latestIntent.provider === 'MOCK_PROVIDER' ||
          latestIntent.provider === 'SIMULATED_MOCK' ||
          Boolean((latestIntent.providerResponse as any)?.simulated) ||
          Boolean((latestIntent.providerResponse as any)?.isSimulated)
        : false;

      if (!seenSettlements.has(settlement.id)) {
        seenSettlements.add(settlement.id);
        bookingSummaries.push({
          bookingId: settlement.booking.id,
          propertyTitle: settlement.booking.property.title,
          checkIn: settlement.booking.checkIn,
          checkOut: settlement.booking.checkOut,
          recipientRole: alloc.recipientRole,
          netEntitledPaise: alloc.netEntitledPaise,
          status: alloc.status,
          holdReasons: alloc.holdReasons,
          latestTransferStatus: latestIntent?.status || null,
          isSimulated,
        });
      }
    }

    const entitlements = allocations
      .filter((alloc) => alloc.revision.settlement.currentRevisionId === alloc.revisionId)
      .map((alloc) => {
        const settlement = alloc.revision.settlement;
        const transfers = (settlement.transferIntents || []).map((ti: any) => ({
          id: ti.id,
          status: ti.status,
          providerTransferId: ti.providerTransferId,
          failureReason: ti.failureReason,
          isSimulated:
            ti.provider === 'MOCK_PROVIDER' ||
            ti.provider === 'SIMULATED_MOCK' ||
            Boolean((ti.providerResponse as any)?.simulated) ||
            Boolean((ti.providerResponse as any)?.isSimulated),
        }));

        return {
          allocationId: alloc.id,
          bookingId: settlement.booking.id,
          propertyTitle: settlement.booking.property.title,
          checkIn: settlement.booking.checkIn,
          checkOut: settlement.booking.checkOut,
          bookingStatus: settlement.booking.status,
          settlementStatus: settlement.status,
          recipientRole: alloc.recipientRole,
          grossPaise: alloc.grossPaise,
          refundDeductionPaise: alloc.refundDeductionPaise,
          netEntitledPaise: alloc.netEntitledPaise,
          status: alloc.status,
          holdReasons: alloc.holdReasons,
          transfers,
        };
      });

    const summary = {
      totalNetEntitledPaise: estimatedHeldPaise + payablePaise + processingPaise + paidPaise,
      paidPaise,
      payablePaise,
      processingPaise,
      heldPaise: estimatedHeldPaise,
    };

    return serializeBigInts({
      summary,
      metrics: summary,
      entitlements,
      bookings: bookingSummaries,
    });
  }

  @Get('bookings/:bookingId')
  async getMyBookingPayoutDetails(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.id;

    const settlement = await this.prisma.settlement.findUnique({
      where: { bookingId },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            checkIn: true,
            checkOut: true,
            property: { select: { id: true, title: true, hostId: true } },
          },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 1,
          include: {
            allocations: {
              where: { recipientUserId: userId },
            },
          },
        },
        transferIntents: {
          where: { recipientUserId: userId },
          include: { attempts: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException(`Payout settlement for booking "${bookingId}" not found.`);
    }

    const currentRevision = settlement.revisions[0];
    const myAllocation = currentRevision?.allocations[0];

    // Backend ownership verification: Logged-in user MUST be recipient in this settlement!
    if (!myAllocation) {
      throw new ForbiddenException(
        `You do not have permission to view payout records for booking "${bookingId}".`,
      );
    }

    return serializeBigInts({
      bookingId: settlement.booking.id,
      propertyTitle: settlement.booking.property.title,
      checkIn: settlement.booking.checkIn,
      checkOut: settlement.booking.checkOut,
      bookingStatus: settlement.booking.status,
      settlementStatus: settlement.status,
      myAllocation: {
        recipientRole: myAllocation.recipientRole,
        grossPaise: myAllocation.grossPaise,
        refundDeductionPaise: myAllocation.refundDeductionPaise,
        netEntitledPaise: myAllocation.netEntitledPaise,
        status: myAllocation.status,
        holdReasons: myAllocation.holdReasons,
      },
      transferIntents: (settlement.transferIntents || []).map((ti: any) => ({
        ...ti,
        isSimulated:
          ti.provider === 'MOCK_PROVIDER' ||
          ti.provider === 'SIMULATED_MOCK' ||
          Boolean((ti.providerResponse as any)?.simulated) ||
          Boolean((ti.providerResponse as any)?.isSimulated),
      })),
    });
  }
}
