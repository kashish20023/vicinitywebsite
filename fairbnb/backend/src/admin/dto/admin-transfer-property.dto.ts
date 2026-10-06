import { IsString, IsNotEmpty } from 'class-validator';

export class AdminTransferPropertyDto {
  @IsString()
  @IsNotEmpty({ message: 'Target host ID (newHostId) is required' })
  newHostId: string;
}
