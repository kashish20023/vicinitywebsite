import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HostsService } from './hosts.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  @Get('profile/:hostId')
  async getPublicHostProfile(@Param('hostId') hostId: string) {
    return this.hostsService.getPublicHostProfile(hostId);
  }

  @Get('dashboard/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.HOST, Role.ADMIN)
  async getHostDashboardStats(@CurrentUser() user: any) {
    return this.hostsService.getHostDashboardStats(user.id);
  }

  @Get('workspaces')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.HOST, Role.ADMIN)
  async getHostWorkspaces(@CurrentUser() user: any) {
    return this.hostsService.getHostWorkspaces(user.id);
  }

  @Get('payouts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.HOST, Role.ADMIN)
  async getHostPayouts(@CurrentUser() user: any) {
    return this.hostsService.getHostPayouts(user.id);
  }

  @Post('payouts/request')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.HOST, Role.ADMIN)
  async requestPayout(
    @CurrentUser() user: any,
    @Body() dto: { amountRupees: number; bankAccount?: string; notes?: string },
  ) {
    return this.hostsService.requestPayout(user.id, dto);
  }
}
