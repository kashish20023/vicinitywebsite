import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  neighborhoodDescription?: string;

  @IsOptional()
  @IsString()
  aiKnowledgeBasePublic?: string;

  @IsOptional()
  @IsString()
  aiKnowledgeBasePrivate?: string;

  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category!: string;

  @IsString()
  @IsNotEmpty({ message: 'Property type is required' })
  propertyType!: string;

  @IsString()
  @IsNotEmpty({ message: 'Listing purpose is required' })
  listingPurpose!: string;

  // ─────────────── LOCATION FIELDS ───────────────

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  locality?: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city!: string;

  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  state!: string;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country!: string;

  @IsOptional()
  @IsInt({ message: 'Pincode must be an integer' })
  pincode?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude?: number;

  // ─────────────── CAPACITY & PRICING ───────────────

  @IsInt()
  @Min(1)
  maxGuests!: number;

  @IsInt()
  @Min(0)
  bedrooms!: number;

  @IsInt()
  @Min(0)
  beds!: number;

  @IsInt()
  @Min(0)
  bathrooms!: number;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsBoolean()
  instantBook?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalStock?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minNights?: number;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cleaningFee?: number;

  @IsOptional()
  @IsNumber()
  serviceFeeRate?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsString()
  wifiNetwork?: string;

  @IsOptional()
  @IsString()
  wifiPassword?: string;

  @IsOptional()
  @IsString()
  checkInInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  houseRules?: string[];

  // ─────────────── MEDIA & EXTRAS ───────────────

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  gallery?: Record<string, any>;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsObject()
  listingExtras?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownershipProofDocs?: string[];

  @IsOptional()
  @IsObject()
  pointOfContact?: Record<string, any>;
}
