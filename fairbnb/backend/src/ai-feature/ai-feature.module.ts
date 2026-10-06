import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BookingsModule } from '../bookings/bookings.module.js';
import { RuntimeAiConfigService } from './runtime-config/runtime-config.service.js';
import { RuntimeAiConfigController } from './runtime-config/runtime-config.controller.js';
import { GroqProvider } from './provider/groq.provider.js';
import { ListingContextAdapter } from './context-adapters/listing-context.adapter.js';
import { QuoteContextAdapter } from './context-adapters/quote-context.adapter.js';
import { ConversationContextAdapter } from './context-adapters/conversation-context.adapter.js';
import { SmartSearchService } from './features/smart-search/smart-search.service.js';
import { SmartSearchController } from './features/smart-search/smart-search.controller.js';
import { StayComparisonService } from './features/stay-comparison/stay-comparison.service.js';
import { StayComparisonController } from './features/stay-comparison/stay-comparison.controller.js';
import { ListingQaService } from './features/listing-qa/listing-qa.service.js';
import { ListingQaController } from './features/listing-qa/listing-qa.controller.js';
import { GuestReplyDraftService } from './features/hosting-assistants/guest-reply-draft/guest-reply-draft.service.js';
import { GuestReplyDraftController } from './features/hosting-assistants/guest-reply-draft/guest-reply-draft.controller.js';
import { ListingQualityService } from './features/hosting-assistants/listing-quality/listing-quality.service.js';
import { ListingQualityController } from './features/hosting-assistants/listing-quality/listing-quality.controller.js';

@Module({
  imports: [PrismaModule, BookingsModule],
  controllers: [
    RuntimeAiConfigController,
    SmartSearchController,
    StayComparisonController,
    ListingQaController,
    GuestReplyDraftController,
    ListingQualityController,
  ],
  providers: [
    RuntimeAiConfigService,
    GroqProvider,
    ListingContextAdapter,
    QuoteContextAdapter,
    ConversationContextAdapter,
    SmartSearchService,
    StayComparisonService,
    ListingQaService,
    GuestReplyDraftService,
    ListingQualityService,
  ],
  exports: [
    RuntimeAiConfigService,
    GroqProvider,
    ListingContextAdapter,
    QuoteContextAdapter,
    ConversationContextAdapter,
    SmartSearchService,
    StayComparisonService,
    ListingQaService,
    GuestReplyDraftService,
    ListingQualityService,
  ],
})
export class AiFeatureModule {}
