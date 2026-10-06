import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CoHostPermissionEnum, CoHostStatus } from '@prisma/client';

export interface SanitizedChatMessageDto {
  senderId: string;
  senderRole: 'GUEST' | 'HOST' | 'COHOST' | 'OTHER';
  content: string;
  createdAt: string;
}

export interface AuthorizedConversationContextDto {
  guest: { id: string; name: string };
  host: { id: string; name: string };
  property?: { id: string; title: string; locality?: string | null; city: string };
  messages: SanitizedChatMessageDto[];
}

@Injectable()
export class ConversationContextAdapter {
  private readonly logger = new Logger(ConversationContextAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves and verifies an authorized conversation context.
   * Actor must be:
   * 1. The guest participant, OR
   * 2. The property owner/host, OR
   * 3. An active co-host with MESSAGE_GUESTS permission, OR
   * 4. Platform Admin.
   *
   * Crucial rule: Messages with propertyId: null MUST NOT be included in property-scoped
   * co-host context, as co-host permissions are strictly bound to the property.
   */
  async getAuthorizedConversationContext(
    actorUserId: string,
    otherUserId: string,
    propertyId?: string,
    actorRole?: string,
  ): Promise<AuthorizedConversationContextDto> {
    const [actor, otherUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: actorUserId }, select: { id: true, name: true, role: true } }),
      this.prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true, name: true, role: true } }),
    ]);

    if (!actor || !otherUser) {
      throw new NotFoundException('Conversation participant not found.');
    }

    // Resolve property context if available
    let property: any = null;
    let isOwner = false;
    let isAuthorizedCoHost = false;

    if (propertyId) {
      property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, title: true, hostId: true, locality: true, city: true },
      });
      if (!property) {
        throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
      }
    }

    // Check authorization
    if (actorRole === 'ADMIN') {
      isOwner = true;
    } else if (property) {
      isOwner = property.hostId === actorUserId;

      if (!isOwner) {
        const coHostRel = await this.prisma.coHostRelationship.findUnique({
          where: {
            propertyId_coHostUserId: {
              propertyId: property.id,
              coHostUserId: actorUserId,
            },
          },
          include: { permissions: true },
        });

        const activeStatuses: string[] = [CoHostStatus.ACCEPTED, CoHostStatus.ACTIVE, CoHostStatus.VERIFIED];
        const isActiveCoHost =
          coHostRel &&
          activeStatuses.includes(coHostRel.status) &&
          !coHostRel.revokedById &&
          !coHostRel.removedAt &&
          !coHostRel.suspendedAt;

        if (
          isActiveCoHost &&
          coHostRel.permissions.some((p) => p.permission === CoHostPermissionEnum.MESSAGE_GUESTS)
        ) {
          isAuthorizedCoHost = true;
        }
      }

      // If actor is neither owner nor authorized co-host
      if (!isOwner && !isAuthorizedCoHost) {
        // Only a guest communicating directly with the property host is allowed
        if (otherUserId !== property.hostId) {
          throw new ForbiddenException(
            'Access denied: You do not have permission to access conversations for this listing.',
          );
        }
      }
    }

    // Determine message filter:
    // When property is specified:
    // - Co-hosts ONLY see messages explicitly bound to property.id (never null propertyId).
    // - Owners see messages bound to property.id (or null if direct participant).
    const messageWhere: any = {
      AND: [
        {
          OR: [
            { senderId: actorUserId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: actorUserId },
          ],
        },
      ],
    };

    if (property) {
      if (isAuthorizedCoHost) {
        // Strictly property-bound messages only! Do not include null propertyId
        messageWhere.AND.push({ propertyId: property.id });
      } else {
        messageWhere.AND.push({
          OR: [
            { propertyId: property.id },
            { propertyId: null },
          ],
        });
      }
    }

    const rawMessages = await this.prisma.chatMessage.findMany({
      where: messageWhere,
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        sender: { select: { id: true, role: true } },
      },
    });

    const ordered = rawMessages.reverse();

    const sanitizedMessages: SanitizedChatMessageDto[] = ordered.map((msg) => {
      let senderRole: 'GUEST' | 'HOST' | 'COHOST' | 'OTHER' = 'OTHER';
      if (property && msg.senderId === property.hostId) {
        senderRole = 'HOST';
      } else if (msg.sender.role === 'HOST') {
        senderRole = 'HOST';
      } else if (msg.sender.role === 'USER') {
        senderRole = 'GUEST';
      }

      const sanitizedContent = this.sanitizeText(msg.content);

      return {
        senderId: msg.senderId,
        senderRole,
        content: sanitizedContent,
        createdAt: msg.createdAt.toISOString(),
      };
    });

    return {
      guest: {
        id: otherUser.role === 'USER' ? otherUser.id : actor.id,
        name: otherUser.role === 'USER' ? otherUser.name || 'Guest' : actor.name || 'Guest',
      },
      host: {
        id: otherUser.role === 'HOST' ? otherUser.id : actor.id,
        name: otherUser.role === 'HOST' ? otherUser.name || 'Host' : actor.name || 'Host',
      },
      property: property
        ? {
            id: property.id,
            title: property.title,
            locality: property.locality,
            city: property.city,
          }
        : undefined,
      messages: sanitizedMessages,
    };
  }

  private sanitizeText(text: string): string {
    if (!text) return '';
    let clean = text.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_PAYMENT_DATA]');
    clean = clean.replace(/\b(?:\+91[\-\s]?)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]');
    clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    return clean;
  }
}
