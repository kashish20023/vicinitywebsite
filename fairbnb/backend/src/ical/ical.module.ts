import { Module } from '@nestjs/common';
import { IcalController } from './ical.controller.js';
import { IcalService } from './ical.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [IcalController],
  providers: [IcalService],
  exports: [IcalService],
})
export class IcalModule {}
