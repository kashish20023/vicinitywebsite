import { Module, Global } from '@nestjs/common';
import { AuditLogController } from './audit-logs.controller.js';
import { AuditLogService } from './audit-logs.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
