import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;
}

export class UpdateMaintenanceStatusDto {
  @IsIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'])
  status: string;

  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
