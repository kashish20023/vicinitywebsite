import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SendChatMessageDto } from './chat.dto.js';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(senderId: string, dto: SendChatMessageDto) {
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    return this.prisma.chatMessage.create({
      data: {
        senderId,
        recipientId: dto.recipientId,
        content: dto.content,
        propertyId: dto.propertyId || null,
        bookingId: dto.bookingId || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });
  }

  async getChatThreads(userId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true } },
        property: { select: { id: true, title: true, coverImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversationsMap = new Map<string, any>();
    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          otherUser: msg.senderId === userId ? msg.recipient : msg.sender,
          lastMessage: msg,
          property: msg.property,
        });
      }
    }

    return Array.from(conversationsMap.values());
  }

  async getMessagesWithUser(userId: string, otherUserId: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markMessageAsRead(userId: string, messageId: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!msg || msg.recipientId !== userId) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }
}
