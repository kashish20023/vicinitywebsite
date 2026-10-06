export interface StayComparisonRequestDto {
  propertyIds: string[];
  checkIn?: string;
  checkOut?: string;
  guests?: {
    adults: number;
    children?: number;
    infants?: number;
    total: number;
  };
}

export interface StayComparisonColumnDto {
  propertyId: string;
  title: string;
  coverImage?: string | null;
  locality?: string | null;
  city: string;
  state: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  minNights: number;
  cancellationPolicy: string;
  amenities: string[];
  basePricePerNight: number;
  quote?: {
    isAvailable: boolean;
    nights: number;
    basePriceTotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  };
}

export interface StayComparisonResponseDto {
  isDateSpecific: boolean;
  disclaimer?: string;
  columns: StayComparisonColumnDto[];
  commonAmenities: string[];
  uniqueAmenities: Record<string, string[]>;
  narrativeSummary?: string | null;
  checkedAt: string;
}
