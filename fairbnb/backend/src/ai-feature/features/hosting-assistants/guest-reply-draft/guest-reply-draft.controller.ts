import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard.js';
import { GuestReplyDraftService } from './guest-reply-draft.service.js';
import type { GuestReplyDraftRequestDto, GuestReplyDraftResponseDto } from './guest-reply-draft.types.js';

@Controller('ai/hosting')
export class GuestReplyDraftController {
  constructor(private readonly replyService: GuestReplyDraftService) {}

  @Post('guest-reply-draft')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createGuestReplyDraft(
    @Body() dto: GuestReplyDraftRequestDto,
    @Req() req: any,
  ): Promise<GuestReplyDraftResponseDto> {
    return this.replyService.generateDraft(dto, req.user.id, req.user.role);
  }
}
