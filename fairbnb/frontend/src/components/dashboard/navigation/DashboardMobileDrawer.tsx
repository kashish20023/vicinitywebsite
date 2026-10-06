'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, LogOut } from 'lucide-react';
import { useDashboardNav } from './DashboardNavContext';
import { useAuth } from '@/context/auth-context';
import { TRANSITION_DEFAULT, TRANSITION_FAST } from '@/lib/motion';

export interface DashboardMobileDrawerProps {
  roleTitle: string;
  roleBadgeText: string;
  children: React.ReactNode;
  footerExtra?: React.ReactNode;
  homeHref?: string;
}

export function DashboardMobileDrawer({
  roleTitle,
  roleBadgeText,
  children,
  footerExtra,
  homeHref = '/',
}: DashboardMobileDrawerProps) {
  const { isMobileOpen, closeMobile } = useDashboardNav();
  const { logout } = useAuth();

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_FAST}
            onClick={closeMobile}
            aria-hidden="true"
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
          />

          {/* Drawer content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${roleTitle} navigation menu`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={TRANSITION_DEFAULT}
            className="relative w-72 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl z-10 select-none pb-safe"
          >
            {/* Header with Brand & Close button */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100 shrink-0">
              <Link
                href={homeHref}
                onClick={closeMobile}
                className="flex items-center gap-2.5"
                title={roleTitle}
              >
                <div className="w-8 h-8 rounded-xl bg-[#0e4962] flex items-center justify-center text-white font-bold shadow-sm">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-h3 tracking-tight text-neutral-900">
                    fair<span className="text-[#0e4962]">bnb</span>
                  </span>
                  <span className="text-overline text-[#0e4962] bg-[#0e4962]/10 px-2 py-0.5 rounded-full">
                    {roleBadgeText}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close navigation"
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {children}
            </nav>

            {/* Optional extra footer (e.g. Co-host box) */}
            {footerExtra && <div className="px-4 py-2 shrink-0">{footerExtra}</div>}

            {/* Sign Out Button */}
            <div className="p-4 border-t border-neutral-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-button font-medium text-neutral-600 hover:text-rose-600 border border-neutral-200 rounded-xl hover:bg-rose-50/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
