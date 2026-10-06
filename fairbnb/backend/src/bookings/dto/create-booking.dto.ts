import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsDateString()
  @IsNotEmpty()
  checkIn: string;

  @IsDateString()
  @IsNotEmpty()
  checkOut: string;

  @IsInt()
  @Min(1)
  guests: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}

export class HostBookingResponseDto {
  @IsEnum(['ACCEPT', 'REJECT'])
  action: 'ACCEPT' | 'REJECT';

  @IsString()
  @IsOptional()
  reason?: string;
}

export class GuestCancelBookingDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
