import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-order')
  @UseGuards(AuthGuard('jwt'))
  async createOrder(@Body() dto: { bookingId: string }) {
    return this.paymentsService.createOrder(dto.bookingId);
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  async verifyPayment(
    @Body()
    dto: {
      orderId: string;
      providerPaymentId?: string;
    },
  ) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('refund')
  @UseGuards(AuthGuard('jwt'))
  async processRefund(
    @Body()
    dto: {
      orderId: string;
      amountPaise?: string;
      reason: string;
    },
  ) {
    return this.paymentsService.processRefund(dto);
  }

}
