'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useDashboardNav } from '@/components/dashboard/navigation';
import { Search, Bell, Menu } from 'lucide-react';

export default function CoHostHeader() {
  const { user } = useAuth();
  const { openMobile } = useDashboardNav();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  return (
    <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
      {/* MOBILE TRIGGER & SEARCH INPUT BAR */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open navigation"
          className="md:hidden p-2 -ml-1.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search properties, hosts, bookings..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-body-sm font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0e4962] focus:bg-white transition"
          />
        </div>
      </div>

      {/* NOTIFICATIONS & USER PROFILE */}
      <div className="flex items-center gap-4">
        <button
          className="relative p-2.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-neutral-100">
          <div className="h-9 w-9 rounded-2xl bg-[#0e4962] flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden">
            {initial}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-body-sm font-semibold text-neutral-900 leading-tight">{user?.name || 'Co-Host User'}</p>
            <span className="text-caption font-medium text-neutral-500 block">
              Co-host
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
