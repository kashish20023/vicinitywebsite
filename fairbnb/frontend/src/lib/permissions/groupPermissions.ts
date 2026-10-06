export interface PermissionGroups {
  calendar: boolean;
  bookings: boolean;
  guests: boolean;
  money: boolean;
  operations: boolean;
}

export function getPermissionGroups(grantedPermissions: string[] = []): PermissionGroups {
  const set = new Set(grantedPermissions || []);
  return {
    calendar: set.has('VIEW_CALENDAR') || set.has('MANAGE_CALENDAR'),
    bookings: set.has('VIEW_BOOKINGS') || set.has('MANAGE_BOOKINGS') || set.has('CANCEL_BOOKINGS'),
    guests: set.has('VIEW_GUESTS') || set.has('MESSAGE_GUESTS'),
    money:
      set.has('VIEW_PRICING') ||
      set.has('MANAGE_PRICING') ||
      set.has('VIEW_EARNINGS') ||
      set.has('MANAGE_COUPONS'),
    operations:
      set.has('MANAGE_MAINTENANCE') ||
      set.has('MANAGE_CLEANING') ||
      set.has('VIEW_REVIEWS') ||
      set.has('RESPOND_TO_REVIEWS'),
  };
}

export function getAccessSentence(grantedPermissions: string[] = []): string {
  const groups = getPermissionGroups(grantedPermissions);
  const activeCount = Object.values(groups).filter(Boolean).length;

  if (activeCount === 5) {
    return 'You manage everything here';
  }

  if (groups.calendar && groups.bookings && groups.guests && !groups.money && !groups.operations) {
    return 'You handle bookings and guests';
  }

  if (groups.calendar && activeCount === 1) {
    return 'You handle the calendar only';
  }

  if (groups.guests && activeCount === 1) {
    return 'You handle guest messages only';
  }

  if (groups.bookings && activeCount === 1) {
    return 'You handle bookings only';
  }

  if (groups.operations && activeCount === 1) {
    return 'You handle operations only';
  }

  if (groups.money && activeCount === 1) {
    return 'You handle pricing and finances only';
  }

  if (activeCount === 0) {
    return 'Basic property view';
  }

  const activeNames: string[] = [];
  if (groups.calendar) activeNames.push('calendar');
  if (groups.bookings) activeNames.push('bookings');
  if (groups.guests) activeNames.push('guests');
  if (groups.operations) activeNames.push('operations');
  if (groups.money) activeNames.push('finances');

  if (activeNames.length === 2) {
    return `You handle ${activeNames[0]} and ${activeNames[1]}`;
  }

  return `You handle ${activeNames.slice(0, 2).join(', ')} and more`;
}
