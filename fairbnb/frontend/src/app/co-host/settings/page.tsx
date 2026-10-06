'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { User, Bell, Shield, Key, Mail, Phone } from 'lucide-react';

export default function CoHostSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-h1 font-bold text-neutral-900 tracking-tight">Co-Host Account Settings</h1>
        <p className="text-body-sm text-neutral-500 mt-1">
          Manage your personal profile, notification preferences, and co-host security settings.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-neutral-100">
          <div className="w-16 h-16 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-h2 shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h3 className="text-h4 font-semibold text-neutral-900">{user?.name || 'Co-Host User'}</h3>
            <p className="text-caption text-neutral-500">{user?.email || 'cohost@fairbnb.com'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 text-overline font-semibold uppercase tracking-wider rounded-full border border-rose-200">
              Verified Co-Host Partner
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-label font-medium text-neutral-700 block">Full Name</label>
            <input
              type="text"
              defaultValue={user?.name || ''}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-body-sm font-medium text-neutral-900 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-label font-medium text-neutral-700 block">Email Address</label>
            <input
              type="email"
              defaultValue={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-body-sm font-medium text-neutral-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-4">
          <h4 className="text-body-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" /> Notifications & Alerts
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-rose-600 rounded" />
              <div className="text-xs">
                <span className="font-bold text-neutral-900 block">New Booking Notifications</span>
                <span className="text-neutral-500">Receive alerts when guests place new bookings on your assigned properties.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-rose-600 rounded" />
              <div className="text-xs">
                <span className="font-bold text-neutral-900 block">Maintenance Task Alerts</span>
                <span className="text-neutral-500">Notify me immediately when hosts or guests file maintenance tickets.</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
