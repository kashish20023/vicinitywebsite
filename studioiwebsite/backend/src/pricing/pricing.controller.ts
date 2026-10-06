import { Controller, Post, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('bookings')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Post('quote')
  async getQuote(
    @Body()
    body: {
      unitId: string;
      planId: string;
      startDateTime?: string;
      endDateTime?: string;
      holdId?: string;
      couponCode?: string;
      addOnIds?: string[];
      userId?: string;
    },
  ) {
    const start = body.startDateTime ? new Date(body.startDateTime) : undefined;
    const end = body.endDateTime ? new Date(body.endDateTime) : undefined;

    return this.pricingService.calculateQuote({
      unitId: body.unitId,
      planId: body.planId,
      startDateTime: start,
      endDateTime: end,
      holdId: body.holdId,
      couponCode: body.couponCode,
      addOnIds: body.addOnIds,
      userId: body.userId,
    });
  }
}
