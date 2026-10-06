import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CancelGuestBookingDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
