import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReelStatus } from '@prisma/client';

export enum AdminReportAction {
  DISMISS = 'DISMISS',
  HIDE = 'HIDE',
  REJECT = 'REJECT',
  ARCHIVE = 'ARCHIVE',
}

export class AdminReportActionDto {
  @IsEnum(AdminReportAction, { message: 'Invalid admin report action' })
  action: AdminReportAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdminUpdateReelStatusDto {
  @IsEnum(ReelStatus, { message: 'Invalid reel status' })
  status: ReelStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
