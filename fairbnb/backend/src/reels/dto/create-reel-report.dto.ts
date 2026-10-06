import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReelReportDto {
  @IsString()
  @IsNotEmpty({ message: 'Report reason cannot be empty' })
  @MaxLength(250, { message: 'Report reason cannot exceed 250 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reason: string;
}
