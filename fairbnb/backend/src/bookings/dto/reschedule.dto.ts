import { IsDateString, IsNotEmpty, IsIn, IsOptional, IsString } from 'class-validator';

export class RequestRescheduleDto {
  @IsDateString()
  @IsNotEmpty()
  newCheckIn: string;

  @IsDateString()
  @IsNotEmpty()
  newCheckOut: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RespondRescheduleDto {
  @IsIn(['APPROVE', 'REJECT'])
  action: string;
}
