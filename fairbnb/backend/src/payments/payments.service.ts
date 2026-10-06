import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MockRazorpayProvider } from './providers/mock-razorpay.provider.js';
import { PaymentWebhookDto } from './dto/payment-webhook.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentProvider: MockRazorpayProvider,
  ) {}

  async createPaymentForBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking '${bookingId}' not found`);
    }

    if (booking.guestId !== userId) {
      throw new BadRequestException(
        'You can only create payments for your own bookings',
      );
    }

    if (booking.status === 'CONFIRMED' || booking.paymentStatus === 'PAID') {
      throw new BadRequestException('Booking is already paid and confirmed');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      throw new BadRequestException(
        `Cannot create payment for a ${booking.status} booking`,
      );
    }

    // Check for existing pending payment
    const existingPending = booking.payments.find(
      (p) => p.status === 'PENDING',
    );
    if (existingPending) {
      return {
        payment: existingPending,
        booking,
      };
    }

    const orderResult = await this.paymentProvider.createOrder({
      bookingId: booking.id,
      amount: booking.totalAmount,
      currency: booking.currency || 'INR',
    });

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency || 'INR',
        provider: orderResult.provider,
        providerOrderId: orderResult.providerOrderId,
        providerPaymentId: orderResult.providerPaymentId,
        status: 'PENDING',
      },
    });

    return {
      payment,
      booking,
    };
  }

  async handleWebhook(dto: PaymentWebhookDto) {
    const { event, payload, signature, idempotencyKey } = dto;

    if (
      !this.paymentProvider.verifyWebhookSignature(payload, signature || '')
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const providerOrderId = payload.providerOrderId || payload.order_id;
    const providerPaymentId = payload.providerPaymentId || payload.payment_id;

    let payment: any = null;
    if (providerOrderId) {
      payment = await this.prisma.payment.findFirst({
        where: { providerOrderId },
        include: { booking: true },
      });
    }
    if (!payment && providerPaymentId) {
      payment = await this.prisma.payment.findFirst({
        where: { providerPaymentId },
        include: { booking: true },
      });
    }

    if (!payment) {
      throw new NotFoundException('Payment record not found for webhook event');
    }

    // Idempotency check: If payment is already marked PAID, return existing state without duplicate side-effects
    if (
      payment.status === 'PAID' &&
      (event === 'payment.captured' || event === 'payment.authorized')
    ) {
      return {
        success: true,
        message: 'Webhook already processed (Idempotent response)',
        payment,
      };
    }

    if (
      event === 'payment.captured' ||
      event === 'payment.authorized' ||
      event === 'payment.success'
    ) {
      return this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            providerPaymentId: providerPaymentId || payment.providerPaymentId,
            paidAt: new Date(),
            idempotencyKey: idempotencyKey || undefined,
          },
        });

        const updatedBooking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentId: updatedPayment.id,
          },
        });

        // Automated Invoice Generation
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const existingInvoice = await tx.invoice.findFirst({
          where: { bookingId: payment.bookingId },
        });

        let invoice = existingInvoice;
        if (!existingInvoice) {
          invoice = await tx.invoice.create({
            data: {
              bookingId: payment.bookingId,
              invoiceNumber,
              amount: payment.amount,
              status: 'PAID',
            },
          });
        }

        // Automated Financial Ledger Entries Creation
        if (tx.property && tx.financialTransaction) {
          const property = await tx.property.findUnique({
            where: { id: updatedBooking.propertyId },
            select: { hostId: true },
          });

          const grossAmount = payment.amount;
          const platformFee = updatedBooking.serviceFee || Number((grossAmount * 0.10).toFixed(2));

          // 1. Gross payment entry
          await tx.financialTransaction.create({
            data: {
              bookingId: payment.bookingId,
              propertyId: updatedBooking.propertyId,
              type: 'BOOKING_PAYMENT',
              amount: grossAmount,
              currency: payment.currency || 'INR',
              status: 'COMPLETED',
            },
          });

          // 2. Platform fee entry
          await tx.financialTransaction.create({
            data: {
              bookingId: payment.bookingId,
              propertyId: updatedBooking.propertyId,
              type: 'PLATFORM_FEE',
              amount: platformFee,
              currency: payment.currency || 'INR',
              status: 'COMPLETED',
            },
          });

          // 3. Co-Host payout & Host payout split entries
          const activePayoutRule = tx.payoutRule
            ? await tx.payoutRule.findFirst({
                where: {
                  propertyId: updatedBooking.propertyId,
                  status: 'ACTIVE',
                },
              })
            : null;

          let coHostPayoutAmount = 0;
          if (activePayoutRule && activePayoutRule.recipientUserId) {
            if (activePayoutRule.percentage) {
              coHostPayoutAmount = Number(((grossAmount - platformFee) * (activePayoutRule.percentage / 100)).toFixed(2));
            } else if (activePayoutRule.fixedAmount) {
              coHostPayoutAmount = activePayoutRule.fixedAmount;
            }

            if (coHostPayoutAmount > 0) {
              await tx.financialTransaction.create({
                data: {
                  bookingId: payment.bookingId,
                  propertyId: updatedBooking.propertyId,
                  recipientId: activePayoutRule.recipientUserId,
                  type: 'COHOST_PAYOUT',
                  amount: coHostPayoutAmount,
                  currency: payment.currency || 'INR',
                  status: 'COMPLETED',
                },
              });
            }
          }

          const hostPayoutAmount = Number((grossAmount - platformFee - coHostPayoutAmount).toFixed(2));
          if (property?.hostId) {
            await tx.financialTransaction.create({
              data: {
                bookingId: payment.bookingId,
                propertyId: updatedBooking.propertyId,
                recipientId: property.hostId,
                type: 'HOST_PAYOUT',
                amount: hostPayoutAmount,
                currency: payment.currency || 'INR',
                status: 'COMPLETED',
              },
            });
          }
        }

        return {
          success: true,
          event,
          payment: updatedPayment,
          booking: updatedBooking,
          invoice,
        };
      });
    }

    if (event === 'payment.failed') {
      return this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: payload.failureReason || 'Payment failed at gateway',
          },
        });

        const updatedBooking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'EXPIRED',
            paymentStatus: 'FAILED',
          },
        });

        if (payment.booking?.couponCode && payment.status !== 'FAILED') {
          await tx.coupon.updateMany({
            where: {
              code: payment.booking.couponCode,
              timesUsed: { gt: 0 },
            },
            data: {
              timesUsed: { decrement: 1 },
            },
          });
        }

        return {
          success: false,
          event,
          payment: updatedPayment,
          booking: updatedBooking,
        };
      });
    }

    return {
      success: true,
      message: `Ignored unhandled event '${event}'`,
    };
  }

  async getPaymentByBookingId(bookingId: string) {
    return this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
