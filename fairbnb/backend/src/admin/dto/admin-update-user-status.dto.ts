import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminUpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
