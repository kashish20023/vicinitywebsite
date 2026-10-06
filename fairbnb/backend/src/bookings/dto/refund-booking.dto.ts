import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class RequestRefundDto {
  @IsNumber()
  @Min(0.01, { message: 'Refund amount must be greater than zero' })
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
