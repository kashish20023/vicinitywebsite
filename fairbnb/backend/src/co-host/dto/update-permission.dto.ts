import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { CoHostPermissionEnum } from '@prisma/client';

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  permissionLevel?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(CoHostPermissionEnum, { each: true })
  permissions?: CoHostPermissionEnum[];
}
