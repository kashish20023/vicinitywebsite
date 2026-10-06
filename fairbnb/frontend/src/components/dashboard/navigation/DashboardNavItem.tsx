'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { TRANSITION_DEFAULT } from '@/lib/motion';

export interface DashboardNavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCollapsed?: boolean;
  badge?: string | number;
  badgeColor?: string;
  layoutIdScope?: string;
  onClick?: () => void;
}

export function DashboardNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed = false,
  badge,
  badgeColor = 'bg-[#0e4962] text-white',
  layoutIdScope = 'dashboard',
  onClick,
}: DashboardNavItemProps) {
  const prefersReduced = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        onClick={onClick}
        aria-label={isCollapsed ? label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative flex items-center gap-3 rounded-xl text-nav font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962] focus-visible:ring-offset-1 select-none ${
          isCollapsed ? 'justify-center p-2.5 h-11 w-11 mx-auto' : 'px-3.5 py-2.5'
        } ${
          isActive
            ? 'text-[#0e4962] font-semibold'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
        }`}
      >
        {/* Animated active pill indicator */}
        {isActive && (
          <motion.div
            layoutId={prefersReduced ? undefined : `${layoutIdScope}-activeNav`}
            className="absolute inset-0 rounded-xl bg-[#0e4962]/10"
            transition={TRANSITION_DEFAULT}
            aria-hidden="true"
          />
        )}

        {/* Icon */}
        <Icon
          className={`w-5 h-5 shrink-0 transition-colors duration-150 relative z-10 ${
            isActive ? 'text-[#0e4962]' : 'text-neutral-400 group-hover:text-neutral-700'
          }`}
        />

        {/* Label & Badge (when expanded) */}
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0 relative z-10">
            <span className="truncate">{label}</span>
            {badge !== undefined && (
              <span
                className={`ml-2 px-2 py-0.5 text-caption font-semibold rounded-full shrink-0 ${badgeColor}`}
              >
                {badge}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Floating Tooltip when collapsed */}
      {isCollapsed && isHovered && (
        <div
          role="tooltip"
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap px-2.5 py-1 text-caption font-medium text-white bg-neutral-900 rounded-lg shadow-lg border border-neutral-800 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2"
        >
          <span>{label}</span>
          {badge !== undefined && (
            <span
              className={`px-1.5 py-0.5 text-overline font-semibold font-tabular rounded-full ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
