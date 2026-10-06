import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, IsNumber } from 'class-validator';

export class FileDisputeDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

export class ResolveDisputeDto {
  @IsIn(['UNDER_REVIEW', 'RESOLVED_REFUND_GUEST', 'RESOLVED_PAY_HOST', 'DISMISSED'])
  status: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsNumber()
  payoutAdjustment?: number;
}
