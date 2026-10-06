import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AutomatedMessagesService } from './automated-messages.service.js';
import { CreateAutomatedMessageRuleDto } from './automated-messages.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('automated-messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOST, UserRole.ADMIN)
export class AutomatedMessagesController {
  constructor(private readonly automatedMessagesService: AutomatedMessagesService) {}

  @Post()
  async createRule(
    @CurrentUser() user: any,
    @Body() dto: CreateAutomatedMessageRuleDto,
  ) {
    return this.automatedMessagesService.createRule(user.id, dto);
  }

  @Get()
  async getHostRules(@CurrentUser() user: any) {
    return this.automatedMessagesService.getHostRules(user.id);
  }

  @Patch(':id/toggle')
  async toggleRuleStatus(
    @CurrentUser() user: any,
    @Param('id') ruleId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.automatedMessagesService.toggleRuleStatus(user.id, ruleId, isActive);
  }

  @Delete(':id')
  async deleteRule(
    @CurrentUser() user: any,
    @Param('id') ruleId: string,
  ) {
    return this.automatedMessagesService.deleteRule(user.id, ruleId);
  }
}
