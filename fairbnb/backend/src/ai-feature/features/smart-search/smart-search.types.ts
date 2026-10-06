export type BudgetBasis = 'PER_NIGHT' | 'TOTAL_STAY' | 'UNKNOWN';

export interface ExtractedSearchPreferences {
  destination?: string;
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  guests: {
    adults: number;
    children: number;
    infants: number;
    total: number;
  };
  budget?: {
    amount: number;
    basis: BudgetBasis;
    currency: string;
  };
  propertyType?: string;
  minBedrooms?: number;
  mandatoryAmenities: string[];
  preferredAmenities: string[];
  negations: string[];
}

export interface SmartSearchRequestDto {
  query: string;
  sessionPreferences?: Partial<ExtractedSearchPreferences>;
  referenceDate?: string; // ISO date string for relative expressions like 'next weekend'
  limit?: number;
}

export interface ScoredPropertyCandidate {
  property: {
    id: string;
    title: string;
    description: string;
    category: string;
    propertyType: string;
    locality?: string | null;
    city: string;
    state: string;
    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    basePrice: number;
    coverImage?: string | null;
    images: string[];
    amenities: string[];
  };
  relevanceScore: number; // 0.0 - 1.0 deterministic relevance score
  scoreBreakdown: {
    locationScore: number;
    amenitiesScore: number;
    spaceScore: number;
    valueScore: number;
  };
  matchReasons: string[];
  quote?: {
    isAvailable: boolean;
    nights: number;
    totalAmount: number;
    basePriceTotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxAmount: number;
    currency: string;
  };
}

export interface SmartSearchResponseDto {
  appliedPreferences: ExtractedSearchPreferences;
  candidates: ScoredPropertyCandidate[];
  totalEligible: number;
  clarificationsNeeded: string[];
  suggestedRelaxations: string[];
  isInformationalDiscovery?: boolean;
  disclaimer?: string;
  checkedAt: string;
  configVersion: number;
}
