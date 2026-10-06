import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateAmenityDto {
  @IsString()
  @IsNotEmpty({ message: 'Amenity name is required' })
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateAmenityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class AttachAmenitiesDto {
  @IsArray()
  @IsString({ each: true })
  amenityIds: string[];
}
