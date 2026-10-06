'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const ALL_PERMISSIONS_BY_CATEGORY = [
  {
    category: 'Property & Listing',
    permissions: [
      { code: 'VIEW_PROPERTY', label: 'View Property Details' },
      { code: 'EDIT_LISTING', label: 'Edit Listing & Descriptions' },
    ],
  },
  {
    category: 'Calendar & Availability',
    permissions: [
      { code: 'VIEW_CALENDAR', label: 'View Property Calendar' },
      { code: 'MANAGE_CALENDAR', label: 'Manage Calendar & Block Dates' },
    ],
  },
  {
    category: 'Bookings & Pricing',
    permissions: [
      { code: 'VIEW_BOOKINGS', label: 'View Guest Bookings' },
      { code: 'MANAGE_BOOKINGS', label: 'Approve & Manage Bookings' },
      { code: 'CANCEL_BOOKINGS', label: 'Cancel Guest Bookings' },
      { code: 'VIEW_PRICING', label: 'View Nightly Rates' },
      { code: 'MANAGE_PRICING', label: 'Modify Rates & Discounts' },
    ],
  },
  {
    category: 'Guest Communication & Operations',
    permissions: [
      { code: 'VIEW_GUESTS', label: 'View Guest Profiles' },
      { code: 'MESSAGE_GUESTS', label: 'Send Messages to Guests' },
      { code: 'MANAGE_MAINTENANCE', label: 'Manage Maintenance Requests' },
      { code: 'MANAGE_CLEANING', label: 'Coordinate Cleaning Schedules' },
    ],
  },
  {
    category: 'Reviews & Marketing',
    permissions: [
      { code: 'VIEW_REVIEWS', label: 'View Guest Reviews' },
      { code: 'RESPOND_TO_REVIEWS', label: 'Respond to Guest Reviews' },
      { code: 'MANAGE_COUPONS', label: 'Manage Property Coupons' },
    ],
  },
  {
    category: 'Team & Governance',
    permissions: [
      { code: 'VIEW_COHOSTS', label: 'View Property Co-Hosts' },
      { code: 'MANAGE_COHOSTS', label: 'Manage Co-Hosts & Invites' },
    ],
  },
];

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
  const togglePermission = (code: string) => {
    if (selectedPermissions.includes(code)) {
      onChange(selectedPermissions.filter((p) => p !== code));
    } else {
      onChange([...selectedPermissions, code]);
    }
  };

  const toggleCategory = (categoryPermissions: { code: string }[]) => {
    const codes = categoryPermissions.map((p) => p.code);
    const allSelected = codes.every((code) => selectedPermissions.includes(code));
    if (allSelected) {
      onChange(selectedPermissions.filter((p) => !codes.includes(p)));
    } else {
      const merged = new Set([...selectedPermissions, ...codes]);
      onChange(Array.from(merged));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-600" /> Granular Permission Matrix
        </h4>
        <span className="text-xs text-neutral-500 font-semibold">
          {selectedPermissions.length} permissions granted
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_PERMISSIONS_BY_CATEGORY.map((cat) => {
          const catCodes = cat.permissions.map((p) => p.code);
          const isAllSelected = catCodes.every((code) => selectedPermissions.includes(code));

          return (
            <div key={cat.category} className="border border-neutral-200 rounded-2xl p-3.5 bg-neutral-50/50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200">
                <span className="text-overline font-semibold uppercase tracking-wider text-neutral-700">
                  {cat.category}
                </span>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.permissions)}
                  className="text-caption font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-1.5">
                {cat.permissions.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      className="flex items-center gap-2.5 text-xs text-neutral-800 cursor-pointer hover:bg-white p-1 rounded-lg transition"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.code)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-neutral-300"
                      />
                      <span className={isChecked ? 'font-semibold text-neutral-900' : 'text-neutral-600'}>
                        {perm.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
