import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateAutomatedMessageRuleDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsIn(['CHECKIN_24H_BEFORE', 'CHECKOUT_AFTER', 'BOOKING_CONFIRMED'])
  triggerEvent: string;

  @IsString()
  @IsNotEmpty()
  templateText: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
