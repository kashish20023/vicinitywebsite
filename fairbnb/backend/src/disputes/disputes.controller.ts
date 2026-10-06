import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { DisputesService } from './disputes.service.js';
import { FileDisputeDto, ResolveDisputeDto } from './disputes.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  async fileDispute(
    @CurrentUser() user: any,
    @Body() dto: FileDisputeDto,
  ) {
    return this.disputesService.fileDispute(user.id, dto);
  }

  @Get()
  async getDisputes(@CurrentUser() user: any) {
    return this.disputesService.getDisputes(user.id, user.role);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async resolveDispute(
    @Param('id') disputeId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(disputeId, dto);
  }
}
