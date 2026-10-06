import { Module } from '@nestjs/common';
import { HostsController } from './hosts.controller.js';
import { HostsService } from './hosts.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [HostsController],
  providers: [HostsService],
  exports: [HostsService],
})
export class HostsModule {}
