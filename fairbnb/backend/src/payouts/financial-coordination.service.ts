import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateRefundReservationDto,
  RefundProviderOutcome,
  RefundableCapacity,
} from './refund.types.js';
import { toPaise } from './money.js';

@Injectable()
export class FinancialCoordinationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Acquire per-booking financial coordination lock.
   * Serializes payment evidence changes, refund reservations, settlement calculations, and transfer claims.
   */
  async withBookingFinancialLock<T>(
    bookingId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        // Explicit per-booking row-level lock
        const lockedRows: any[] = await tx.$queryRaw`
          SELECT "id" FROM "Booking" WHERE "id" = ${bookingId} FOR UPDATE;
        `;
        if (!lockedRows || lockedRows.length === 0) {
          throw new NotFoundException(`Booking with ID "${bookingId}" not found for financial coordination lock.`);
        }

        return callback(tx);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 15000,
      },
    );
  }

  /**
   * Calculates the current refundable capacity for a booking under lock.
   * Considers COMPLETED, PENDING, PROCESSING, RESERVED, and UNKNOWN refunds.
   */
  async getRefundableCapacity(
    tx: Prisma.TransactionClient,
    bookingId: string,
  ): Promise<RefundableCapacity> {
    const [payments, refunds] = await Promise.all([
      tx.payment.findMany({
        where: {
          bookingId,
          status: { in: ['PAID', 'COMPLETED'] },
        },
        select: {
          id: true,
          amount: true,
        },
      }),
      tx.refund.findMany({
        where: {
          bookingId,
          OR: [
            { status: { in: ['COMPLETED', 'PENDING', 'PROCESSING'] } },
            { reservationStatus: { in: ['RESERVED', 'PENDING_PROVIDER', 'COMPLETED', 'UNKNOWN'] } },
          ],
        },
        select: {
          id: true,
          amount: true,
          amountPaise: true,
          status: true,
          reservationStatus: true,
        },
      }),
    ]);

    let capturedPaise = 0n;
    for (const p of payments) {
      capturedPaise += toPaise(p.amount);
    }

    let consumedRefundPaise = 0n;
    let hasUnknownRefunds = false;

    for (const r of refunds) {
      const pAmount = r.amountPaise ?? toPaise(r.amount);
      consumedRefundPaise += pAmount;
      if (r.reservationStatus === 'UNKNOWN' || r.status === 'UNKNOWN') {
        hasUnknownRefunds = true;
      }
    }

    const remainingCapacityPaise =
      capturedPaise > consumedRefundPaise ? capturedPaise - consumedRefundPaise : 0n;

    return {
      capturedPaise,
      consumedRefundPaise,
      remainingCapacityPaise,
      hasUnknownRefunds,
    };
  }

  /**
   * Idempotently reserves a refund under the booking lock.
   * Enforces exact component breakdown reconciliation or marks review hold for scalar amounts.
   */
  async reserveRefund(
    tx: Prisma.TransactionClient,
    dto: CreateRefundReservationDto,
  ) {
    if (dto.amountPaise <= 0n) {
      throw new BadRequestException('Refund amount must be strictly positive.');
    }

    // 1. Check if an operation with this reference already exists (idempotency)
    const existingRefund = await tx.refund.findUnique({
      where: { operationReference: dto.operationReference },
      include: { components: true },
    });

    if (existingRefund) {
      return {
        refund: existingRefund,
        isExisting: true,
      };
    }

    // 2. Re-read capacity under the active lock
    const capacity = await this.getRefundableCapacity(tx, dto.bookingId);
    if (dto.amountPaise > capacity.remainingCapacityPaise) {
      throw new ConflictException(
        `Insufficient refundable capacity: requested ${dto.amountPaise} paise, but remaining refundable capacity is ${capacity.remainingCapacityPaise} paise (captured: ${capacity.capturedPaise} paise, consumed: ${capacity.consumedRefundPaise} paise).`,
      );
    }

    // 3. Verify component breakdown or flag for review
    let reviewStatus: 'VALID' | 'NEEDS_REVIEW' = 'VALID';
    const reviewReasons: string[] = [];
    let breakdownToPersist = {
      accommodationPaise: 0n,
      cleaningPaise: 0n,
      platformPaise: 0n,
      taxPaise: 0n,
      totalPaise: dto.amountPaise,
      isVerified: true,
    };

    if (dto.breakdown) {
      const sum =
        dto.breakdown.accommodationPaise +
        dto.breakdown.cleaningPaise +
        dto.breakdown.platformPaise +
        dto.breakdown.taxPaise;

      if (sum !== dto.amountPaise) {
        throw new BadRequestException(
          `Refund component breakdown sum (${sum} paise) does not match total refund amount (${dto.amountPaise} paise).`,
        );
      }

      breakdownToPersist = {
        accommodationPaise: dto.breakdown.accommodationPaise,
        cleaningPaise: dto.breakdown.cleaningPaise,
        platformPaise: dto.breakdown.platformPaise,
        taxPaise: dto.breakdown.taxPaise,
        totalPaise: dto.amountPaise,
        isVerified: true,
      };
    } else {
      // Scalar refund without component breakdown: preserve customer refund entitlement,
      // but flag for financial review hold so tax and recipient allocations are not guessed.
      reviewStatus = 'NEEDS_REVIEW';
      reviewReasons.push('SCALAR_REFUND_WITHOUT_BREAKDOWN');
      breakdownToPersist.isVerified = false;
    }

    // 4. Create Refund record with reservation status RESERVED
    const refund = await tx.refund.create({
      data: {
        bookingId: dto.bookingId,
        paymentId: dto.paymentId,
        amount: Number(dto.amountPaise) / 100,
        amountPaise: dto.amountPaise,
        operationReference: dto.operationReference,
        idempotencyKey: dto.idempotencyKey || dto.operationReference,
        reason: dto.reason,
        status: 'PENDING',
        reservationStatus: 'RESERVED',
        reviewStatus,
        processedById: dto.processedById,
        components: {
          create: {
            accommodationPaise: breakdownToPersist.accommodationPaise,
            cleaningPaise: breakdownToPersist.cleaningPaise,
            platformPaise: breakdownToPersist.platformPaise,
            taxPaise: breakdownToPersist.taxPaise,
            totalPaise: breakdownToPersist.totalPaise,
            isVerified: breakdownToPersist.isVerified,
            reviewStatus,
            reviewReasons,
          },
        },
      },
      include: { components: true },
    });

    // 5. Record FinancialAuditEvent
    await tx.financialAuditEvent.create({
      data: {
        bookingId: dto.bookingId,
        eventType: 'REFUND_RESERVED',
        actorId: dto.processedById,
        payload: {
          refundId: refund.id,
          operationReference: dto.operationReference,
          amountPaise: dto.amountPaise.toString(),
          reviewStatus,
          reviewReasons,
        },
      },
    });

    return {
      refund,
      isExisting: false,
    };
  }

  /**
   * Completes, fails, or marks unknown a reserved refund under lock.
   * Terminal failures release the reservation; UNKNOWN preserves it.
   */
  async completeRefund(
    tx: Prisma.TransactionClient,
    refundId: string,
    outcome: RefundProviderOutcome,
  ) {
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      include: { booking: true },
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID "${refundId}" not found.`);
    }

    let nextStatus = refund.status;
    let nextReservationStatus = refund.reservationStatus;
    let processedAt: Date | null = refund.processedAt;

    if (outcome.status === 'COMPLETED') {
      nextStatus = 'COMPLETED';
      nextReservationStatus = 'COMPLETED';
      processedAt = new Date();
    } else if (outcome.status === 'FAILED') {
      nextStatus = 'FAILED';
      nextReservationStatus = 'FAILED'; // Released capacity
    } else if (outcome.status === 'UNKNOWN') {
      nextStatus = 'PENDING';
      nextReservationStatus = 'UNKNOWN'; // Retains reservation hold
    }

    const updatedRefund = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: nextStatus,
        reservationStatus: nextReservationStatus,
        processedAt: processedAt || undefined,
        paymentRefundId: outcome.providerRefundId || refund.paymentRefundId,
        failureReason: outcome.failureReason || refund.failureReason,
      },
      include: { components: true },
    });

    // Update booking payment and refund status if completed
    if (outcome.status === 'COMPLETED') {
      const allCompletedRefunds = await tx.refund.findMany({
        where: {
          bookingId: refund.bookingId,
          status: 'COMPLETED',
        },
        select: { amount: true, amountPaise: true },
      });

      let totalRefundedPaise = 0n;
      for (const r of allCompletedRefunds) {
        totalRefundedPaise += r.amountPaise ?? toPaise(r.amount);
      }

      const bookingTotalPaise = toPaise(refund.booking.totalAmount);
      const isFullRefund = totalRefundedPaise >= bookingTotalPaise;

      await tx.booking.update({
        where: { id: refund.bookingId },
        data: {
          paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundStatus: isFullRefund ? 'FULL' : 'PARTIAL',
        },
      });
    }

    // Record audit event
    await tx.financialAuditEvent.create({
      data: {
        bookingId: refund.bookingId,
        eventType:
          outcome.status === 'COMPLETED'
            ? 'REFUND_COMPLETED'
            : outcome.status === 'FAILED'
            ? 'REFUND_FAILED'
            : 'REFUND_UNKNOWN',
        payload: {
          refundId,
          outcomeStatus: outcome.status,
          providerRefundId: outcome.providerRefundId,
          failureReason: outcome.failureReason,
        },
      },
    });

    return updatedRefund;
  }

  /**
   * Orchestrates the complete durable refund lifecycle:
   * 1. DB Lock -> Reserve refund
   * 2. Outside DB transaction -> Call payment provider
   * 3. DB Lock -> Complete/update refund with verified outcome
   */
  async processDurableRefund(
    dto: CreateRefundReservationDto,
    providerRefundCall: (
      opRef: string,
      amountPaise: bigint,
    ) => Promise<RefundProviderOutcome>,
  ) {
    // Step 1: Reserve under lock
    const { refund, isExisting } = await this.withBookingFinancialLock(
      dto.bookingId,
      async (tx) => {
        return this.reserveRefund(tx, dto);
      },
    );

    // If already completed or failed previously, return existing
    if (isExisting && (refund.status === 'COMPLETED' || refund.status === 'FAILED')) {
      return refund;
    }

    // Step 2: Call provider OUTSIDE the transaction
    let outcome: RefundProviderOutcome;
    try {
      outcome = await providerRefundCall(dto.operationReference, dto.amountPaise);
    } catch (err: any) {
      // Network failure, timeout or unexpected crash -> Mark UNKNOWN (never assume failure!)
      outcome = {
        status: 'UNKNOWN',
        failureReason: `PROVIDER_CALL_EXCEPTION: ${err.message || 'Unknown network/provider error'}`,
      };
    }

    // Step 3: Persist verified result under lock
    const finalRefund = await this.withBookingFinancialLock(
      dto.bookingId,
      async (tx) => {
        return this.completeRefund(tx, refund.id, outcome);
      },
    );

    return finalRefund;
  }
}
