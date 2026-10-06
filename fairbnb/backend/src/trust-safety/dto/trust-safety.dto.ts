import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsString()
  @IsOptional()
  propertyId?: string;
}

export class ReviewCaseDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  newStatus: 'OPEN' | 'IN_REVIEW' | 'CONFIRMED_POLICY_BREACH' | 'DISMISSED' | 'APPEALED' | 'RESOLVED';

  @IsString()
  @IsOptional()
  notes?: string;
}
