'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { useDashboardNav } from './DashboardNavContext';
import { useAuth } from '@/context/auth-context';

export interface DashboardSidebarShellProps {
  roleTitle: string;
  roleBadgeText: string;
  children: React.ReactNode;
  footerExtra?: React.ReactNode;
  homeHref?: string;
}

export function DashboardSidebarShell({
  roleTitle,
  roleBadgeText,
  children,
  footerExtra,
  homeHref = '/',
}: DashboardSidebarShellProps) {
  const { isCollapsed, toggleCollapsed } = useDashboardNav();
  const { logout } = useAuth();

  return (
    <aside
      aria-label={`${roleTitle} navigation sidebar`}
      className={`hidden md:flex flex-col h-full bg-white border-r border-neutral-200/80 select-none shrink-0 transition-[width] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* BRAND & HEADER BAR */}
      <div
        className={`h-20 flex items-center border-b border-neutral-100 shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}
      >
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962] rounded-xl"
          title={roleTitle}
        >
          <div className="w-9 h-9 rounded-2xl bg-[#0e4962] flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Compass className="w-5 h-5" />
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-h3 tracking-tight text-neutral-900">
                fair<span className="text-[#0e4962]">bnb</span>
              </span>
              <span className="text-overline text-[#0e4962] bg-[#0e4962]/10 px-2 py-0.5 rounded-full shrink-0">
                {roleBadgeText}
              </span>
            </div>
          )}
        </Link>

        {/* Collapse / Expand Toggle Button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962]"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When collapsed, show expand button below header */}
      {isCollapsed && (
        <div className="py-2 flex justify-center border-b border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962]"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* NAVIGATION ITEMS CONTAINER */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {children}
      </nav>

      {/* FOOTER EXTRA (e.g. Co-host badge) */}
      {!isCollapsed && footerExtra && (
        <div className="px-3 py-2 shrink-0">{footerExtra}</div>
      )}

      {/* SIGN OUT AREA */}
      <div
        className={`p-3 border-t border-neutral-100 shrink-0 ${
          isCollapsed ? 'flex justify-center' : ''
        }`}
      >
        <button
          type="button"
          onClick={logout}
          aria-label="Sign Out"
          title={isCollapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:text-rose-600 hover:bg-rose-50/60 border border-neutral-200/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
            isCollapsed
              ? 'justify-center w-11 h-11'
              : 'w-full px-3.5 py-2.5'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
