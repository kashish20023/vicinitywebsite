import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoHostPermissionEnum } from '@prisma/client';
import { PayoutSettingsDto } from './payout-settings.dto.js';

export class InviteCoHostDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  permissionLevel?: string; // e.g. FULL_ACCESS, OPERATIONS, CALENDAR_MESSAGING, CALENDAR_ONLY, CUSTOM

  @IsOptional()
  @IsArray()
  @IsEnum(CoHostPermissionEnum, { each: true })
  permissions?: CoHostPermissionEnum[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PayoutSettingsDto)
  payoutConfig?: PayoutSettingsDto;
}
