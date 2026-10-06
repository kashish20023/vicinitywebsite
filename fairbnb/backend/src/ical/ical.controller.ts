import { Controller, Get, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { IcalService } from './ical.service.js';
import { RegisterExternalIcalFeedDto } from './ical.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('ical')
export class IcalController {
  constructor(private readonly icalService: IcalService) {}

  @Get('properties/:id/calendar.ics')
  async exportIcalFeed(
    @Param('id') propertyId: string,
    @Res() res: Response,
  ) {
    const icalContent = await this.icalService.generateIcalFeed(propertyId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="calendar-${propertyId}.ics"`);
    return res.send(icalContent);
  }

  @Post('feeds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  async registerExternalFeed(
    @CurrentUser() user: any,
    @Body() dto: RegisterExternalIcalFeedDto,
  ) {
    return this.icalService.registerExternalFeed(user.id, user.role, dto);
  }

  @Get('properties/:id/feeds')
  @UseGuards(JwtAuthGuard)
  async listExternalFeeds(@Param('id') propertyId: string) {
    return this.icalService.listExternalFeeds(propertyId);
  }

  @Post('feeds/:id/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  async triggerSyncNow(
    @CurrentUser() user: any,
    @Param('id') feedId: string,
  ) {
    return this.icalService.triggerSyncNow(user.id, user.role, feedId);
  }
}
