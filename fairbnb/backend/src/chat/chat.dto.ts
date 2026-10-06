import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  bookingId?: string;
}
