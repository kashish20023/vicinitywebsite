'use client';

import React from 'react';
import { AirbnbMultiListingCalendarView } from '@/components/calendar/AirbnbMultiListingCalendarView';

export default function CoHostCalendarPage() {
  return (
    <AirbnbMultiListingCalendarView
      role="co-host"
      title="Calendars"
      subtitle="View and manage booking availability, blocked dates, and nightly rates across all co-hosted properties."
    />
  );
}
