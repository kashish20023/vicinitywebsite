import { IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateUploadSignatureDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  fileSize?: number;

  @IsOptional()
  @IsString()
  fileFormat?: string;
}
