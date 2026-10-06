import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanlinessRating?: number = 5.0;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  accuracyRating?: number = 5.0;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  locationRating?: number = 5.0;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  valueRating?: number = 5.0;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
