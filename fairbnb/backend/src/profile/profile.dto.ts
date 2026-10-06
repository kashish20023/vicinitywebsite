import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsObject()
  emergencyContact?: Record<string, any>;

  @IsOptional()
  @IsString()
  preferredCurrency?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

export class SubmitKycDto {
  @IsString()
  kycDocumentUrl: string;

  @IsOptional()
  @IsString()
  kycNote?: string;
}
