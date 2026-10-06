import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { RuntimeAiConfigService } from '../../../runtime-config/runtime-config.service.js';
import { GroqProvider } from '../../../provider/groq.provider.js';
import { ListingContextAdapter } from '../../../context-adapters/listing-context.adapter.js';
import { ConversationContextAdapter } from '../../../context-adapters/conversation-context.adapter.js';
import { CoHostPermissionEnum } from '@prisma/client';
import {
  GuestReplyDraftRequestDto,
  GuestReplyDraftResponseDto,
} from './guest-reply-draft.types.js';

@Injectable()
export class GuestReplyDraftService {
  private readonly logger = new Logger(GuestReplyDraftService.name);

  constructor(
    private readonly runtimeConfig: RuntimeAiConfigService,
    private readonly groqProvider: GroqProvider,
    private readonly listingAdapter: ListingContextAdapter,
    private readonly conversationAdapter: ConversationContextAdapter,
  ) {}

  async generateDraft(
    dto: GuestReplyDraftRequestDto,
    actorUserId: string,
    actorRole?: string,
  ): Promise<GuestReplyDraftResponseDto> {
    // 1. Enforce feature gate
    this.runtimeConfig.assertFeatureEnabled('guestReplyDraft');

    if (!dto.propertyId) throw new BadRequestException('propertyId is required.');
    if (!dto.guestUserId) throw new BadRequestException('guestUserId is required.');

    // 2. Verify Host/Co-host Authorization with MESSAGE_GUESTS permission
    const listing = await this.listingAdapter.getHostPrivateListingContext(
      dto.propertyId,
      actorUserId,
      actorRole,
      CoHostPermissionEnum.MESSAGE_GUESTS,
    );

    // 3. Fetch sanitized conversation context
    const conv = await this.conversationAdapter.getAuthorizedConversationContext(
      actorUserId,
      dto.guestUserId,
      dto.propertyId,
      actorRole,
    );

    // 4. Grounded Draft Generation with Strict Safety Rules
    const prompt = `You are assisting a Fairbnb host in drafting a reply to a guest.
Guest Name: ${conv.guest.name}
Property: ${listing.title} (${listing.locality || ''}, ${listing.city})
House Rules: ${listing.houseRules.join('; ') || 'Standard house rules apply'}
Cancellation Policy: ${listing.cancellationPolicy}
Check-in / Operational details: ${listing.checkInInstructions || 'Standard check-in after 2 PM'}

Recent Conversation History:
${conv.messages.map((m) => `[${m.senderRole}]: ${m.content}`).join('\n')}

Host Instructions: ${dto.instruction || 'Provide a polite, helpful response addressed to the guest.'}
Requested Tone: ${dto.tone || 'FRIENDLY'}
Requested Language: ${dto.language || 'ENGLISH'}

STRICT GROUNDING RULES:
1. NEVER promise refunds, discounts, cancellations, or guaranteed early check-in unless explicitly instructed by the host.
2. NEVER send messages automatically; this is a draft for human review.
3. Be concise, polite, and helpful. If language is Hinglish, use natural friendly Indian conversational phrasing.
4. Output valid JSON:
{
  "draftReply": string,
  "groundedPoints": string[],
  "caveats": string[]
}`;

    try {
      const res = await this.groqProvider.createChatCompletion<{
        draftReply: string;
        groundedPoints: string[];
        caveats: string[];
      }>(
        [
          { role: 'system', content: 'You are an accurate, grounded host messaging assistant.' },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.2,
          jsonSchema: { type: 'object' },
        },
      );

      if (res.parsedData?.draftReply) {
        return {
          draftReply: res.parsedData.draftReply,
          groundedPoints: Array.isArray(res.parsedData.groundedPoints) ? res.parsedData.groundedPoints : [],
          caveats: Array.isArray(res.parsedData.caveats) ? res.parsedData.caveats : ['Human review required before sending.'],
          requiresHumanReview: true,
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      this.logger.warn(`Groq guest reply draft generation failed: ${err.message}`);
    }

    // Deterministic fallback draft
    return {
      draftReply: `Hi ${conv.guest.name}, thank you for reaching out regarding ${listing.title}. We have received your message and will confirm the details for you shortly.`,
      groundedPoints: ['Acknowledged guest message', 'Referenced verified property title'],
      caveats: ['Fallback draft generated due to provider unavailability. Please edit before sending.'],
      requiresHumanReview: true,
      generatedAt: new Date().toISOString(),
    };
  }
}
