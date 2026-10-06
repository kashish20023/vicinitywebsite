import { SetMetadata } from '@nestjs/common';

export const COHOST_PERMISSION_KEY = 'cohost_permission_key';
export const RequireCohostPermission = (permissionKey: string) =>
  SetMetadata(COHOST_PERMISSION_KEY, permissionKey);
