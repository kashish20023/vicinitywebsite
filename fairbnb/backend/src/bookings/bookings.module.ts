import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller.js';
import { AdminBookingsController } from './admin-bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { PricingService } from './pricing.service.js';
import { AvailabilityService } from './availability.service.js';
import { CancellationService } from './cancellation.service.js';
import { MockRazorpayProvider } from '../payments/providers/mock-razorpay.provider.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { PayoutsModule } from '../payouts/payouts.module.js';
import { AuditLogModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [PrismaModule, CouponsModule, PayoutsModule, AuditLogModule],
  controllers: [BookingsController, AdminBookingsController],
  providers: [
    BookingsService,
    PricingService,
    AvailabilityService,
    CancellationService,
    MockRazorpayProvider,
  ],
  exports: [
    BookingsService,
    PricingService,
    AvailabilityService,
    CancellationService,
    MockRazorpayProvider,
  ],
})
export class BookingsModule {}
