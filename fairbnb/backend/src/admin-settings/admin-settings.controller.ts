import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service.js';
import { UpdateSystemSettingDto } from './admin-settings.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('admin-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  async getAllSettings() {
    return this.adminSettingsService.getAllSettings();
  }

  @Get(':key')
  async getSettingByKey(@Param('key') key: string) {
    return this.adminSettingsService.getSettingByKey(key);
  }

  @Patch()
  async updateSetting(@Body() dto: UpdateSystemSettingDto) {
    return this.adminSettingsService.updateSetting(dto);
  }
}
