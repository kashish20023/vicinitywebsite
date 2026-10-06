'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { accordionVariants } from '@/lib/motion';

export interface CollapsibleChildItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}

export interface DashboardNavCollapsibleProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  isParentActive?: boolean;
  isCollapsed?: boolean;
  items: CollapsibleChildItem[];
  onItemClick?: () => void;
}

export function DashboardNavCollapsible({
  label,
  icon: Icon,
  isOpen,
  onToggle,
  isParentActive = false,
  isCollapsed = false,
  items,
  onItemClick,
}: DashboardNavCollapsibleProps) {
  const [isHovered, setIsHovered] = useState(false);

  // If the sidebar is collapsed (w-20), show compact icon + tooltip or flyout
  if (isCollapsed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-expanded={isOpen}
          className={`flex items-center justify-center h-11 w-11 mx-auto rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962] cursor-pointer ${
            isParentActive
              ? 'bg-[#0e4962]/10 text-[#0e4962]'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>

        {/* Flyout menu on hover when collapsed */}
        {isHovered && (
          <div
            role="menu"
            className="absolute left-full ml-3 top-0 z-50 min-w-[180px] bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-1 text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 mb-1">
              {label}
            </div>
            {items.map((item) => {
              const ChildIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${
                    item.isActive
                      ? 'bg-[#0e4962]/10 text-[#0e4962]'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <ChildIcon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Expanded sidebar view
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962] cursor-pointer select-none ${
          isParentActive
            ? 'text-[#0e4962] font-bold bg-[#0e4962]/5'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-5 h-5 shrink-0 transition-colors ${
              isParentActive ? 'text-[#0e4962]' : 'text-neutral-400'
            }`}
          />
          <span className="truncate">{label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0e4962]' : 'text-neutral-400'
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            variants={accordionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="pl-8 space-y-1 overflow-hidden"
          >
            {items.map((item) => {
              const ChildIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 select-none ${
                    item.isActive
                      ? 'bg-[#0e4962]/10 text-[#0e4962]'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <ChildIcon
                    className={`w-4 h-4 shrink-0 ${
                      item.isActive ? 'text-[#0e4962]' : 'text-neutral-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
