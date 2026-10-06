import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class RegisterExternalIcalFeedDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  url: string;
}
