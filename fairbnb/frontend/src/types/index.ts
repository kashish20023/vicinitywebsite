// Shared domain models for Fairbnb Frontend

export type UserRole = 'USER' | 'HOST' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: UserRole;
  phoneVerified: boolean;
  emailVerified: boolean;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id?: string;
  url: string;
  caption?: string;
  isCover?: boolean;
}

export interface PropertyHost {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface PropertyBookingSummary {
  id: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  category?: string;
  propertyType?: string;
  listingPurpose?: 'short-term' | 'long-term' | 'both';
  city: string;
  state?: string;
  country?: string;
  basePrice: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  taxRate?: number;
  instantBook?: boolean;
  disableWeekendPartial?: boolean;
  images?: string[];
  badges?: {
    isNew?: boolean;
    topRated?: boolean;
    verifiedHost?: boolean;
  };
  listingExtras?: Record<string, boolean>;
  host?: PropertyHost;
  bookings?: PropertyBookingSummary[];
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  createdAt?: string;
  updatedAt?: string;
}

export interface CoHostPermissionItem {
  permission: string;
  [key: string]: unknown;
}

export interface CoHostRelationship {
  id?: string;
  property?: Property;
  hostUser?: PropertyHost;
  permissions?: Array<string | CoHostPermissionItem>;
  permissionLevel?: 'FULL' | 'CALENDAR_GUESTS' | 'MAINTENANCE_ONLY' | 'CUSTOM';
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';
  acceptedAt?: string;
  createdAt?: string;
}

export interface BookingQuote {
  baseTotal: number;
  cleaningFee?: number;
  serviceFee?: number;
  taxes?: number;
  discountAmount?: number;
  total: number;
  nightsCount: number;
}
