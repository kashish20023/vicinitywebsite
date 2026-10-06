import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class BlockDatesDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class CreateCustomPricingRuleDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @IsOptional()
  @IsString()
  note?: string;
}
