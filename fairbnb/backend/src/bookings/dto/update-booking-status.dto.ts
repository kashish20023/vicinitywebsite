import { IsString, IsIn } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsString()
  @IsIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED', 'EXPIRED'])
  status: string;
}
