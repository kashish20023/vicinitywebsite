import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class PayoutSettingsDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'FIXED_AMOUNT',
    'PERCENTAGE',
    'CLEANING_FEE',
    'CLEANING_FEE_PLUS_PERCENTAGE',
  ])
  type!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmount?: number;
}
