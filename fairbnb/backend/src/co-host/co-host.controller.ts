import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoHostService } from './co-host.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { InviteCoHostDto } from './dto/invite-cohost.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { PayoutSettingsDto } from './dto/payout-settings.dto.js';
import { CoHostPermissionGuard } from './guards/cohost-permission.guard.js';
import { RequireCoHostPermission } from './decorators/co-host-permission.decorator.js';
import { CoHostPermissionEnum } from '@prisma/client';

@Controller()
export class CoHostController {
  constructor(private readonly coHostService: CoHostService) { }

  // HOST CO-HOST MANAGEMENT APIS

  @Post('properties/:propertyId/co-hosts/invite')
  @UseGuards(JwtAuthGuard)
  async inviteCoHost(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: any,
    @Body() dto: InviteCoHostDto,
  ) {
    return this.coHostService.inviteCoHost(user.id, propertyId, dto);
  }

  @Get('properties/:propertyId/co-hosts')
  @UseGuards(JwtAuthGuard)
  async getPropertyCoHosts(@Param('propertyId') propertyId: string) {
    return this.coHostService.getPropertyCoHosts(propertyId);
  }

  @Get('properties/:propertyId/co-hosts/:coHostId')
  @UseGuards(JwtAuthGuard)
  async getCoHostById(@Param('coHostId') coHostId: string) {
    return this.coHostService.getCoHostById(coHostId);
  }

  @Patch('co-hosts/:coHostId/permissions')
  @UseGuards(JwtAuthGuard)
  async updatePermissions(
    @Param('coHostId') coHostId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.coHostService.updatePermissions(coHostId, user.id, dto);
  }

  @Patch('co-hosts/:coHostId/payout')
  @UseGuards(JwtAuthGuard)
  async configurePayout(
    @Param('coHostId') coHostId: string,
    @CurrentUser() user: any,
    @Body() dto: PayoutSettingsDto,
  ) {
    return this.coHostService.configurePayoutRule(coHostId, user.id, dto);
  }

  @Post('co-hosts/:coHostId/suspend')
  @UseGuards(JwtAuthGuard)
  async suspendCoHost(
    @Param('coHostId') coHostId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.suspendCoHost(coHostId, user.id);
  }

  @Post('co-hosts/:coHostId/reactivate')
  @UseGuards(JwtAuthGuard)
  async reactivateCoHost(
    @Param('coHostId') coHostId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.reactivateCoHost(coHostId, user.id);
  }

  @Delete('co-hosts/:coHostId')
  @UseGuards(JwtAuthGuard)
  async removeCoHost(
    @Param('coHostId') coHostId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.removeCoHost(coHostId, user.id);
  }

  // INVITATION APIS

  @Get('co-hosts/invitations/:token')
  async getInvitation(@Param('token') token: string) {
    return this.coHostService.getInvitationByToken(token);
  }

  @Post('co-hosts/invitations/:token/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.acceptInvitation(token, user.id);
  }

  @Post('co-hosts/invitations/:token/decline')
  @UseGuards(JwtAuthGuard)
  async declineInvitation(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.declineInvitation(token, user.id);
  }

  @Delete('co-hosts/invitations/:invitationId')
  @UseGuards(JwtAuthGuard)
  async revokeInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.revokeInvitation(invitationId, user.id);
  }

  @Get('co-hosts/me/invitations')
  @UseGuards(JwtAuthGuard)
  async getMySentInvitations(@CurrentUser() user: any) {
    return this.coHostService.getSentInvitations(user.id);
  }

  // CO-HOST DASHBOARD & MODULE APIS

  @Get('co-host/me/properties')
  @UseGuards(JwtAuthGuard)
  async getMyCoHostProperties(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.coHostService.getCoHostProperties(user.id, pageNum, limitNum);
  }

  @Post('co-hosts/payout-rules/:ruleId/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayoutRule(
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.confirmPayoutRule(ruleId, user.id);
  }

  @Get('co-host/properties/:propertyId/dashboard')
  @UseGuards(JwtAuthGuard, CoHostPermissionGuard)
  async getCoHostDashboard(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.getCoHostDashboard(propertyId, user.id);
  }

  @Get('co-host/properties/:propertyId/calendar')
  @UseGuards(JwtAuthGuard, CoHostPermissionGuard)
  @RequireCoHostPermission(CoHostPermissionEnum.VIEW_CALENDAR)
  async getCoHostCalendar(@Param('propertyId') propertyId: string) {
    return { status: 'success', access: 'VIEW_CALENDAR', propertyId };
  }

  @Get('co-host/properties/:propertyId/bookings')
  @UseGuards(JwtAuthGuard, CoHostPermissionGuard)
  @RequireCoHostPermission(CoHostPermissionEnum.VIEW_BOOKINGS)
  async getCoHostBookings(@Param('propertyId') propertyId: string) {
    return this.coHostService.getCoHostPropertyBookings(propertyId);
  }

  @Get('co-host/properties/:propertyId/messages')
  @UseGuards(JwtAuthGuard, CoHostPermissionGuard)
  @RequireCoHostPermission(CoHostPermissionEnum.MESSAGE_GUESTS)
  async getCoHostMessages(@Param('propertyId') propertyId: string) {
    return { status: 'success', access: 'MESSAGE_GUESTS', propertyId };
  }

  @Get('co-host/properties/:propertyId/maintenance')
  @UseGuards(JwtAuthGuard, CoHostPermissionGuard)
  @RequireCoHostPermission(CoHostPermissionEnum.MANAGE_MAINTENANCE)
  async getCoHostMaintenance(@Param('propertyId') propertyId: string) {
    return { status: 'success', access: 'MANAGE_MAINTENANCE', propertyId };
  }

  @Get('co-host/properties/:propertyId/reviews')
  @UseGuards(JwtAuthGuard, CoHostPermissionGuard)
  @RequireCoHostPermission(CoHostPermissionEnum.VIEW_REVIEWS)
  async getCoHostReviews(@Param('propertyId') propertyId: string) {
    return { status: 'success', access: 'VIEW_REVIEWS', propertyId };
  }
}
