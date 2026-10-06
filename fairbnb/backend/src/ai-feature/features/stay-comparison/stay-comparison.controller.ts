import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { StayComparisonService } from './stay-comparison.service.js';
import type { StayComparisonRequestDto, StayComparisonResponseDto } from './stay-comparison.types.js';

@Controller('ai')
export class StayComparisonController {
  constructor(private readonly comparisonService: StayComparisonService) {}

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  async compareStays(
    @Body() dto: StayComparisonRequestDto,
  ): Promise<StayComparisonResponseDto> {
    return this.comparisonService.compareStays(dto);
  }
}
