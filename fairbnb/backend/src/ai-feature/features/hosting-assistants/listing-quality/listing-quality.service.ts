import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { RuntimeAiConfigService } from '../../../runtime-config/runtime-config.service.js';
import { GroqProvider } from '../../../provider/groq.provider.js';
import { ListingContextAdapter } from '../../../context-adapters/listing-context.adapter.js';
import { CoHostPermissionEnum } from '@prisma/client';
import {
  ListingQualityRequestDto,
  ListingQualityResponseDto,
  ListingQualityFindingDto,
  ListingDescriptionDraftDto,
} from './listing-quality.types.js';

@Injectable()
export class ListingQualityService {
  private readonly logger = new Logger(ListingQualityService.name);

  constructor(
    private readonly runtimeConfig: RuntimeAiConfigService,
    private readonly groqProvider: GroqProvider,
    private readonly listingAdapter: ListingContextAdapter,
  ) {}

  async evaluateListing(
    dto: ListingQualityRequestDto,
    actorUserId: string,
    actorRole?: string,
  ): Promise<ListingQualityResponseDto> {
    // 1. Enforce feature gate
    this.runtimeConfig.assertFeatureEnabled('listingQuality');

    if (!dto.propertyId) throw new BadRequestException('propertyId is required.');

    // 2. Authorize actor with EDIT_LISTING permission
    const listing = await this.listingAdapter.getHostPrivateListingContext(
      dto.propertyId,
      actorUserId,
      actorRole,
      CoHostPermissionEnum.EDIT_LISTING,
    );

    // 3. Deterministic Rubric Evaluation (Zero Hallucination)
    const findings: ListingQualityFindingDto[] = [];
    let score = 100;

    // Photos check
    const photoCount = listing.images.length;
    if (photoCount < 3) {
      score -= 25;
      findings.push({
        category: 'PHOTOS',
        status: 'FAIL',
        message: `Only ${photoCount} photo(s) uploaded.`,
        suggestion: 'Upload at least 5 high-resolution photos showcasing each bedroom, living space, and bathroom.',
      });
    } else if (photoCount < 5) {
      score -= 10;
      findings.push({
        category: 'PHOTOS',
        status: 'WARN',
        message: `${photoCount} photos uploaded.`,
        suggestion: 'Adding 2+ additional photos of amenities and exterior views will improve traveler trust.',
      });
    } else {
      findings.push({
        category: 'PHOTOS',
        status: 'PASS',
        message: `Strong visual gallery with ${photoCount} photos.`,
        suggestion: 'Ensure primary hero photo features natural lighting.',
      });
    }

    // Description length check
    const descLen = (listing.description || '').length;
    if (descLen < 80) {
      score -= 20;
      findings.push({
        category: 'DESCRIPTION',
        status: 'FAIL',
        message: 'Description is very brief (under 80 characters).',
        suggestion: 'Add details about space layout, work desk, and check-in comfort.',
      });
    } else if (descLen < 200) {
      score -= 10;
      findings.push({
        category: 'DESCRIPTION',
        status: 'WARN',
        message: 'Description could be more detailed.',
        suggestion: 'Mention neighborhood highlights and who the stay is ideal for.',
      });
    } else {
      findings.push({
        category: 'DESCRIPTION',
        status: 'PASS',
        message: 'Comprehensive listing description provided.',
        suggestion: 'Keep seasonal tips updated.',
      });
    }

    // Essential Amenities check
    const essentialAmenities = ['wifi', 'air conditioning', 'kitchen', 'parking'];
    const lowerAmenities = listing.amenities.map((a) => a.toLowerCase());
    const missingEssentials = essentialAmenities.filter(
      (e) => !lowerAmenities.some((la) => la.includes(e)),
    );

    if (missingEssentials.length > 2) {
      score -= 15;
      findings.push({
        category: 'AMENITIES',
        status: 'WARN',
        message: `Common amenities not tagged: ${missingEssentials.join(', ')}.`,
        suggestion: 'Verify if your property includes any of these common essentials to increase search discoverability.',
      });
    } else {
      findings.push({
        category: 'AMENITIES',
        status: 'PASS',
        message: `${listing.amenities.length} amenities specified.`,
        suggestion: 'Highlight special perks like pool or private workspace.',
      });
    }

    // House Rules check
    if (!listing.houseRules || listing.houseRules.length === 0) {
      score -= 10;
      findings.push({
        category: 'HOUSE_RULES',
        status: 'WARN',
        message: 'No specific house rules listed.',
        suggestion: 'Define quiet hours, pet policy, or smoking guidelines to set clear expectations.',
      });
    } else {
      findings.push({
        category: 'HOUSE_RULES',
        status: 'PASS',
        message: `${listing.houseRules.length} house rules clearly defined.`,
        suggestion: 'Clear expectations prevent guest misunderstandings.',
      });
    }

    const finalScore = Math.max(0, score);
    const completenessStatus =
      finalScore >= 85 ? 'EXCELLENT' : finalScore >= 65 ? 'GOOD' : 'NEEDS_IMPROVEMENT';

    // 4. Description Draft Generation (Grounded strictly in verified facts)
    let descriptionDraft: ListingDescriptionDraftDto | null = null;
    if (dto.generateDescriptionDraft) {
      try {
        descriptionDraft = await this.generateGroundedDescriptionDraft(listing, dto.targetAudience);
      } catch (err: any) {
        this.logger.warn(`Failed to generate description draft: ${err.message}`);
      }
    }

    return {
      overallScore: finalScore,
      completenessStatus,
      findings,
      descriptionDraft,
      requiresHumanReview: true,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private async generateGroundedDescriptionDraft(
    listing: any,
    targetAudience?: string,
  ): Promise<ListingDescriptionDraftDto> {
    const prompt = `Generate an elevated, professional listing description grounded STRICTLY in verified listing facts.
Title: ${listing.title}
Property Type: ${listing.propertyType} in ${listing.locality || ''}, ${listing.city}, ${listing.state}
Capacity: ${listing.maxGuests} guests, ${listing.bedrooms} bedrooms, ${listing.beds} beds, ${listing.bathrooms} baths
Amenities: ${listing.amenities.join(', ')}
House Rules: ${listing.houseRules.join('; ') || 'Standard rules'}
Target Audience: ${targetAudience || 'GENERAL'}

CRITICAL RULES:
- NEVER invent beaches, distances, sea-views, or amenities not present in verified facts.
- Do NOT make unsubstantiated safety or neighborhood claims.
- Return valid JSON:
{
  "titleSuggestion": string,
  "shortDescriptionSuggestion": string,
  "fullDescriptionDraft": string,
  "highlightedFacts": string[]
}`;

    const res = await this.groqProvider.createChatCompletion<ListingDescriptionDraftDto>(
      [
        { role: 'system', content: 'You are an accurate real estate copywriter strictly adhering to verified facts.' },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.3,
        jsonSchema: { type: 'object' },
      },
    );

    if (res.parsedData?.fullDescriptionDraft) {
      return {
        titleSuggestion: res.parsedData.titleSuggestion || listing.title,
        shortDescriptionSuggestion: res.parsedData.shortDescriptionSuggestion,
        fullDescriptionDraft: res.parsedData.fullDescriptionDraft,
        highlightedFacts: Array.isArray(res.parsedData.highlightedFacts) ? res.parsedData.highlightedFacts : [],
      };
    }

    throw new Error('Could not parse description draft.');
  }
}
