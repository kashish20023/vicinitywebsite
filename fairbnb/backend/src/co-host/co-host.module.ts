import { Module } from '@nestjs/common';
import { CoHostController } from './co-host.controller.js';
import { CoHostService } from './co-host.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AuditLogModule } from '../audit-logs/audit-logs.module.js';
import { CoHostPermissionGuard } from './guards/cohost-permission.guard.js';

@Module({
  imports: [PrismaModule, NotificationsModule, AuditLogModule],
  controllers: [CoHostController],
  providers: [CoHostService, CoHostPermissionGuard],
  exports: [CoHostService, CoHostPermissionGuard],
})
export class CoHostModule {}
