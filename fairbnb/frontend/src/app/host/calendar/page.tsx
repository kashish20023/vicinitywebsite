'use client';

import React from 'react';
import { AirbnbMultiListingCalendarView } from '@/components/calendar/AirbnbMultiListingCalendarView';

export default function HostCalendarPage() {
  return (
    <AirbnbMultiListingCalendarView
      role="host"
      title="Calendars"
      subtitle="Manage booking availability, blocked dates, and nightly rates across all your property listings."
    />
  );
}
