import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service.js';
import { BlockDatesDto, CreateCustomPricingRuleDto } from './calendar.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('property/:propertyId')
  async getPropertyCalendar(@Param('propertyId') propertyId: string) {
    return this.calendarService.getPropertyCalendar(propertyId);
  }

  @Post('block-dates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  async blockDates(
    @CurrentUser() user: any,
    @Body() dto: BlockDatesDto,
  ) {
    return this.calendarService.blockDates(user.id, user.role, dto);
  }

  @Post('pricing-rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  async createPricingRule(
    @CurrentUser() user: any,
    @Body() dto: CreateCustomPricingRuleDto,
  ) {
    return this.calendarService.createPricingRule(user.id, user.role, dto);
  }
}
