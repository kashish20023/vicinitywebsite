export interface ListingQaRequestDto {
  propertyId: string;
  question: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export interface ListingQaSourceCitation {
  field: string;
  snippet: string;
}

export interface ListingQaResponseDto {
  answer: string;
  confidence: 'FACTUAL' | 'PARTIAL' | 'UNKNOWN';
  sources: ListingQaSourceCitation[];
  suggestHostContact: boolean;
  bookingContext?: {
    isAvailable?: boolean;
    totalAmount?: number;
    currency?: string;
  };
  checkedAt: string;
}
