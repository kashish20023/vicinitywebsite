import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { UpdateProfileDto, SubmitKycDto } from './profile.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.profileService.getProfile(user.id);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Post('kyc')
  async submitKyc(
    @CurrentUser() user: any,
    @Body() dto: SubmitKycDto,
  ) {
    return this.profileService.submitKyc(user.id, dto);
  }
}
