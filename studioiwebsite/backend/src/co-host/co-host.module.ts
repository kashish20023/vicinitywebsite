import { Module } from '@nestjs/common';
import { CoHostController } from './co-host.controller';
import { CoHostService } from './co-host.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CohostPermissionGuard } from './guards/cohost-permission.guard';

@Module({
  imports: [PrismaModule],
  controllers: [CoHostController],
  providers: [CoHostService, CohostPermissionGuard],
  exports: [CoHostService, CohostPermissionGuard],
})
export class CoHostModule {}
