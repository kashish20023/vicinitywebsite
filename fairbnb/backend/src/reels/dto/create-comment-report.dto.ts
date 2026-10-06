import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentReportDto {
  @IsString()
  @IsNotEmpty({ message: 'Report reason cannot be empty' })
  @MaxLength(500, { message: 'Report reason must not exceed 500 characters' })
  reason: string;
}
