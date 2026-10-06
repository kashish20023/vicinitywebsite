import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminBlockGuestDto {
  @IsBoolean({ message: 'isBlocked must be a boolean value' })
  isBlocked: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
