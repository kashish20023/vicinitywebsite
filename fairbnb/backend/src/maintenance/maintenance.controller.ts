import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import { CreateMaintenanceRequestDto, UpdateMaintenanceStatusDto } from './maintenance.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  async createTicket(
    @CurrentUser() user: any,
    @Body() dto: CreateMaintenanceRequestDto,
  ) {
    return this.maintenanceService.createTicket(user.id, dto);
  }

  @Get()
  async getTicketsForUser(@CurrentUser() user: any) {
    return this.maintenanceService.getTicketsForUser(user.id, user.role);
  }

  @Patch(':id/status')
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Body() dto: UpdateMaintenanceStatusDto,
  ) {
    return this.maintenanceService.updateTicketStatus(ticketId, dto);
  }
}
