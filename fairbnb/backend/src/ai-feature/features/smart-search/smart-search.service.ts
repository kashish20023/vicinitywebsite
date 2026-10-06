import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RuntimeAiConfigService } from '../../runtime-config/runtime-config.service.js';
import { GroqProvider } from '../../provider/groq.provider.js';
import { QuoteContextAdapter } from '../../context-adapters/quote-context.adapter.js';
import {
  SmartSearchRequestDto,
  SmartSearchResponseDto,
  ExtractedSearchPreferences,
  ScoredPropertyCandidate,
  BudgetBasis,
} from './smart-search.types.js';

@Injectable()
export class SmartSearchService {
  private readonly logger = new Logger(SmartSearchService.name);

  // Word-boundary regexes preventing false positives on "3 nights" or "nightlife"
  private readonly nightlyRegex = /\b(?:per\s+night|a\s+night|each\s+night|\/\s*night|nightly|per\s+day|a\s+day|each\s+day|\/\s*day|daily|har\s+raat|ek\s+raat|par\s+night)\b/i;
  private readonly totalRegex = /\b(?:total|overall|entire\s+stay|whole\s+stay|full\s+stay|all\s*[-]?\s*in|in\s+total|pura\s+budget|kul|total\s+budget|overall\s+budget|sab\s+mila\s*k[ea]|complete\s+stay)\b/i;

  constructor(
    private readonly runtimeConfig: RuntimeAiConfigService,
    private readonly groqProvider: GroqProvider,
    private readonly prisma: PrismaService,
    private readonly quoteAdapter: QuoteContextAdapter,
  ) {}

  detectBudgetBasis(query: string): BudgetBasis {
    const q = (query || '').trim();
    const hasNightly = this.nightlyRegex.test(q);
    const hasTotal = this.totalRegex.test(q);

    if (hasNightly && hasTotal) {
      return 'UNKNOWN'; // Conflicting wording
    }
    if (hasNightly) {
      return 'PER_NIGHT';
    }
    if (hasTotal) {
      return 'TOTAL_STAY';
    }
    return 'UNKNOWN';
  }

  async search(dto: SmartSearchRequestDto): Promise<SmartSearchResponseDto> {
    // 1. Enforce feature gate
    this.runtimeConfig.assertFeatureEnabled('smartSearch');
    const configVersion = this.runtimeConfig.getVersion();

    if (dto.sessionPreferences !== undefined && (typeof dto.sessionPreferences !== 'object' || dto.sessionPreferences === null)) {
      throw new BadRequestException('sessionPreferences must be an object');
    }

    if (!dto.query || dto.query.trim().length === 0) {
      throw new BadRequestException('Query string cannot be empty.');
    }

    const referenceDate = dto.referenceDate || new Date().toISOString();

    // 2. Extract preferences from natural language (Hinglish/English)
    const extracted = await this.extractPreferences(dto.query, referenceDate);

    // 3. Merge bounded session preferences: new explicit overrides prior; negations persist
    const mergedPreferences = this.mergePreferences(dto.sessionPreferences, extracted, dto.query);

    // 4. Identify required clarifications
    const clarificationsNeeded: string[] = [];
    if (!mergedPreferences.destination) {
      clarificationsNeeded.push('Which city or destination are you planning to visit?');
    }
    if (!mergedPreferences.checkIn || !mergedPreferences.checkOut) {
      clarificationsNeeded.push(
        'Adding specific travel dates will allow us to check live calendar availability and accurate all-in pricing.',
      );
    }
    if (mergedPreferences.budget && mergedPreferences.budget.basis === 'UNKNOWN') {
      clarificationsNeeded.push(
        `Please clarify whether your budget of ₹${mergedPreferences.budget.amount.toLocaleString('en-IN')} is per night or for the entire stay.`,
      );
    }

    // 5. Query candidate listings from database (Pure read query)
    const whereClause: any = {
      status: 'PUBLISHED',
      verificationStatus: 'APPROVED',
    };

    if (mergedPreferences.destination) {
      whereClause.OR = [
        { city: { contains: mergedPreferences.destination, mode: 'insensitive' } },
        { locality: { contains: mergedPreferences.destination, mode: 'insensitive' } },
      ];
    }

    if (mergedPreferences.guests.total > 0) {
      whereClause.maxGuests = { gte: mergedPreferences.guests.total };
    }

    if (mergedPreferences.minBedrooms && mergedPreferences.minBedrooms > 0) {
      whereClause.bedrooms = { gte: mergedPreferences.minBedrooms };
    }

    const rawCandidates = await this.prisma.property.findMany({
      where: whereClause,
      take: 40, // Bounded candidate retrieval
      include: {
        amenities: {
          include: {
            amenity: { select: { name: true } },
          },
        },
      },
    });

    // 6. Strict Eligibility Checks & Quotes
    const eligibleCandidates: ScoredPropertyCandidate[] = [];
    const suggestedRelaxations: string[] = [];

    const hasDates = Boolean(
      mergedPreferences.checkIn &&
      mergedPreferences.checkOut &&
      mergedPreferences.checkIn < mergedPreferences.checkOut,
    );

    for (const prop of rawCandidates) {
      const propAmenities = (prop.amenities || [])
        .map((a) => a.amenity?.name?.toLowerCase())
        .filter((n): n is string => Boolean(n));

      // Mandatory amenities check (Zero tolerance)
      const missingMandatory = mergedPreferences.mandatoryAmenities.filter(
        (mand) => !propAmenities.some((pa) => pa.includes(mand.toLowerCase())),
      );
      if (missingMandatory.length > 0) {
        continue;
      }

      // Negations check
      const violatesNegation = mergedPreferences.negations.some((neg) => {
        const lowerTitle = prop.title.toLowerCase();
        const lowerDesc = prop.description.toLowerCase();
        return lowerTitle.includes(neg.toLowerCase()) || lowerDesc.includes(neg.toLowerCase());
      });
      if (violatesNegation) {
        continue;
      }

      // Check dates and quote if dates provided
      let quoteResult: any = null;
      if (hasDates) {
        try {
          quoteResult = await this.quoteAdapter.calculateGroundedQuote(
            prop.id,
            mergedPreferences.checkIn!,
            mergedPreferences.checkOut!,
            mergedPreferences.guests.total || 1,
          );

          if (!quoteResult.isAvailable) {
            continue; // Sold out for requested dates
          }

          // Strict budget check: ONLY filter when basis is confirmed!
          if (mergedPreferences.budget && mergedPreferences.budget.basis !== 'UNKNOWN') {
            if (mergedPreferences.budget.basis === 'TOTAL_STAY') {
              if (quoteResult.pricing.total > mergedPreferences.budget.amount) {
                continue; // Over total budget
              }
            } else if (mergedPreferences.budget.basis === 'PER_NIGHT') {
              if (prop.basePrice > mergedPreferences.budget.amount) {
                continue; // Over nightly budget
              }
            }
          }
          // Note: If basis is UNKNOWN, do NOT apply an assumed monetary filter!
        } catch (quoteErr: any) {
          this.logger.warn(`Quote calculation failed for candidate ${prop.id}: ${quoteErr.message}`);
          continue;
        }
      } else {
        // No dates provided: check nightly base price ONLY if basis is PER_NIGHT
        if (mergedPreferences.budget && mergedPreferences.budget.basis === 'PER_NIGHT') {
          if (prop.basePrice > mergedPreferences.budget.amount) {
            continue;
          }
        }
        // If UNKNOWN or TOTAL_STAY without dates: do NOT apply assumed monetary filter!
      }

      // 7. Deterministic Soft Ranking Calculation
      const { score, breakdown, reasons } = this.calculateRelevance(
        prop,
        propAmenities,
        mergedPreferences,
        quoteResult,
      );

      const amenityDisplayNames = (prop.amenities || [])
        .map((a) => a.amenity?.name)
        .filter((n): n is string => Boolean(n));

      eligibleCandidates.push({
        property: {
          id: prop.id,
          title: prop.title,
          description: prop.description,
          category: prop.category,
          propertyType: prop.propertyType,
          locality: prop.locality,
          city: prop.city,
          state: prop.state,
          maxGuests: prop.maxGuests,
          bedrooms: prop.bedrooms,
          beds: prop.beds,
          bathrooms: prop.bathrooms,
          basePrice: prop.basePrice,
          coverImage: prop.coverImage,
          images: Array.isArray(prop.images) ? prop.images : [],
          amenities: amenityDisplayNames,
        },
        relevanceScore: Number(score.toFixed(3)),
        scoreBreakdown: breakdown,
        matchReasons: reasons,
        quote: quoteResult
          ? {
              isAvailable: quoteResult.isAvailable,
              nights: quoteResult.nights,
              totalAmount: quoteResult.pricing.total,
              basePriceTotal: quoteResult.pricing.basePriceTotal,
              cleaningFee: quoteResult.pricing.cleaningFee,
              serviceFee: quoteResult.pricing.serviceFee,
              taxAmount: quoteResult.pricing.tax,
              currency: quoteResult.pricing.currency,
            }
          : undefined,
      });
    }

    // Sort by deterministic relevance score desc, tie-break by ID asc
    eligibleCandidates.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.property.id.localeCompare(b.property.id);
    });

    // If zero matches, calculate explicit suggested relaxations
    if (eligibleCandidates.length === 0 && rawCandidates.length > 0) {
      if (mergedPreferences.mandatoryAmenities.length > 0) {
        suggestedRelaxations.push(
          `Relax mandatory amenity '${mergedPreferences.mandatoryAmenities[0]}' to view ${rawCandidates.length} potential matches.`,
        );
      }
      if (mergedPreferences.budget && mergedPreferences.budget.basis !== 'UNKNOWN') {
        suggestedRelaxations.push(
          `Increase your budget above ${mergedPreferences.budget.amount} ${mergedPreferences.budget.currency} to include available stays.`,
        );
      }
    }

    const limit = dto.limit || 10;
    const paginated = eligibleCandidates.slice(0, limit);

    return {
      appliedPreferences: mergedPreferences,
      candidates: paginated,
      totalEligible: eligibleCandidates.length,
      clarificationsNeeded,
      suggestedRelaxations,
      isInformationalDiscovery: !hasDates,
      disclaimer: !hasDates
        ? 'Informational discovery only. Specific travel dates and guest count are required for verified availability and total quotes.'
        : undefined,
      checkedAt: new Date().toISOString(),
      configVersion,
    };
  }

  private calculateRelevance(
    prop: any,
    propAmenities: string[],
    prefs: ExtractedSearchPreferences,
    quoteResult: any,
  ): {
    score: number;
    breakdown: { locationScore: number; amenitiesScore: number; spaceScore: number; valueScore: number };
    reasons: string[];
  } {
    const reasons: string[] = [];

    // 1. Location Fit (Weight: 0.30)
    let locationScore = 0.5;
    if (prefs.destination) {
      const destLower = prefs.destination.toLowerCase();
      if (prop.locality && prop.locality.toLowerCase().includes(destLower)) {
        locationScore = 1.0;
        reasons.push(`Prime locality match in ${prop.locality}`);
      } else if (prop.city.toLowerCase().includes(destLower)) {
        locationScore = 0.8;
        reasons.push(prop.locality ? `Located in ${prop.locality}, ${prop.city}` : `Located in ${prop.city}`);
      }
    } else if (prop.locality) {
      reasons.push(`Located in ${prop.locality}, ${prop.city}`);
    }

    // 2. Preferred Amenities Fit (Weight: 0.30)
    let amenitiesScore = 0.5;
    if (prefs.preferredAmenities.length > 0) {
      const matched = prefs.preferredAmenities.filter((pref) =>
        propAmenities.some((pa) => pa.includes(pref.toLowerCase())),
      );
      amenitiesScore = matched.length / prefs.preferredAmenities.length;
      if (matched.length > 0) {
        reasons.push(`Features ${matched.length} preferred amenities: ${matched.join(', ')}`);
      }
    }

    // 3. Space Suitability (Weight: 0.20)
    let spaceScore = 0.7;
    const requestedGuests = prefs.guests.total || 1;
    if (prop.maxGuests >= requestedGuests && prop.maxGuests <= requestedGuests + 2) {
      spaceScore = 1.0; // Perfect fit without excessive empty capacity
      reasons.push(`Ideal fit for ${requestedGuests} guest(s) (${prop.bedrooms} BR, ${prop.beds} beds)`);
    } else {
      reasons.push(`Accommodates up to ${prop.maxGuests} guests`);
    }

    // 4. Budget / Value Score (Weight: 0.20)
    // IMPORTANT: When basis is UNKNOWN, do NOT award value bonus or claim within budget!
    let valueScore = 0.6;
    if (prefs.budget && prefs.budget.basis !== 'UNKNOWN') {
      const comparePrice = prefs.budget.basis === 'TOTAL_STAY' && quoteResult
        ? quoteResult.pricing.total
        : prop.basePrice;
      const ratio = comparePrice / prefs.budget.amount;
      if (ratio <= 0.85) {
        valueScore = 1.0;
        reasons.push(`Exceptional value within your budget (${Math.round((1 - ratio) * 100)}% under budget)`);
      } else if (ratio <= 1.0) {
        valueScore = 0.85;
        reasons.push('Comfortably within your stated budget');
      }
    }

    const totalScore =
      locationScore * 0.3 + amenitiesScore * 0.3 + spaceScore * 0.2 + valueScore * 0.2;

    return {
      score: totalScore,
      breakdown: {
        locationScore: Number(locationScore.toFixed(2)),
        amenitiesScore: Number(amenitiesScore.toFixed(2)),
        spaceScore: Number(spaceScore.toFixed(2)),
        valueScore: Number(valueScore.toFixed(2)),
      },
      reasons,
    };
  }

  private async extractPreferences(
    query: string,
    referenceDate: string,
  ): Promise<ExtractedSearchPreferences> {
    const prompt = `Extract structured travel search constraints from the user query.
The query may be in English, Hindi, or Hinglish (e.g., 'Candolim me 2 bedroom pool villa for 4 people next weekend under 15000 per night').
Reference current time is: ${referenceDate}.

Output strictly valid JSON with this schema:
{
  "destination": string | null,
  "checkIn": "YYYY-MM-DD" | null,
  "checkOut": "YYYY-MM-DD" | null,
  "guests": {
    "adults": number,
    "children": number,
    "infants": number,
    "total": number
  },
  "budget": {
    "amount": number,
    "basis": "PER_NIGHT" | "TOTAL_STAY" | "UNKNOWN",
    "currency": "INR"
  } | null,
  "propertyType": string | null,
  "minBedrooms": number | null,
  "mandatoryAmenities": string[],
  "preferredAmenities": string[],
  "negations": string[]
}

Rules:
- If user says 'pool villa', 'pool' is a mandatory or preferred amenity.
- If user says 'under 5000 per night', '5k/night', 'per day', 'daily', basis is 'PER_NIGHT'.
- If user says 'total budget 25k', 'pura budget 20000', 'all-in 15000', basis is 'TOTAL_STAY'.
- CRITICAL: If the user does not explicitly state whether the budget is per night or total (e.g. 'under 15000', 'villa near nightlife for 15000', 'stay for 3 nights for 15000'), you MUST set basis to 'UNKNOWN'. Do NOT assume or guess.
- If conflicting wording is used (e.g. '5000 per night total budget 10000'), set basis to 'UNKNOWN'.
- Resolve relative date expressions ('next weekend', 'tomorrow') accurately relative to the reference time.
- If dates are not mentioned, set checkIn and checkOut to null.
- Identify negative constraints like 'no shared pool', 'not in Calangute' into negations array.`;

    try {
      const res = await this.groqProvider.createChatCompletion<ExtractedSearchPreferences>(
        [
          { role: 'system', content: prompt },
          { role: 'user', content: query },
        ],
        {
          temperature: 0.1,
          jsonSchema: { type: 'object' },
        },
      );

      if (res.parsedData) {
        return this.normalizeExtracted(res.parsedData, query);
      }
    } catch (err: any) {
      this.logger.warn(`Groq extraction failed or degraded: ${err.message}. Using deterministic fallback.`);
    }

    // Deterministic fallback parser
    return this.heuristicFallbackExtract(query);
  }

  private normalizeExtracted(raw: any, query: string): ExtractedSearchPreferences {
    const adults = typeof raw.guests?.adults === 'number' && raw.guests.adults > 0 ? raw.guests.adults : 1;
    const children = typeof raw.guests?.children === 'number' ? raw.guests.children : 0;
    const infants = typeof raw.guests?.infants === 'number' ? raw.guests.infants : 0;
    const total = typeof raw.guests?.total === 'number' && raw.guests.total > 0 ? raw.guests.total : adults + children;

    let normalizedBasis: BudgetBasis = 'UNKNOWN';
    if (raw.budget?.amount && typeof raw.budget.amount === 'number') {
      const rawBasis = String(raw.budget.basis || '').toUpperCase();
      if (rawBasis === 'PER_NIGHT' || rawBasis === 'NIGHTLY') {
        normalizedBasis = 'PER_NIGHT';
      } else if (rawBasis === 'TOTAL_STAY' || rawBasis === 'TOTAL') {
        normalizedBasis = 'TOTAL_STAY';
      } else {
        normalizedBasis = 'UNKNOWN';
      }

      // Regex sanity check on query to prevent LLM hallucination of basis
      const detectedRegexBasis = this.detectBudgetBasis(query);
      if (detectedRegexBasis === 'UNKNOWN' && normalizedBasis !== 'UNKNOWN') {
        // Query has no explicit nightly or total wording, enforce UNKNOWN
        normalizedBasis = 'UNKNOWN';
      } else if (detectedRegexBasis !== 'UNKNOWN') {
        normalizedBasis = detectedRegexBasis;
      }
    }

    return {
      destination: typeof raw.destination === 'string' && raw.destination.trim() ? raw.destination.trim() : undefined,
      checkIn: typeof raw.checkIn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.checkIn) ? raw.checkIn : undefined,
      checkOut: typeof raw.checkOut === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.checkOut) ? raw.checkOut : undefined,
      guests: { adults, children, infants, total },
      budget: raw.budget?.amount && typeof raw.budget.amount === 'number'
        ? {
            amount: raw.budget.amount,
            basis: normalizedBasis,
            currency: raw.budget.currency || 'INR',
          }
        : undefined,
      propertyType: typeof raw.propertyType === 'string' ? raw.propertyType : undefined,
      minBedrooms: typeof raw.minBedrooms === 'number' ? raw.minBedrooms : undefined,
      mandatoryAmenities: Array.isArray(raw.mandatoryAmenities) ? raw.mandatoryAmenities : [],
      preferredAmenities: Array.isArray(raw.preferredAmenities) ? raw.preferredAmenities : [],
      negations: Array.isArray(raw.negations) ? raw.negations : [],
    };
  }

  private heuristicFallbackExtract(query: string): ExtractedSearchPreferences {
    const q = query.toLowerCase();
    let destination: string | undefined = undefined;

    // Check popular Indian destinations
    const destinations = ['goa', 'candolim', 'calangute', 'baga', 'manali', 'shimla', 'mumbai', 'delhi', 'bangalore', 'jaipur', 'udaipur'];
    for (const d of destinations) {
      if (q.includes(d)) {
        destination = d.charAt(0).toUpperCase() + d.slice(1);
        break;
      }
    }

    // Guest extraction: '4 people', '2 guests', '4 log'
    let total = 2;
    const guestMatch = q.match(/(\d+)\s*(?:people|guests|persons|adults|log|members)/);
    if (guestMatch) {
      total = parseInt(guestMatch[1], 10);
    }

    // Bedroom extraction: '2 bhk', '3 bedroom', '2 kamre'
    let minBedrooms: number | undefined = undefined;
    const brMatch = q.match(/(\d+)\s*(?:bhk|bedroom|bedrooms|bed|kamre)/);
    if (brMatch) {
      minBedrooms = parseInt(brMatch[1], 10);
    }

    // Budget extraction: 'under 15000', 'under 15k', 'budget 5000'
    let budget: any = undefined;
    const budgetMatch = q.match(/(?:under|below|budget|max|around)\s*(?:rs\.?|inr|₹)?\s*(\d+)(k)?/i);
    if (budgetMatch) {
      let amt = parseInt(budgetMatch[1], 10);
      if (budgetMatch[2]?.toLowerCase() === 'k') amt *= 1000;
      budget = {
        amount: amt,
        basis: this.detectBudgetBasis(query),
        currency: 'INR',
      };
    }

    const mandatoryAmenities: string[] = [];
    if (q.includes('pool') || q.includes('swimming')) mandatoryAmenities.push('Pool');
    if (q.includes('wifi') || q.includes('internet')) mandatoryAmenities.push('Wifi');
    if (q.includes('kitchen') || q.includes('rasoi')) mandatoryAmenities.push('Kitchen');

    return {
      destination,
      guests: { adults: total, children: 0, infants: 0, total },
      minBedrooms,
      budget,
      mandatoryAmenities,
      preferredAmenities: [],
      negations: [],
    };
  }

  private mergePreferences(
    prev: Partial<ExtractedSearchPreferences> | undefined,
    current: ExtractedSearchPreferences,
    currentQuery?: string,
  ): ExtractedSearchPreferences {
    if (!prev) return current;

    // Negations persist across session unless changed
    const combinedNegations = Array.from(new Set([...(prev.negations || []), ...current.negations]));

    let mergedBudget = prev.budget ? { ...prev.budget } : undefined;
    if (current.budget) {
      if (!mergedBudget) {
        mergedBudget = { ...current.budget };
      } else {
        mergedBudget.amount = current.budget.amount;
        mergedBudget.currency = current.budget.currency;
        if (current.budget.basis !== 'UNKNOWN') {
          mergedBudget.basis = current.budget.basis;
        }
      }
    } else if (mergedBudget && mergedBudget.basis === 'UNKNOWN' && currentQuery) {
      // Check if current follow-up query is a basis clarification response (e.g. "per night" or "total stay")
      const followUpBasis = this.detectBudgetBasis(currentQuery);
      if (followUpBasis !== 'UNKNOWN') {
        mergedBudget.basis = followUpBasis;
      }
    }

    const guestMentioned = Boolean(
      currentQuery &&
      (/\b(\d+)\s*(?:people|guests|persons|adults|log|members|family|couple)\b/i.test(currentQuery) ||
       /\b(?:guests?|people|family|couple)\b/i.test(currentQuery))
    );

    const mergedGuests = guestMentioned && current.guests.total > 0
      ? current.guests
      : (prev.guests && prev.guests.total > 0 ? prev.guests : current.guests);

    return {
      destination: current.destination !== undefined ? current.destination : prev.destination,
      checkIn: current.checkIn !== undefined ? current.checkIn : prev.checkIn,
      checkOut: current.checkOut !== undefined ? current.checkOut : prev.checkOut,
      guests: mergedGuests,
      budget: mergedBudget,
      propertyType: current.propertyType !== undefined ? current.propertyType : prev.propertyType,
      minBedrooms: current.minBedrooms !== undefined ? current.minBedrooms : prev.minBedrooms,
      mandatoryAmenities: Array.from(new Set([...(prev.mandatoryAmenities || []), ...current.mandatoryAmenities])),
      preferredAmenities: Array.from(new Set([...(prev.preferredAmenities || []), ...current.preferredAmenities])),
      negations: combinedNegations,
    };
  }
}
