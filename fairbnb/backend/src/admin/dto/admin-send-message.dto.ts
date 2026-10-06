import { IsString, IsNotEmpty } from 'class-validator';

export class AdminSendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Recipient user ID is required' })
  recipientId: string;

  @IsString()
  @IsNotEmpty({ message: 'Message subject is required' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Message content is required' })
  content: string;
}
