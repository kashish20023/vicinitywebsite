import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AdminPropertyAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class AdminVerifyPropertyDto {
  @IsEnum(AdminPropertyAction)
  action: AdminPropertyAction;

  @IsOptional()
  @IsString()
  verificationNote?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
