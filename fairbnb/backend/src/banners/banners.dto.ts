import { IsString, IsOptional, IsBoolean, IsInt, IsArray, IsEmail, Min } from 'class-validator';

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  couponId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  triggerType?: string; // "delay", "exit", "instant"

  @IsOptional()
  @IsInt()
  @Min(0)
  triggerValue?: number; // e.g. 5 seconds

  @IsOptional()
  @IsString()
  actionType?: string; // "form", "link", "coupon"

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPages?: string[];
}

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  couponId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  triggerType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  triggerValue?: number;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPages?: string[];
}

export class SubmitLeadDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
