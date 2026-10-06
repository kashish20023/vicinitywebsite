import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { PricingService } from '../pricing/pricing.service';
import { BookingStatus, HoldStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private availabilityService: AvailabilityService,
    private pricingService: PricingService,
  ) {}

  async createHold(dto: {
    userId: string;
    unitId: string;
    startDateTime: string;
    endDateTime: string;
  }) {
    return this.availabilityService.acquireUnitHold({
      userId: dto.userId,
      unitId: dto.unitId,
      startDateTime: new Date(dto.startDateTime),
      endDateTime: new Date(dto.endDateTime),
      ttlMinutes: 10,
    });
  }

  async createBooking(dto: {
    userId: string;
    holdId: string;
    planId: string;
    couponCode?: string;
  }) {
    const hold = await this.prisma.inventoryHold.findUnique({
      where: { id: dto.holdId },
      include: {
        unit: {
          include: {
            floor: { include: { building: { include: { workspace: true } } } },
          },
        },
      },
    });

    if (!hold || hold.status !== HoldStatus.ACTIVE) {
      throw new BadRequestException('Hold has expired or is invalid. Please select your workspace seat again.');
    }
    if (new Date() > hold.expiresAt) {
      await this.prisma.inventoryHold.update({
        where: { id: hold.id },
        data: { status: HoldStatus.EXPIRED },
      });
      throw new BadRequestException('Hold has timed out (10 minutes limit). Please select your seat again.');
    }
    if (hold.userId !== dto.userId) {
      throw new ForbiddenException('Hold belongs to another user');
    }

    const quote = await this.pricingService.calculateQuote({
      unitId: hold.unitId,
      planId: dto.planId,
      holdId: hold.id,
      couponCode: dto.couponCode,
      userId: dto.userId,
    });

    const bookingNumber = `SI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const orderNumber = `ORD-SI-${Date.now().toString().slice(-8)}`;
    const providerOrderId = `sim_order_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          userId: dto.userId,
          workspaceId: hold.unit.floor.building.workspace.id,
          unitId: hold.unitId,
          planId: dto.planId,
          holdId: hold.id,
          startDateTime: hold.startDateTime,
          endDateTime: hold.endDateTime,
          status: BookingStatus.PENDING_PAYMENT,
          currency: 'INR',
          baseRatePaise: BigInt(quote.pricing.baseRatePaise),
          durationSlots: quote.plan.multiplier,
          subtotalPaise: BigInt(quote.pricing.subtotalPaise),
          discountPaise: BigInt(quote.pricing.discountPaise),
          couponCode: dto.couponCode?.trim().toUpperCase() || null,
          taxPaise: BigInt(quote.pricing.taxPaise),
          securityDepositPaise: BigInt(quote.pricing.securityDepositPaise),
          totalAmountPaise: BigInt(quote.pricing.totalPayablePaise),
        },
      });

      // Mark hold confirmed
      await tx.inventoryHold.update({
        where: { id: hold.id },
        data: { status: HoldStatus.CONVERTED },
      });

      // Create initial PaymentOrder
      const paymentOrder = await tx.paymentOrder.create({
        data: {
          bookingId: booking.id,
          orderNumber,
          amountPaise: booking.totalAmountPaise,
          provider: 'MOCK_GATEWAY',
          providerOrderId,
          status: 'PENDING',
        },
      });

      return {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        totalAmountPaise: booking.totalAmountPaise.toString(),
        totalAmountRupees: Number(booking.totalAmountPaise) / 100,
        paymentOrder: {
          id: paymentOrder.id,
          orderNumber: paymentOrder.orderNumber,
          providerOrderId: paymentOrder.providerOrderId,
          amountPaise: paymentOrder.amountPaise.toString(),
        },
      };
    });
  }

  async getUserBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        workspace: { select: { id: true, name: true, slug: true, city: true, address: true } },
        unit: { select: { id: true, name: true, unitCode: true, unitType: true } },
        plan: { select: { id: true, title: true, planType: true } },
        paymentOrder: true,
        digitalPass: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => ({
      ...b,
      totalAmountPaise: b.totalAmountPaise.toString(),
      baseRatePaise: b.baseRatePaise.toString(),
      subtotalPaise: b.subtotalPaise.toString(),
      discountPaise: b.discountPaise.toString(),
      taxPaise: b.taxPaise.toString(),
      securityDepositPaise: b.securityDepositPaise.toString(),
    }));
  }

  async getBookingById(id: string, userId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        workspace: true,
        unit: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
        plan: true,
        paymentOrder: true,
        digitalPass: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (userId && booking.userId !== userId) {
      throw new ForbiddenException('Access denied to this booking');
    }

    return {
      ...booking,
      totalAmountPaise: booking.totalAmountPaise.toString(),
      baseRatePaise: booking.baseRatePaise.toString(),
      subtotalPaise: booking.subtotalPaise.toString(),
      discountPaise: booking.discountPaise.toString(),
      taxPaise: booking.taxPaise.toString(),
      securityDepositPaise: booking.securityDepositPaise.toString(),
    };
  }
}
