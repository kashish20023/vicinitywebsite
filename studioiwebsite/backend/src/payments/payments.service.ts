import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, PaymentStatus, PassStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createOrder(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status === BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking is already confirmed');
    }

    const orderNumber = `ORD-SI-${Date.now().toString().slice(-8)}`;
    const providerOrderId = `sim_order_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.paymentOrder.create({
      data: {
        bookingId: booking.id,
        orderNumber,
        provider: 'MOCK_GATEWAY',
        providerOrderId,
        amountPaise: booking.totalAmountPaise,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async verifyPayment(dto: {
    orderId: string;
    providerPaymentId?: string;
  }) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: dto.orderId },
      include: {
        booking: {
          include: {
            plan: true,
            unit: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Payment order not found');
    }

    // Idempotency check
    if (order.status === PaymentStatus.SUCCESS && order.booking.status === BookingStatus.CONFIRMED) {
      const existingPass = await this.prisma.digitalPass.findUnique({
        where: { bookingId: order.bookingId },
      });
      return {
        success: true,
        alreadyProcessed: true,
        booking: {
          id: order.booking.id,
          bookingNumber: order.booking.bookingNumber,
          status: order.booking.status,
        },
        digitalPass: existingPass,
      };
    }

    const providerPaymentId =
      dto.providerPaymentId || `sim_pay_${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark payment order as SUCCESS
      const updatedOrder = await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: PaymentStatus.SUCCESS,
          providerPaymentId,
          verifiedAt: new Date(),
        },
      });

      // 2. Mark booking as CONFIRMED
      const updatedBooking = await tx.booking.update({
        where: { id: order.bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      // 3. Generate signed digital access pass
      const passCode = `SI-PASS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const qrToken = `qr_${crypto.randomBytes(16).toString('hex')}`;
      const securityCode = Math.floor(1000 + Math.random() * 9000).toString();

      const digitalPass = await tx.digitalPass.upsert({
        where: { bookingId: updatedBooking.id },
        create: {
          bookingId: updatedBooking.id,
          userId: updatedBooking.userId,
          passCode,
          qrToken,
          securityCode,
          status: PassStatus.ACTIVE,
          validFrom: new Date(updatedBooking.startDateTime.getTime() - 15 * 60 * 1000), // 15 mins prior
          validUntil: new Date(updatedBooking.endDateTime.getTime() + 15 * 60 * 1000), // 15 mins after
        },
        update: {},
      });

      return {
        success: true,
        orderId: updatedOrder.id,
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          totalAmountPaise: updatedBooking.totalAmountPaise.toString(),
        },
        digitalPass: {
          id: digitalPass.id,
          passCode: digitalPass.passCode,
          qrToken: digitalPass.qrToken,
          securityCode: digitalPass.securityCode,
          status: digitalPass.status,
          validFrom: digitalPass.validFrom,
          validUntil: digitalPass.validUntil,
        },
      };
    });
  }

  async processRefund(dto: {
    orderId: string;
    amountPaise?: string;
    reason: string;
  }) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: dto.orderId },
      include: { booking: true },
    });
    if (!order) throw new NotFoundException('Payment order not found');
    if (order.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Cannot refund an unpaid or pending order');
    }

    const refundAmountPaise = dto.amountPaise ? BigInt(dto.amountPaise) : order.amountPaise;
    if (refundAmountPaise <= 0n || refundAmountPaise > order.amountPaise) {
      throw new BadRequestException('Invalid refund amount');
    }

    return this.prisma.$transaction(async (tx) => {
      const refundRecord = await tx.refundRecord.create({
        data: {
          paymentOrderId: order.id,
          amountPaise: refundAmountPaise,
          reason: dto.reason,
          status: 'COMPLETED',
          providerRefundId: `sim_ref_${crypto.randomBytes(8).toString('hex')}`,
        },
      });

      const isFullRefund = refundAmountPaise === order.amountPaise;
      await tx.booking.update({
        where: { id: order.bookingId },
        data: {
          status: isFullRefund ? BookingStatus.CANCELLED : order.booking.status,
          refundStatus: 'COMPLETED',
          refundAmountPaise: refundAmountPaise,
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
      });

      // Deactivate digital pass if fully refunded
      if (isFullRefund) {
        await tx.digitalPass.updateMany({
          where: { bookingId: order.bookingId },
          data: { status: PassStatus.REVOKED },
        });
      }

      return {
        success: true,
        refundId: refundRecord.id,
        refundAmountPaise: refundRecord.amountPaise.toString(),
        refundAmountRupees: Number(refundRecord.amountPaise) / 100,
        bookingStatus: isFullRefund ? 'CANCELLED' : order.booking.status,
      };
    });
  }

}
