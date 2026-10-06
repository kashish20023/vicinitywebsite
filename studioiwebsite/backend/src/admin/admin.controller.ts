import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('bookings')
  async getBookings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.adminService.getAllBookings({ page, limit, status, workspaceId });
  }

  @Get('users')
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
  ) {
    return this.adminService.getAllUsers({ page, limit, role });
  }

  @Patch('users/:id/block')
  async toggleBlock(
    @Param('id') id: string,
    @Body('isBlocked') isBlocked: boolean,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.toggleUserBlock(id, isBlocked, reason);
  }

  @Get('finance/summary')
  async getFinanceSummary() {
    return this.adminService.getFinanceSummary();
  }

  @Post('floors/:id/publish-layout')
  async publishFloorPlan(
    @Param('id') id: string,
    @Body()
    body: {
      canvasWidth?: number;
      canvasHeight?: number;
      units: any[];
      objects?: any[];
    },
  ) {
    return this.adminService.publishFloorPlan({
      floorId: id,
      canvasWidth: body.canvasWidth,
      canvasHeight: body.canvasHeight,
      units: body.units,
      objects: body.objects,
    });
  }

  @Get('payouts')
  async getAllPayouts() {
    return this.adminService.getAllPayoutRequests();
  }

  @Get('co-hosts')
  async getAllCoHosts() {
    return this.adminService.getAllCoHosts();
  }

  @Post('payouts/:id/process')
  async processPayout(
    @Param('id') id: string,
    @Body() dto: { action: 'APPROVE' | 'REJECT'; notes?: string },
  ) {
    return this.adminService.processPayoutRequest(id, dto.action, dto.notes);
  }
}
