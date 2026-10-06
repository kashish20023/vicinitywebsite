import { CoHostPermissionEnum } from '@prisma/client';

export const PERMISSION_PRESETS: Record<string, CoHostPermissionEnum[]> = {
  FULL_ACCESS: [
    CoHostPermissionEnum.VIEW_PROPERTY,
    CoHostPermissionEnum.EDIT_LISTING,
    CoHostPermissionEnum.VIEW_CALENDAR,
    CoHostPermissionEnum.MANAGE_CALENDAR,
    CoHostPermissionEnum.VIEW_BOOKINGS,
    CoHostPermissionEnum.MANAGE_BOOKINGS,
    CoHostPermissionEnum.CANCEL_BOOKINGS,
    CoHostPermissionEnum.VIEW_GUESTS,
    CoHostPermissionEnum.MESSAGE_GUESTS,
    CoHostPermissionEnum.VIEW_PRICING,
    CoHostPermissionEnum.MANAGE_PRICING,
    CoHostPermissionEnum.MANAGE_MAINTENANCE,
    CoHostPermissionEnum.MANAGE_CLEANING,
    CoHostPermissionEnum.VIEW_REVIEWS,
    CoHostPermissionEnum.RESPOND_TO_REVIEWS,
    CoHostPermissionEnum.MANAGE_COUPONS,
    CoHostPermissionEnum.VIEW_EARNINGS,
  ],
  OPERATIONS: [
    CoHostPermissionEnum.VIEW_PROPERTY,
    CoHostPermissionEnum.VIEW_CALENDAR,
    CoHostPermissionEnum.MANAGE_CALENDAR,
    CoHostPermissionEnum.VIEW_BOOKINGS,
    CoHostPermissionEnum.MANAGE_BOOKINGS,
    CoHostPermissionEnum.VIEW_GUESTS,
    CoHostPermissionEnum.MESSAGE_GUESTS,
    CoHostPermissionEnum.MANAGE_MAINTENANCE,
    CoHostPermissionEnum.MANAGE_CLEANING,
    CoHostPermissionEnum.VIEW_REVIEWS,
    CoHostPermissionEnum.RESPOND_TO_REVIEWS,
  ],
  CALENDAR_MESSAGING: [
    CoHostPermissionEnum.VIEW_PROPERTY,
    CoHostPermissionEnum.VIEW_CALENDAR,
    CoHostPermissionEnum.MESSAGE_GUESTS,
  ],
  CALENDAR_ONLY: [
    CoHostPermissionEnum.VIEW_PROPERTY,
    CoHostPermissionEnum.VIEW_CALENDAR,
  ],
};

export const ALL_ALLOWED_PERMISSIONS = Object.values(CoHostPermissionEnum);
