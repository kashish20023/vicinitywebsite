import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SmartSearchService } from './smart-search.service.js';
import type { SmartSearchRequestDto, SmartSearchResponseDto } from './smart-search.types.js';

@Controller('ai')
export class SmartSearchController {
  constructor(private readonly searchService: SmartSearchService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async executeSmartSearch(
    @Body() dto: SmartSearchRequestDto,
  ): Promise<SmartSearchResponseDto> {
    return this.searchService.search(dto);
  }
}
