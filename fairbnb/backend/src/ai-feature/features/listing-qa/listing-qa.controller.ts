import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ListingQaService } from './listing-qa.service.js';
import type { ListingQaRequestDto, ListingQaResponseDto } from './listing-qa.types.js';

@Controller('ai')
export class ListingQaController {
  constructor(private readonly qaService: ListingQaService) {}

  @Post('listing-qa')
  @HttpCode(HttpStatus.OK)
  async answerListingQuestion(
    @Body() dto: ListingQaRequestDto,
  ): Promise<ListingQaResponseDto> {
    return this.qaService.answerQuestion(dto);
  }
}
