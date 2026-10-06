'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useDashboardNav } from '@/components/dashboard/navigation';
import { Bell, Menu } from 'lucide-react';

export default function HostHeader() {
  const { user } = useAuth();
  const { openMobile } = useDashboardNav();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'H';

  return (
    <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open navigation"
          className="md:hidden p-2 -ml-1.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Hosting Workspace
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-neutral-100">
          <div className="text-right hidden sm:block">
            <p className="text-caption font-semibold text-neutral-900 leading-tight">{user?.name || 'Host User'}</p>
            <span className="text-overline font-semibold text-[#0e4962] bg-[#0e4962]/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Verified Host
            </span>
          </div>
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-[#0e4962] to-[#1a6585] flex items-center justify-center text-white font-semibold text-body-sm shadow-sm cursor-pointer">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
