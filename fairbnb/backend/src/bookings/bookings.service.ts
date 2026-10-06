import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, UserRole } from '@prisma/client';
import { BookingFilterDto } from './dto/booking-filter.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';
import { RequestRefundDto } from './dto/refund-booking.dto.js';
import { FailRefundDto } from './dto/fail-refund.dto.js';
import { RefundFilterDto } from './dto/refund-filter.dto.js';
import { CreateBookingQuoteDto } from './dto/create-booking-quote.dto.js';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto.js';
import { CancelGuestBookingDto } from './dto/cancel-guest-booking.dto.js';
import { PricingService } from './pricing.service.js';
import { AvailabilityService } from './availability.service.js';
import {
  CancellationService,
  CancellationCalculationResult,
} from './cancellation.service.js';
import { MockRazorpayProvider } from '../payments/providers/mock-razorpay.provider.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { buildBookingFinanceSnapshot } from '../payouts/snapshot.adapter.js';
import { saveBookingFinanceSnapshot } from '../payouts/snapshot.persistence.js';
import { SettlementService } from '../payouts/settlement.service.js';
import { AuditLogService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly availabilityService: AvailabilityService,
    private readonly cancellationService: CancellationService,
    private readonly paymentProvider: MockRazorpayProvider,
    private readonly couponsService: CouponsService,
    @Optional() private readonly settlementService?: SettlementService,
    @Optional() private readonly auditLogService?: AuditLogService,
  ) {}

  private readonly logger = new Logger(BookingsService.name);

  // Safe selectors for user and property to avoid leaking sensitive data
  private readonly safeUserSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
  };

  private readonly safePropertySelect = {
    id: true,
    title: true,
    locality: true,
    city: true,
    state: true,
    country: true,
    coverImage: true,
    basePrice: true,
    host: { select: this.safeUserSelect },
  };

  // ============================================================================
  // 1. ALL BOOKINGS LIST (WITH PAGINATION, FILTERS, SEARCH & SORTING)
  // ============================================================================
  async findAll(query: BookingFilterDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.bookingType) {
      where.bookingType = query.bookingType;
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.propertyId) {
      where.propertyId = query.propertyId;
    }

    if (query.guestId) {
      where.guestId = query.guestId;
    }

    // Property location filters
    if (query.city || query.locality) {
      where.property = {};
      if (query.city) {
        where.property.city = { equals: query.city, mode: 'insensitive' };
      }
      if (query.locality) {
        where.property.locality = {
          equals: query.locality,
          mode: 'insensitive',
        };
      }
    }

    // Date range filters
    if (query.checkInFrom || query.checkInTo) {
      where.checkIn = {};
      if (query.checkInFrom) where.checkIn.gte = new Date(query.checkInFrom);
      if (query.checkInTo) where.checkIn.lte = new Date(query.checkInTo);
    }

    if (query.checkOutFrom || query.checkOutTo) {
      where.checkOut = {};
      if (query.checkOutFrom) where.checkOut.gte = new Date(query.checkOutFrom);
      if (query.checkOutTo) where.checkOut.lte = new Date(query.checkOutTo);
    }

    if (query.createdFrom || query.createdTo) {
      where.createdAt = {};
      if (query.createdFrom) where.createdAt.gte = new Date(query.createdFrom);
      if (query.createdTo) where.createdAt.lte = new Date(query.createdTo);
    }

    // Search query across Booking ID, Guest name/email/phone, Property title
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { guest: { name: { contains: search, mode: 'insensitive' } } },
        { guest: { email: { contains: search, mode: 'insensitive' } } },
        { guest: { phone: { contains: search, mode: 'insensitive' } } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [total, data] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          bookingType: true,
          source: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          totalAmount: true,
          discountAmount: true,
          couponCode: true,
          refundStatus: true,
          cancellation: true,
          createdAt: true,
          updatedAt: true,
          guest: { select: this.safeUserSelect },
          property: { select: this.safePropertySelect },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ============================================================================
  // 2. BOOKING SUMMARY STATISTICS
  // ============================================================================
  async getSummary() {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      revenueAggregate,
      refundAggregate,
      refundsCount,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { status: 'CANCELLED' } }),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
        },
      }),
      this.prisma.refund.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.refund.count(),
    ]);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      refundsCount,
      totalRevenue: revenueAggregate._sum.totalAmount || 0,
      totalRefunded: refundAggregate._sum.amount || 0,
    };
  }

  // ============================================================================
  // 3. CANCELLED BOOKINGS LIST
  // ============================================================================
  async getCancelledBookings(query: BookingFilterDto) {
    return this.findAll({
      ...query,
      status: 'CANCELLED',
    });
  }

  // ============================================================================
  // 4. SINGLE BOOKING DETAILS
  // ============================================================================
  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: { select: this.safeUserSelect },
        property: {
          select: {
            ...this.safePropertySelect,
            address: true,
            pincode: true,
            hostId: true,
            host: { select: this.safeUserSelect },
          },
        },
        refunds: {
          orderBy: { createdAt: 'desc' },
          include: {
            processedBy: { select: this.safeUserSelect },
          },
        },
        invoices: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${id}' not found`);
    }

    return booking;
  }

  // ============================================================================
  // 5. UPDATE BOOKING STATUS
  // ============================================================================
  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID '${id}' not found`);
    }

    // State transition rules
    if (
      booking.status === 'COMPLETED' &&
      (dto.status === 'PENDING' ||
        dto.status === 'CONFIRMED' ||
        dto.status === 'CHECKED_IN' ||
        dto.status === 'CANCELLED')
    ) {
      throw new BadRequestException(
        'Cannot transition COMPLETED booking back to PENDING',
      );
    }

    if (
      booking.status === 'CANCELLED' &&
      (dto.status === 'CONFIRMED' ||
        dto.status === 'PENDING' ||
        dto.status === 'CHECKED_IN' ||
        dto.status === 'COMPLETED')
    ) {
      throw new BadRequestException('Cannot re-activate a CANCELLED booking');
    }

    if (
      booking.status === 'CHECKED_IN' &&
      (dto.status === 'PENDING' || dto.status === 'CONFIRMED')
    ) {
      throw new BadRequestException(
        `Cannot transition CHECKED_IN booking back to ${dto.status}`,
      );
    }

    if (dto.status === 'CHECKED_IN' && booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Only CONFIRMED bookings can transition to CHECKED_IN',
      );
    }

    if (
      dto.status === 'COMPLETED' &&
      booking.status !== 'CHECKED_IN' &&
      booking.status !== 'CONFIRMED'
    ) {
      throw new BadRequestException(
        'Only CHECKED_IN or CONFIRMED bookings can transition to COMPLETED',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
      include: {
        guest: { select: this.safeUserSelect },
        property: { select: this.safePropertySelect },
      },
    });

    try {
      if (this.auditLogService) {
        await this.auditLogService.logAction({
          actorId: 'system_admin',
          actorRole: 'ADMIN',
          action: 'BOOKING_STATUS_UPDATE',
          entityType: 'Booking',
          entityId: id,
          details: { previousStatus: booking.status, newStatus: dto.status },
        });
      }
    } catch (e) {}

    if (dto.status === 'COMPLETED' && this.settlementService) {
      try {
        await this.settlementService.prepareOrRefreshSettlement(
          id,
          'BOOKING_COMPLETED',
        );
        this.logger.log(`Settlement prepared for completed booking "${id}"`);
      } catch (err: any) {
        this.logger.warn(
          `Settlement preparation deferred for completed booking "${id}": ${err.message}`,
        );
      }
    }

    return updatedBooking;
  }

  // ============================================================================
  // STAY LIFECYCLE HOURLY CRON JOB
  // ============================================================================
  @Cron(CronExpression.EVERY_HOUR)
  async handleStayLifecycleTransitions() {
    const now = new Date();

    // 1. Move CONFIRMED bookings to CHECKED_IN once checkIn <= now()
    const confirmedBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { lte: now },
      },
      select: { id: true },
    });

    for (const booking of confirmedBookings) {
      try {
        await this.updateStatus(booking.id, { status: 'CHECKED_IN' });
        this.logger.log(`Booking ${booking.id} transitioned to CHECKED_IN`);
      } catch (err: any) {
        this.logger.error(
          `Failed to transition booking ${booking.id} to CHECKED_IN: ${err?.message || err}`,
        );
      }
    }

    // 2. Move CHECKED_IN bookings to COMPLETED once checkOut <= now()
    const checkedInBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CHECKED_IN',
        checkOut: { lte: now },
      },
      select: { id: true },
    });

    for (const booking of checkedInBookings) {
      try {
        await this.updateStatus(booking.id, { status: 'COMPLETED' });
        this.logger.log(`Booking ${booking.id} transitioned to COMPLETED`);
      } catch (err: any) {
        this.logger.error(
          `Failed to transition booking ${booking.id} to COMPLETED: ${err?.message || err}`,
        );
      }
    }
  }

  /**
   * Shared cancellation-finalization helper for GUEST, HOST, and ADMIN cancellation paths.
   * Centralizes refund row creation using calculateRefund() output, preserves host asymmetry,
   * and standardizes uppercase refund status strings ('COMPLETED', 'PENDING').
   */
  private async finalizeCancellationRefund(
    tx: Prisma.TransactionClient,
    booking: {
      id: string;
      totalAmount: number;
      paymentStatus: string;
      refundStatus: string | null;
      paymentId?: string | null;
      couponCode?: string | null;
    },
    refundCalc: CancellationCalculationResult | null,
    initiatedBy: 'GUEST' | 'HOST' | 'ADMIN',
    options?: {
      reason?: string;
      idempotencyKey?: string;
      adminUserId?: string;
    },
  ): Promise<{
    refundRecord: any;
    newPaymentStatus: string;
    newRefundStatus: string | undefined;
  }> {
    let refundRecord: any = null;
    let newPaymentStatus = booking.paymentStatus;
    let newRefundStatus = booking.refundStatus ?? undefined;

    if (initiatedBy === 'GUEST') {
      const calculatedAmount = refundCalc?.refundAmount ?? 0;
      if (booking.paymentStatus === 'PAID' && calculatedAmount > 0) {
        const existingRefund = options?.idempotencyKey
          ? await tx.refund.findUnique({
              where: { idempotencyKey: options.idempotencyKey },
            })
          : null;

        if (existingRefund) {
          refundRecord = existingRefund;
        } else {
          const providerRefund = await this.paymentProvider.processRefund({
            paymentId: booking.paymentId || 'pay_mock',
            amount: calculatedAmount,
            reason: `Guest cancellation per ${refundCalc?.policy || 'policy'} policy`,
          });

          refundRecord = await tx.refund.create({
            data: {
              bookingId: booking.id,
              amount: calculatedAmount,
              reason:
                options?.reason ||
                `Guest cancellation (${refundCalc?.policy || 'policy'} policy)`,
              status: 'COMPLETED',
              paymentRefundId: providerRefund.providerRefundId,
              requestedAt: new Date(),
              processedAt: new Date(),
              idempotencyKey: options?.idempotencyKey || undefined,
            },
          });
        }

        const isFullRefund = calculatedAmount >= booking.totalAmount;
        newPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
        newRefundStatus = isFullRefund ? 'FULL' : 'PARTIAL';
      }
    } else if (initiatedBy === 'HOST') {
      // Host cancellation asymmetry: 100% full refund to guest
      if (booking.paymentStatus === 'PAID') {
        refundRecord = await tx.refund.create({
          data: {
            bookingId: booking.id,
            amount: booking.totalAmount,
            reason: `Host cancellation full refund: ${options?.reason || 'Host cancelled booking'}`,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });
        newPaymentStatus = 'REFUNDED';
        newRefundStatus = 'FULL';
      }
    } else if (initiatedBy === 'ADMIN') {
      // Admin cancellation: pending refund review
      if (booking.paymentStatus === 'PAID') {
        newRefundStatus = 'PENDING';
      }
    }

    // Coupon release handling: release if cancelled by HOST or ADMIN; do NOT release if GUEST
    if (initiatedBy === 'HOST' || initiatedBy === 'ADMIN') {
      if (booking.couponCode) {
        await this.couponsService.releaseCoupon(tx, booking.couponCode);
      }
    } else if (initiatedBy === 'GUEST') {
      // Guest-initiated cancellation must not return coupon usage,
      // to prevent a book→discount→cancel→rebook farming loophole.
    }

    return { refundRecord, newPaymentStatus, newRefundStatus };
  }

  // ============================================================================
  // 6. CANCEL BOOKING (ADMIN ACTION WITH TRANSACTION)
  // ============================================================================
  async cancelBooking(id: string, dto: CancelBookingDto, adminUserId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID '${id}' not found`);
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    const cancellationInfo = {
      reason: dto.reason,
      cancelledBy: 'ADMIN',
      cancelledAt: new Date().toISOString(),
      cancelledById: adminUserId,
    };

    return this.prisma.$transaction(async (tx) => {
      const { newRefundStatus } = await this.finalizeCancellationRefund(
        tx,
        booking,
        null,
        'ADMIN',
        { reason: dto.reason, adminUserId },
      );

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellation: cancellationInfo,
          refundStatus: newRefundStatus,
        },
        include: {
          guest: { select: this.safeUserSelect },
          property: { select: this.safePropertySelect },
          refunds: true,
        },
      });

      try {
        if (this.auditLogService) {
          await this.auditLogService.logAction({
            actorId: adminUserId,
            actorRole: 'ADMIN',
            action: 'BOOKING_CANCEL',
            entityType: 'Booking',
            entityId: id,
            details: { reason: dto.reason },
          });
        }
      } catch (e) {}

      return updatedBooking;
    });
  }

  // ============================================================================
  // 7. REQUEST / CREATE REFUND FOR A BOOKING
  // ============================================================================
  async requestRefund(
    bookingId: string,
    dto: RequestRefundDto,
    adminUserId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { refunds: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${bookingId}' not found`);
    }

    if (
      booking.paymentStatus === 'PENDING' ||
      booking.paymentStatus === 'FAILED'
    ) {
      throw new BadRequestException(
        `Cannot refund a booking with payment status '${booking.paymentStatus}'`,
      );
    }

    // Check for existing pending/processing refunds to prevent duplicates
    const activeRefund = booking.refunds.find(
      (r) => r.status === 'PENDING' || r.status === 'PROCESSING',
    );
    if (activeRefund) {
      throw new ConflictException(
        `A refund request (ID: ${activeRefund.id}) is already pending or processing for this booking`,
      );
    }

    // Calculate total already refunded or in process
    const completedOrPendingRefundsSum = booking.refunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const remainingRefundable =
      booking.totalAmount - completedOrPendingRefundsSum;

    if (dto.amount > remainingRefundable) {
      throw new BadRequestException(
        `Requested refund amount (₹${dto.amount}) exceeds remaining refundable balance (₹${remainingRefundable.toFixed(2)}) for total booking amount of ₹${booking.totalAmount}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          bookingId,
          amount: dto.amount,
          reason: dto.reason || 'Admin initiated refund',
          status: 'PENDING',
          processedById: adminUserId,
          requestedAt: new Date(),
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { refundStatus: 'PENDING' },
      });

      try {
        if (this.auditLogService) {
          await this.auditLogService.logAction({
            actorId: adminUserId,
            actorRole: 'ADMIN',
            action: 'REFUND_REQUEST',
            entityType: 'Refund',
            entityId: refund.id,
            details: { bookingId, amount: dto.amount, reason: dto.reason },
          });
        }
      } catch (e) {}

      return refund;
    });
  }

  // ============================================================================
  // 8. LIST ALL REFUNDS (PAGINATED WITH FILTERS)
  // ============================================================================
  async findAllRefunds(query: RefundFilterDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.RefundWhereInput = {};

    if (query.status) {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query.bookingId) {
      where.bookingId = query.bookingId;
    }

    if (query.dateFrom || query.dateTo) {
      where.requestedAt = {};
      if (query.dateFrom) where.requestedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.requestedAt.lte = new Date(query.dateTo);
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { bookingId: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        {
          booking: {
            guest: { name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.refund.count({ where }),
      this.prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          processedBy: { select: this.safeUserSelect },
          booking: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              paymentStatus: true,
              guest: { select: this.safeUserSelect },
              property: { select: this.safePropertySelect },
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ============================================================================
  // 9. SINGLE REFUND DETAILS
  // ============================================================================
  async findRefundById(id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        processedBy: { select: this.safeUserSelect },
        booking: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            checkIn: true,
            checkOut: true,
            guest: { select: this.safeUserSelect },
            property: { select: this.safePropertySelect },
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException(`Refund record with ID '${id}' not found`);
    }

    return refund;
  }

  // ============================================================================
  // 10. PROCESS REFUND (PENDING -> COMPLETED WITH TRANSACTION)
  // ============================================================================
  async processRefund(id: string, adminUserId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: { booking: { include: { refunds: true } } },
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID '${id}' not found`);
    }

    if (refund.status === 'COMPLETED') {
      return refund; // Already completed
    }

    const processed = await this.prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refund.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          processedById: adminUserId,
        },
      });

      // Calculate total completed refund amount for this booking
      const allCompletedRefunds = refund.booking.refunds.filter(
        (r) => r.id !== id && r.status === 'COMPLETED',
      );
      const totalRefunded =
        allCompletedRefunds.reduce((sum, r) => sum + r.amount, 0) +
        refund.amount;

      const isFullRefund = totalRefunded >= refund.booking.totalAmount;
      const newPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      const newRefundStatus = isFullRefund ? 'FULL' : 'PARTIAL';

      await tx.booking.update({
        where: { id: refund.bookingId },
        data: {
          paymentStatus: newPaymentStatus,
          refundStatus: newRefundStatus,
        },
      });

      // Automated REFUND financial transaction ledger entry
      await tx.financialTransaction.create({
        data: {
          bookingId: refund.bookingId,
          propertyId: refund.booking.propertyId,
          recipientId: refund.booking.guestId,
          type: 'REFUND',
          amount: refund.amount,
          currency: refund.booking.currency || 'INR',
          status: 'COMPLETED',
        },
      });

      try {
        if (this.auditLogService) {
          await this.auditLogService.logAction({
            actorId: adminUserId,
            actorRole: 'ADMIN',
            action: 'REFUND_PROCESS',
            entityType: 'Refund',
            entityId: id,
            details: { bookingId: refund.bookingId, amount: refund.amount },
          });
        }
      } catch (e) {}

      return updatedRefund;
    });

    if (this.settlementService) {
      try {
        await this.settlementService.prepareOrRefreshSettlement(
          refund.bookingId,
          'REFUND_COMPLETED',
          adminUserId,
        );
        this.logger.log(
          `Settlement refreshed for booking "${refund.bookingId}" after refund`,
        );
      } catch (err: any) {
        this.logger.warn(
          `Settlement refresh deferred after refund on booking "${refund.bookingId}": ${err.message}`,
        );
      }
    }

    return processed;
  }

  // ============================================================================
  // 11. FAIL REFUND (MARK AS FAILED WITH REASON)
  // ============================================================================
  async failRefund(id: string, dto: FailRefundDto) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });

    if (!refund) {
      throw new NotFoundException(`Refund record with ID '${id}' not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refund.update({
        where: { id },
        data: {
          status: 'FAILED',
          failureReason: dto.reason,
        },
      });

      await tx.booking.update({
        where: { id: refund.bookingId },
        data: { refundStatus: 'FAILED' },
      });

      try {
        if (this.auditLogService) {
          await this.auditLogService.logAction({
            actorId: 'system_admin',
            actorRole: 'ADMIN',
            action: 'REFUND_FAIL',
            entityType: 'Refund',
            entityId: id,
            details: { bookingId: refund.bookingId, reason: dto.reason },
          });
        }
      } catch (e) {}

      return updatedRefund;
    });
  }

  // ============================================================================
  // 12. GUEST BOOKING CREATION WITH TRANSACTION & DOUBLE-BOOKING PROTECTION
  // ============================================================================
  async createGuestBooking(guestId: string, dto: CreateGuestBookingDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Property with ID '${dto.propertyId}' not found`,
      );
    }

    if (
      property.verificationStatus !== 'APPROVED' ||
      property.status !== 'PUBLISHED'
    ) {
      throw new BadRequestException('Property is not available for booking');
    }

    // Initial availability check outside transaction
    const initialAvailability =
      await this.availabilityService.checkAvailability(
        dto.propertyId,
        dto.checkIn,
        dto.checkOut,
        dto.guests,
      );

    if (!initialAvailability.available) {
      throw new ConflictException(
        initialAvailability.reason ||
          'Property is not available for the requested dates',
      );
    }

    // Calculate price snapshot outside transaction
    let discountAmount = 0;
    if (dto.couponCode) {
      const start = new Date(dto.checkIn);
      const end = new Date(dto.checkOut);
      const nights = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
      const baseAmount = Number((property.basePrice * nights).toFixed(2));
      try {
        const couponRes = await this.couponsService.validateCoupon({
          code: dto.couponCode,
          orderAmount: baseAmount,
        });
        discountAmount = couponRes.discountAmount;
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.message.includes('usage limit') ||
            err.message.includes('Usage limit'))
        ) {
          throw new ConflictException(
            'Coupon usage limit reached — this coupon just reached its usage limit, please retry without it or with a different code.',
          );
        }
        throw err;
      }
    }

    const pricing = this.pricingService.calculatePricing({
      basePrice: property.basePrice,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      cleaningFee: property.cleaningFee || 0,
      serviceFeeRate: property.serviceFeeRate || 0.1,
      taxRate: property.taxRate || 0.18,
      discountAmount,
    });

    // 15-minute payment lock window
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Run transaction to guarantee DOUBLE BOOKING PROTECTION
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Consistent lock ordering: Lock Property row FIRST
      await tx.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${dto.propertyId} FOR UPDATE;`;

      // 2. Re-verify availability INSIDE transaction with row locks / atomic query
      const txAvailability = await this.availabilityService.checkAvailability(
        dto.propertyId,
        dto.checkIn,
        dto.checkOut,
        dto.guests,
        tx,
      );

      if (!txAvailability.available) {
        throw new ConflictException(
          txAvailability.reason ||
            'PROPERTY_ALREADY_BOOKED: Requested dates were reserved by another booking',
        );
      }

      // 3. Redeem coupon atomically inside transaction before booking creation
      if (dto.couponCode) {
        await this.couponsService.redeemCoupon(tx, dto.couponCode);
      }

      // 4. Query active co-host PayoutRule under the Property lock
      const activePayoutRules = await tx.payoutRule.findMany({
        where: {
          propertyId: dto.propertyId,
          status: 'ACTIVE',
        },
      });

      let coHostFacts: any = null;
      let coHostStatus: 'NONE' | 'AGREED' | 'UNRESOLVED' = 'NONE';
      const extraReviewReasons: string[] = [];

      if (activePayoutRules.length === 1) {
        const rule = activePayoutRules[0];
        coHostFacts = {
          ruleId: rule.id,
          recipientUserId: rule.recipientUserId,
          ruleType: rule.type,
          percentage: rule.percentage,
          fixedAmount: rule.fixedAmount,
          status: rule.status,
          coHostRelationshipId: rule.coHostRelationshipId,
        };
        coHostStatus = 'AGREED';
      } else if (activePayoutRules.length > 1) {
        coHostStatus = 'UNRESOLVED';
        extraReviewReasons.push(
          `AMBIGUOUS_COHOST_RULES: Found ${activePayoutRules.length} active payout rules for property "${dto.propertyId}"`,
        );
      }

      const booking = await tx.booking.create({
        data: {
          propertyId: dto.propertyId,
          guestId,
          checkIn: new Date(dto.checkIn),
          checkOut: new Date(dto.checkOut),
          nights: pricing.nights,
          baseAmount: pricing.baseAmount,
          cleaningFee: pricing.cleaningFee,
          serviceFee: pricing.serviceFee,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
          discountAmount: pricing.discountAmount,
          couponCode: dto.couponCode || null,
          currency: pricing.currency,
          guests: dto.guests,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          expiresAt,
          source: 'Fairbnb Platform',
          bookingType: property.instantBook ? 'INSTANT' : 'STANDARD',
        },
        include: {
          guest: { select: this.safeUserSelect },
          property: { select: this.safePropertySelect },
        },
      });

      // 5. Build and save immutable BookingFinanceSnapshot inside the SAME transaction
      const snapshotInput = {
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: property.hostId,
        financials: {
          basePrice: pricing.baseAmount,
          cleaningFee: pricing.cleaningFee,
          serviceFee: pricing.serviceFee,
          taxAmount: pricing.taxAmount,
          discountAmount: pricing.discountAmount,
          totalAmount: pricing.totalAmount,
          currency: pricing.currency,
        },
        discount: {
          couponCode: dto.couponCode || null,
          discountFunding: pricing.discountAmount > 0 ? ('PLATFORM' as const) : ('NONE' as const),
        },
        coHost: coHostFacts,
        coHostAgreementStatus: coHostStatus,
        capturedAt: new Date(),
        captureProvenance: 'BOOKING_CREATION',
        policyVersion: 'DRAFT_V1',
      };

      const snapshotData = buildBookingFinanceSnapshot(snapshotInput);
      if (extraReviewReasons.length > 0) {
        snapshotData.reviewReasons.push(...extraReviewReasons);
        snapshotData.reviewStatus = 'NEEDS_REVIEW';
      }

      const savedSnapshot = await saveBookingFinanceSnapshot(tx, snapshotData);

      return {
        booking,
        pricing,
        snapshot: savedSnapshot,
      };
    });

    // 6. Initialize Payment record OUTSIDE the database transaction
    // External HTTP calls to payment gateway must not run inside retried DB transactions
    const orderResult = await this.paymentProvider.createOrder({
      bookingId: result.booking.id,
      amount: result.pricing.totalAmount,
      currency: result.pricing.currency,
    });

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: result.booking.id,
        amount: result.pricing.totalAmount,
        currency: result.pricing.currency,
        provider: orderResult.provider,
        providerOrderId: orderResult.providerOrderId,
        providerPaymentId: orderResult.providerPaymentId,
        status: 'PENDING',
        idempotencyKey: dto.idempotencyKey || undefined,
      },
    });

    return {
      booking: result.booking,
      pricing: result.pricing,
      payment,
    };
  }

  // ============================================================================
  // 13. GUEST MY-BOOKINGS LIST
  // ============================================================================
  async findMyBookings(guestId: string, query: BookingFilterDto) {
    return this.findAll({
      ...query,
      guestId,
    });
  }

  // ============================================================================
  // 14. GUEST / HOST / ADMIN SINGLE BOOKING DETAILS WITH AUTHORIZATION CHECK
  // ============================================================================
  async findGuestBookingById(id: string, userId: string, userRole: UserRole) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: { select: this.safeUserSelect },
        property: {
          select: {
            ...this.safePropertySelect,
            address: true,
            pincode: true,
            hostId: true,
            cancellationPolicy: true,
            host: { select: this.safeUserSelect },
          },
        },
        payments: true,
        refunds: { orderBy: { createdAt: 'desc' } },
        invoices: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${id}' not found`);
    }

    // Ownership check: Guest owner, Property host owner, or ADMIN allowed
    const isGuestOwner = booking.guestId === userId;
    const isHostOwner = booking.property.hostId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isGuestOwner && !isHostOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to view this booking',
      );
    }

    return booking;
  }

  // ============================================================================
  // 15. GUEST CANCELLATION WITH CANCELLATION POLICY & REFUND CALCULATION
  // ============================================================================
  async cancelBookingByGuest(
    id: string,
    dto: CancelGuestBookingDto,
    guestId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        payments: true,
        refunds: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${id}' not found`);
    }

    if (booking.guestId !== guestId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    // Calculate policy-based refund
    const refundCalc = this.cancellationService.calculateRefund(
      booking.property.cancellationPolicy,
      booking.checkIn,
      booking.totalAmount,
    );

    const cancellationInfo = {
      reason: dto.reason,
      cancelledBy: 'USER',
      cancelledAt: new Date().toISOString(),
      cancelledById: guestId,
      policy: refundCalc.policy,
      refundPercentage: refundCalc.refundPercentage,
      calculatedRefundAmount: refundCalc.refundAmount,
    };

    return this.prisma.$transaction(async (tx) => {
      const { refundRecord, newPaymentStatus, newRefundStatus } =
        await this.finalizeCancellationRefund(
          tx,
          booking,
          refundCalc,
          'GUEST',
          {
            reason: dto.reason,
            idempotencyKey: dto.idempotencyKey,
          },
        );

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: newPaymentStatus,
          refundStatus: newRefundStatus,
          cancellation: cancellationInfo,
        },
        include: {
          guest: { select: this.safeUserSelect },
          property: { select: this.safePropertySelect },
          refunds: true,
        },
      });

      return {
        booking: updatedBooking,
        cancellationSummary: refundCalc,
        refund: refundRecord,
      };
    });
  }

  // ============================================================================
  // 16. GUEST TRIPS PORTAL (ENRICHED WITH STAY GUIDE & HOST CONTACT INFO)
  // ============================================================================
  async findMyTrips(guestId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { guestId },
      orderBy: { checkIn: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            images: true,
            address: true,
            locality: true,
            city: true,
            state: true,
            country: true,
            cancellationPolicy: true,
            wifiNetwork: true,
            wifiPassword: true,
            checkInInstructions: true,
            houseRules: true,
            host: { select: this.safeUserSelect },
          },
        },
        review: true,
        invoices: true,
        payments: true,
      },
    });

    const now = new Date();

    const upcoming = bookings.filter(
      (b) =>
        (b.status === 'CONFIRMED' || b.status === 'PENDING') &&
        new Date(b.checkOut) >= now,
    );

    const completed = bookings.filter(
      (b) =>
        b.status === 'COMPLETED' ||
        (b.status === 'CONFIRMED' && new Date(b.checkOut) < now),
    );

    const cancelled = bookings.filter(
      (b) => b.status === 'CANCELLED' || b.status === 'EXPIRED',
    );

    return {
      summary: {
        totalTrips: bookings.length,
        upcomingCount: upcoming.length,
        completedCount: completed.length,
        cancelledCount: cancelled.length,
      },
      trips: {
        upcoming,
        completed,
        cancelled,
      },
    };
  }

  // ============================================================================
  // 17. BOOKING QUOTE & CHECKOUT PREVIEW APIS
  // ============================================================================
  async getBookingQuote(dto: CreateBookingQuoteDto) {
    const availability = await this.availabilityService.checkAvailability(
      dto.propertyId,
      dto.checkIn,
      dto.checkOut,
      dto.guests,
    );

    if (!availability.available) {
      return {
        available: false,
        reason: availability.reason || 'PROPERTY_NOT_AVAILABLE',
      };
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      return {
        available: false,
        reason: 'PROPERTY_NOT_FOUND',
      };
    }

    const start = new Date(dto.checkIn);
    const end = new Date(dto.checkOut);
    const nights = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const baseAmount = Number((property.basePrice * nights).toFixed(2));

    let discountAmount = 0;
    let couponError: string | undefined;
    if (dto.couponCode) {
      try {
        const couponRes = await this.couponsService.validateCoupon({
          code: dto.couponCode,
          orderAmount: baseAmount,
        });
        discountAmount = couponRes.discountAmount;
      } catch (err: unknown) {
        couponError =
          err instanceof Error ? err.message : 'Invalid coupon code';
      }
    }

    const pricing = this.pricingService.calculatePricing({
      basePrice: property.basePrice,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      cleaningFee: property.cleaningFee || 0,
      serviceFeeRate: property.serviceFeeRate || 0.1,
      taxRate: property.taxRate || 0.18,
      discountAmount,
    });

    return {
      available: true,
      propertyId: dto.propertyId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guests: dto.guests,
      pricing,
      couponError,
    };
  }

  async getCheckoutPreview(dto: CreateBookingQuoteDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: {
        host: { select: this.safeUserSelect },
      },
    });

    if (!property) {
      throw new NotFoundException(
        `Property with ID '${dto.propertyId}' not found`,
      );
    }

    const availability = await this.availabilityService.checkAvailability(
      dto.propertyId,
      dto.checkIn,
      dto.checkOut,
      dto.guests,
    );

    if (!availability.available) {
      throw new BadRequestException(
        availability.reason || 'Property is not available for requested dates',
      );
    }

    const start = new Date(dto.checkIn);
    const end = new Date(dto.checkOut);
    const nights = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const baseAmount = Number((property.basePrice * nights).toFixed(2));

    let discountAmount = 0;
    let couponError: string | undefined;
    if (dto.couponCode) {
      try {
        const couponRes = await this.couponsService.validateCoupon({
          code: dto.couponCode,
          orderAmount: baseAmount,
        });
        discountAmount = couponRes.discountAmount;
      } catch (err: unknown) {
        couponError =
          err instanceof Error ? err.message : 'Invalid coupon code';
      }
    }

    const pricing = this.pricingService.calculatePricing({
      basePrice: property.basePrice,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      cleaningFee: property.cleaningFee || 0,
      serviceFeeRate: property.serviceFeeRate || 0.1,
      taxRate: property.taxRate || 0.18,
      discountAmount,
    });

    return {
      available: true,
      property: {
        id: property.id,
        title: property.title,
        coverImage: property.coverImage,
        city: property.city,
        state: property.state,
        country: property.country,
        cancellationPolicy: property.cancellationPolicy,
        houseRules: property.houseRules,
        maxGuests: property.maxGuests,
        host: property.host,
      },
      stayDetails: {
        checkIn: dto.checkIn,
        checkOut: dto.checkOut,
        guests: dto.guests,
        nights: pricing.nights,
      },
      pricing,
      ...(couponError ? { couponError } : {}),
    };
  }

  // ============================================================================
  // 18. AUTO-EXPIRE PENDING BOOKINGS (PAST EXPIRES_AT)
  // ============================================================================
  async autoExpirePendingBookings() {
    return this.prisma.$transaction(async (tx) => {
      const stale = await tx.booking.findMany({
        where: {
          status: 'PENDING',
          paymentStatus: 'PENDING',
          expiresAt: { lte: new Date() },
        },
        select: { id: true, couponCode: true },
      });

      if (stale.length === 0) {
        return {
          message: 'Expired 0 stale pending bookings',
          count: 0,
        };
      }

      const expired = await tx.booking.updateMany({
        where: {
          id: { in: stale.map((b) => b.id) },
          status: 'PENDING',
        },
        data: {
          status: 'EXPIRED',
        },
      });

      const counts = new Map<string, number>();
      for (const b of stale) {
        if (b.couponCode) {
          counts.set(b.couponCode, (counts.get(b.couponCode) || 0) + 1);
        }
      }

      for (const [code, count] of counts.entries()) {
        await this.couponsService.releaseCoupon(tx, code, count);
      }

      return {
        message: `Expired ${expired.count} stale pending bookings`,
        count: expired.count,
      };
    });
  }

  // ============================================================================
  // 19. HOST-INITIATED CANCELLATION (WITH PENALTY CALCULATION)
  // ============================================================================
  async hostCancelBooking(hostId: string, bookingId: string, reason: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${bookingId}' not found`);
    }

    if (booking.property.hostId !== hostId) {
      throw new ForbiddenException(
        'Only the property host can initiate host cancellation',
      );
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictException('Booking is already cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const cancellationInfo = {
        reason: reason || 'Host cancelled booking',
        cancelledBy: 'HOST',
        cancelledAt: new Date().toISOString(),
        cancelledById: hostId,
        penaltyFee: booking.totalAmount * 0.1, // 10% host cancellation fee penalty
      };

      const { newPaymentStatus, newRefundStatus } =
        await this.finalizeCancellationRefund(
          tx,
          booking,
          null,
          'HOST',
          { reason },
        );

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentStatus: newPaymentStatus,
          refundStatus: newRefundStatus,
          cancellation: cancellationInfo,
        },
      });
    });
  }

  // ============================================================================
  // 20. MARK GUEST NO-SHOW
  // ============================================================================
  async markNoShow(userId: string, userRole: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${bookingId}' not found`);
    }

    if (booking.property.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Only property host or admin can mark guest no-show',
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        isNoShow: true,
        status: 'COMPLETED',
      },
    });
  }

  // ============================================================================
  // 21. BOOKING RESCHEDULE REQUEST & RESPONSE FLOW
  // ============================================================================
  async requestReschedule(
    guestId: string,
    bookingId: string,
    dto: { newCheckIn: string; newCheckOut: string; reason?: string },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${bookingId}' not found`);
    }

    if (booking.guestId !== guestId) {
      throw new ForbiddenException(
        'You can only request reschedule for your own bookings',
      );
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Only confirmed bookings can be rescheduled',
      );
    }

    // Availability check for new dates
    const avail = await this.availabilityService.checkAvailability(
      booking.propertyId,
      dto.newCheckIn,
      dto.newCheckOut,
      booking.guests,
    );

    if (!avail.available) {
      throw new ConflictException(
        avail.reason || 'New requested dates are unavailable',
      );
    }

    const reschedulePayload = {
      newCheckIn: dto.newCheckIn,
      newCheckOut: dto.newCheckOut,
      reason: dto.reason || null,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { rescheduleRequest: reschedulePayload },
    });
  }

  async respondReschedule(hostId: string, bookingId: string, action: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking || !booking.rescheduleRequest) {
      throw new NotFoundException(`Booking or reschedule request not found`);
    }

    if (booking.property.hostId !== hostId) {
      throw new ForbiddenException(
        'Only property host can respond to reschedule request',
      );
    }

    const reqData: any = booking.rescheduleRequest;

    if (action === 'REJECT') {
      return this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          rescheduleRequest: {
            ...reqData,
            status: 'REJECTED',
            respondedAt: new Date().toISOString(),
          },
        },
      });
    }

    // APPROVE
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkIn: new Date(reqData.newCheckIn),
        checkOut: new Date(reqData.newCheckOut),
        rescheduleRequest: {
          ...reqData,
          status: 'APPROVED',
          respondedAt: new Date().toISOString(),
        },
      },
    });
  }
}
