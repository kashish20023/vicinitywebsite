import { IsString, IsNotEmpty, IsDefined, IsOptional } from 'class-validator';

export class UpdateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsDefined()
  value: any;

  @IsOptional()
  @IsString()
  description?: string;
}

