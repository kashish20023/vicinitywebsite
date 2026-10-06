import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ReelEventType {
  PLAY_STARTED = 'PLAY_STARTED',
  PLAY_PROGRESS = 'PLAY_PROGRESS',
  PLAY_COMPLETED = 'PLAY_COMPLETED',
  LISTING_CLICK = 'LISTING_CLICK',
  BOOKING_STARTED = 'BOOKING_STARTED',
}

export class CreateReelEventDto {
  @IsEnum(ReelEventType, { message: 'Invalid reel event type' })
  eventType: ReelEventType;

  @IsString()
  @IsNotEmpty({ message: 'Session ID is required' })
  sessionId: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  positionSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  progressPercent?: number;
}
