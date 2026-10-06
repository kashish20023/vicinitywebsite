import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FinancialCoordinationService } from './financial-coordination.service.js';
import { SettlementService } from './settlement.service.js';
import { CashfreeProvider } from './providers/cashfree.provider.js';
import { TransferExecutionService } from './transfer-execution.service.js';
import { PostPayoutAdjustmentsService } from './post-payout-adjustments.service.js';
import {
  AdminSettlementController,
  RecipientPayoutController,
  CashfreeWebhookController,
} from './settlement.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminSettlementController,
    RecipientPayoutController,
    CashfreeWebhookController,
  ],
  providers: [
    FinancialCoordinationService,
    SettlementService,
    CashfreeProvider,
    TransferExecutionService,
    PostPayoutAdjustmentsService,
  ],
  exports: [
    FinancialCoordinationService,
    SettlementService,
    CashfreeProvider,
    TransferExecutionService,
    PostPayoutAdjustmentsService,
  ],
})
export class PayoutsModule {}
