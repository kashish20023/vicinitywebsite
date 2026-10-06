import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { HostsService } from './hosts.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  @Get('profile/:hostId')
  async getPublicHostProfile(@Param('hostId') hostId: string) {
    return this.hostsService.getPublicHostProfile(hostId);
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  async getHostDashboardStats(@CurrentUser() user: any) {
    return this.hostsService.getHostDashboardStats(user.id);
  }
}
