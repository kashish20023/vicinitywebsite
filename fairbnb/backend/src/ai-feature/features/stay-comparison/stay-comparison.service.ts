import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { RuntimeAiConfigService } from '../../runtime-config/runtime-config.service.js';
import { GroqProvider } from '../../provider/groq.provider.js';
import { ListingContextAdapter } from '../../context-adapters/listing-context.adapter.js';
import { QuoteContextAdapter } from '../../context-adapters/quote-context.adapter.js';
import {
  StayComparisonRequestDto,
  StayComparisonResponseDto,
  StayComparisonColumnDto,
} from './stay-comparison.types.js';

@Injectable()
export class StayComparisonService {
  private readonly logger = new Logger(StayComparisonService.name);

  constructor(
    private readonly runtimeConfig: RuntimeAiConfigService,
    private readonly groqProvider: GroqProvider,
    private readonly listingAdapter: ListingContextAdapter,
    private readonly quoteAdapter: QuoteContextAdapter,
  ) {}

  async compareStays(dto: StayComparisonRequestDto): Promise<StayComparisonResponseDto> {
    // 1. Enforce feature gate
    this.runtimeConfig.assertFeatureEnabled('stayComparison');

    if (!dto.propertyIds || !Array.isArray(dto.propertyIds)) {
      throw new BadRequestException('propertyIds array is required.');
    }

    const uniqueIds = Array.from(new Set(dto.propertyIds));
    if (uniqueIds.length < 2 || uniqueIds.length > 4) {
      throw new BadRequestException('Comparison requires between 2 and 4 distinct property IDs.');
    }

    const hasDates = Boolean(
      dto.checkIn && dto.checkOut && dto.checkIn < dto.checkOut,
    );
    const guestCount = dto.guests?.total || 1;

    // 2. Resolve listing contexts server-side (Pure reads)
    const columns: StayComparisonColumnDto[] = [];
    for (const id of uniqueIds) {
      const listing = await this.listingAdapter.getPublicListingContext(id);

      let quote: any = undefined;
      if (hasDates) {
        try {
          const q = await this.quoteAdapter.calculateGroundedQuote(
            id,
            dto.checkIn!,
            dto.checkOut!,
            guestCount,
          );
          quote = {
            isAvailable: q.isAvailable,
            nights: q.nights,
            basePriceTotal: q.pricing.basePriceTotal,
            cleaningFee: q.pricing.cleaningFee,
            serviceFee: q.pricing.serviceFee,
            taxAmount: q.pricing.tax,
            totalAmount: q.pricing.total,
            currency: q.pricing.currency,
          };
        } catch (quoteErr: any) {
          this.logger.warn(`Quote failed for comparison property ${id}: ${quoteErr.message}`);
        }
      }

      columns.push({
        propertyId: listing.id,
        title: listing.title,
        coverImage: listing.coverImage,
        locality: listing.locality,
        city: listing.city,
        state: listing.state,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        bathrooms: listing.bathrooms,
        maxGuests: listing.maxGuests,
        minNights: listing.minNights,
        cancellationPolicy: listing.cancellationPolicy,
        amenities: listing.amenities,
        basePricePerNight: listing.basePrice,
        quote,
      });
    }

    // 3. Compute common vs unique amenities
    const allAmenitiesSets = columns.map((c) => new Set(c.amenities));
    const commonAmenities = columns[0].amenities.filter((amenity) =>
      allAmenitiesSets.every((set) => set.has(amenity)),
    );

    const uniqueAmenities: Record<string, string[]> = {};
    columns.forEach((col) => {
      uniqueAmenities[col.propertyId] = col.amenities.filter((a) => !commonAmenities.includes(a));
    });

    // 4. Generate factual narrative difference summary via Groq (Optional layer)
    let narrativeSummary: string | null = null;
    try {
      narrativeSummary = await this.generateComparisonNarrative(columns, hasDates);
    } catch (narrativeErr: any) {
      this.logger.warn(`Narrative generation unavailable: ${narrativeErr.message}. Returning structured table.`);
    }

    return {
      isDateSpecific: hasDates,
      disclaimer: hasDates
        ? undefined
        : 'Informational comparison without travel dates. Live bookability, calendar availability, and final quotes require specific dates.',
      columns,
      commonAmenities,
      uniqueAmenities,
      narrativeSummary,
      checkedAt: new Date().toISOString(),
    };
  }

  private async generateComparisonNarrative(
    columns: StayComparisonColumnDto[],
    hasDates: boolean,
  ): Promise<string> {
    const propertiesSummary = columns.map((c) => ({
      title: c.title,
      location: `${c.locality || ''}, ${c.city}`,
      bedrooms: c.bedrooms,
      maxGuests: c.maxGuests,
      pricePerNight: c.basePricePerNight,
      totalQuote: c.quote ? c.quote.totalAmount : 'No dates supplied',
      keyAmenities: c.amenities.slice(0, 6),
      cancellation: c.cancellationPolicy,
    }));

    const prompt = `Compare the following ${columns.length} verified stays factually.
Provide a clear, unbiased 2-3 paragraph summary comparing:
1. Space & guest suitability (bedrooms, capacity).
2. Location & neighborhood fit.
3. Pricing & value (financial breakdown is strictly authoritative from the data).
4. Cancellation policies and standout amenities.

Strict rules:
- NEVER invent amenities, discounts, or refund policies not listed.
- Missing data is unknown, not false or free.
- Keep the tone professional, objective, and helpful for a traveler.

Data: ${JSON.stringify(propertiesSummary, null, 2)}`;

    const res = await this.groqProvider.createChatCompletion([
      { role: 'system', content: 'You are a factual travel stay comparison assistant.' },
      { role: 'user', content: prompt },
    ]);

    return res.rawContent.trim();
  }
}
