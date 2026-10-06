import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AiAssistantQueryDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsString()
  bookingId?: string;
}
