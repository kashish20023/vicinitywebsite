import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  @IsNotEmpty()
  event: string; // e.g. 'payment.captured', 'payment.failed'

  @IsObject()
  @IsNotEmpty()
  payload: any;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
