import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard.js';
import { ListingQualityService } from './listing-quality.service.js';
import type { ListingQualityRequestDto, ListingQualityResponseDto } from './listing-quality.types.js';

@Controller('ai/hosting')
export class ListingQualityController {
  constructor(private readonly qualityService: ListingQualityService) {}

  @Post('listing-quality')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async evaluateListing(
    @Body() dto: ListingQualityRequestDto,
    @Req() req: any,
  ): Promise<ListingQualityResponseDto> {
    return this.qualityService.evaluateListing(dto, req.user.id, req.user.role);
  }
}
