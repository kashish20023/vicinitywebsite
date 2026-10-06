import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentWebhookDto } from './dto/payment-webhook.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/create-order
   * Create payment order for a pending booking
   */
  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @CurrentUser() user: any,
    @Body('bookingId') bookingId: string,
  ) {
    return this.paymentsService.createPaymentForBooking(bookingId, user.id);
  }

  /**
   * POST /payments/webhook
   * Public secure webhook endpoint for payment provider notifications (Idempotent)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() dto: PaymentWebhookDto) {
    return this.paymentsService.handleWebhook(dto);
  }

  /**
   * GET /payments/booking/:bookingId
   * Fetch payment logs for a booking
   */
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByBookingId(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentByBookingId(bookingId);
  }
}
