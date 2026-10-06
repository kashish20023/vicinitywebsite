import { Module } from '@nestjs/common';
import { TrustSafetyService } from './trust-safety.service.js';
import { TrustSafetyController } from './trust-safety.controller.js';
import { InvestigationService } from './investigation/investigation.service.js';

@Module({
  controllers: [TrustSafetyController],
  providers: [TrustSafetyService, InvestigationService],
  exports: [TrustSafetyService, InvestigationService],
})
export class TrustSafetyModule {}
