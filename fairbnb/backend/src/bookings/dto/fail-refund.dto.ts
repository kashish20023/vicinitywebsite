import { IsString, IsNotEmpty } from 'class-validator';

export class FailRefundDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
