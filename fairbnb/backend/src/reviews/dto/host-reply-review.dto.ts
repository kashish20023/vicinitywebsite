import { IsString, IsNotEmpty } from 'class-validator';

export class HostReplyReviewDto {
  @IsString()
  @IsNotEmpty()
  hostReply: string;
}
