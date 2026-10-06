import { IsBoolean, IsOptional } from 'class-validator';

export class AdminVerifyUserDto {
  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
