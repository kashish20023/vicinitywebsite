import { SetMetadata } from '@nestjs/common';
import { CoHostPermissionEnum } from '@prisma/client';

export const COHOST_PERMISSIONS_KEY = 'cohost_permissions';

export const RequireCoHostPermission = (...permissions: CoHostPermissionEnum[]) =>
  SetMetadata(COHOST_PERMISSIONS_KEY, permissions);
