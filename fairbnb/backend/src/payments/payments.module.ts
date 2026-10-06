import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { MockRazorpayProvider } from './providers/mock-razorpay.provider.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockRazorpayProvider],
  exports: [PaymentsService, MockRazorpayProvider],
})
export class PaymentsModule {}
