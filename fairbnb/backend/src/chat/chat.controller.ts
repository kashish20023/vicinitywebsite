import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { SendChatMessageDto } from './chat.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  async sendMessage(
    @CurrentUser() user: any,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, dto);
  }

  @Get('threads')
  async getChatThreads(@CurrentUser() user: any) {
    return this.chatService.getChatThreads(user.id);
  }

  @Get('user/:otherUserId')
  async getMessagesWithUser(
    @CurrentUser() user: any,
    @Param('otherUserId') otherUserId: string,
  ) {
    return this.chatService.getMessagesWithUser(user.id, otherUserId);
  }

  @Patch('messages/:id/read')
  async markMessageAsRead(
    @CurrentUser() user: any,
    @Param('id') messageId: string,
  ) {
    return this.chatService.markMessageAsRead(user.id, messageId);
  }
}
