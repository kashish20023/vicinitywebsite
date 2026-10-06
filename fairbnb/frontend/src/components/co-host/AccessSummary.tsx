'use client';

import React from 'react';
import { getPermissionGroups, getAccessSentence } from '@/lib/permissions/groupPermissions';
import { Calendar, ClipboardList, MessageSquare, Wrench, DollarSign } from 'lucide-react';

interface AccessSummaryProps {
  permissions: string[];
  className?: string;
  showSentence?: boolean;
  compactChips?: boolean;
}

export default function AccessSummary({
  permissions,
  className = '',
  showSentence = true,
  compactChips = false,
}: AccessSummaryProps) {
  const groups = getPermissionGroups(permissions);
  const sentence = getAccessSentence(permissions);

  const groupItems = [
    { key: 'calendar', label: 'Calendar', active: groups.calendar, icon: Calendar },
    { key: 'bookings', label: 'Bookings', active: groups.bookings, icon: ClipboardList },
    { key: 'guests', label: 'Guests', active: groups.guests, icon: MessageSquare },
    { key: 'operations', label: 'Operations', active: groups.operations, icon: Wrench },
    { key: 'money', label: 'Financials', active: groups.money, icon: DollarSign },
  ];

  // RULE #2: HIDE RESTRICTED THINGS. ONLY RENDER ACTIVE GROUPS.
  const activeItems = groupItems.filter((g) => g.active);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showSentence && (
        <p className="text-caption font-medium text-neutral-600">{sentence}</p>
      )}

      {activeItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeItems.map((g) => {
            const Icon = g.icon;
            return (
              <span
                key={g.key}
                className={`inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 font-semibold rounded-lg ${
                  compactChips ? 'px-2 py-0.5 text-overline' : 'px-2.5 py-1 text-caption'
                }`}
              >
                <Icon className="w-3 h-3 text-neutral-500" />
                <span>{g.label}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
