import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoHostService } from './co-host.service';
import { CurrentUser } from '../common/current-user.decorator';
import { CohostPermissionGuard } from './guards/cohost-permission.guard';
import { RequireCohostPermission } from './decorators/co-host-permission.decorator';

@Controller()
export class CoHostController {
  constructor(private readonly coHostService: CoHostService) {}

  // HOST CO-HOST MANAGEMENT APIS

  @Post('workspaces/:workspaceId/co-hosts/invite')
  @UseGuards(AuthGuard('jwt'))
  async inviteCoHost(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: { email: string; name?: string; mobileNo?: string; permissions?: any },
  ) {
    return this.coHostService.inviteCoHost(user.id, workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/co-hosts')
  @UseGuards(AuthGuard('jwt'))
  async getWorkspaceCoHosts(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.getWorkspaceCoHosts(workspaceId, user.id);
  }

  @Patch('co-hosts/:permissionId/permissions')
  @UseGuards(AuthGuard('jwt'))
  async updatePermissions(
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.coHostService.updatePermissions(permissionId, user.id, dto);
  }

  @Delete('co-hosts/:permissionId')
  @UseGuards(AuthGuard('jwt'))
  async removeCoHost(
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.removeCoHost(permissionId, user.id);
  }

  // INVITATION APIS

  @Get('co-hosts/invitations/:token')
  async getInvitation(@Param('token') token: string) {
    return this.coHostService.getInvitationByToken(token);
  }

  @Post('co-hosts/invitations/:token/accept')
  @UseGuards(AuthGuard('jwt'))
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.acceptInvitation(token, user.id);
  }

  @Post('co-hosts/invitations/:token/decline')
  @UseGuards(AuthGuard('jwt'))
  async declineInvitation(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.declineInvitation(token, user.id);
  }

  // CO-HOST DELEGATED VIEWS

  @Get('co-host/me/workspaces')
  @UseGuards(AuthGuard('jwt'))
  async getMyCoHostWorkspaces(@CurrentUser() user: any) {
    return this.coHostService.getMyCoHostWorkspaces(user.id);
  }

  @Get('co-host/workspaces/:workspaceId/dashboard')
  @UseGuards(AuthGuard('jwt'), CohostPermissionGuard)
  async getCoHostDashboard(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    return this.coHostService.getCoHostDashboard(workspaceId, user.id);
  }

  @Get('co-host/workspaces/:workspaceId/bookings')
  @UseGuards(AuthGuard('jwt'), CohostPermissionGuard)
  @RequireCohostPermission('canManageBookings')
  async getCoHostBookings(@Param('workspaceId') workspaceId: string) {
    return this.coHostService.getCoHostBookings(workspaceId);
  }
}
