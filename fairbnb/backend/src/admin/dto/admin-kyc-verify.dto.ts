import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class AdminKycVerifyDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['VERIFIED', 'REJECTED', 'PENDING'], {
    message: 'status must be VERIFIED, REJECTED, or PENDING',
  })
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';

  @IsOptional()
  @IsString()
  feedbackNote?: string;
}
