import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export type AiFeatureKey =
  | 'smartSearch'
  | 'stayComparison'
  | 'listingQa'
  | 'guestReplyDraft'
  | 'listingQuality';

export class FeatureFlagsDto {
  @IsOptional()
  @IsBoolean()
  smartSearch?: boolean;

  @IsOptional()
  @IsBoolean()
  stayComparison?: boolean;

  @IsOptional()
  @IsBoolean()
  listingQa?: boolean;

  @IsOptional()
  @IsBoolean()
  guestReplyDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  listingQuality?: boolean;
}

export class UpdateRuntimeAiConfigDto {
  @IsOptional()
  @IsBoolean()
  master?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeatureFlagsDto)
  features?: FeatureFlagsDto;
}

export interface PublicCapabilitiesResponse {
  enabled: boolean;
  master: boolean;
  features: Record<AiFeatureKey, boolean>;
  version: number;
}

export interface AdminAiSettingsResponse {
  aiAllowedEnv: boolean;
  master: boolean;
  features: Record<AiFeatureKey, boolean>;
  version: number;
  hasApiKey: boolean;
  singleProcessNotice: string;
  activeModel: string;
  updatedAt: string;
}
