import { Controller, Post, Body } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service.js';
import { AiAssistantQueryDto } from './ai-assistant.dto.js';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('query')
  async answerQuery(@Body() dto: AiAssistantQueryDto) {
    return this.aiAssistantService.answerQuery(dto);
  }
}
