'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cardHoverMotion } from '@/lib/motion';

export interface StatCardTrend {
  value: string | number;
  direction?: 'up' | 'down' | 'neutral';
  label?: string;
}

export interface StatCardProps {
  /** The descriptive metric label, e.g. "Total Listings", "Upcoming Check-ins" */
  label: string;
  /** Primary metric value, e.g. "12", "₹45,200", "98%" */
  value: string | number;
  /** Optional icon component from lucide-react */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional trend indicator */
  trend?: StatCardTrend;
  /** Optional secondary helper / context text */
  description?: string;
  /** Optional status badge text or element */
  status?: string | React.ReactNode;
  /** Optional status badge variant */
  statusVariant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  /** Optional click handler or link destination */
  onClick?: () => void;
  href?: string;
  /** Additional container classes */
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  status,
  statusVariant = 'default',
  onClick,
  href,
  className = '',
}: StatCardProps) {
  const prefersReduced = useReducedMotion();
  const isInteractive = Boolean(onClick || href);

  const cardContent = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-4">
      {/* Top row: Label & Icon / Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-overline text-neutral-500 tracking-wider">
            {label}
          </p>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-tabular">
            {value}
          </div>
        </div>

        {Icon && (
          <div
            className="w-10 h-10 rounded-xl bg-[#0e4962]/10 text-[#0e4962] flex items-center justify-center shrink-0 transition-colors duration-200"
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Bottom row: Trend, Description, or Status badge */}
      {(trend || description || status) && (
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
          {trend && (
            <div
              className={`inline-flex items-center gap-1 text-caption font-semibold ${trend.direction === 'up'
                ? 'text-emerald-700'
                : trend.direction === 'down'
                  ? 'text-rose-700'
                  : 'text-neutral-600'
                }`}
            >
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span className="font-tabular">{trend.value}</span>
              {trend.label && (
                <span className="font-normal text-neutral-500">{trend.label}</span>
              )}
            </div>
          )}

          {description && !trend && (
            <p className="text-caption text-neutral-500 line-clamp-1">{description}</p>
          )}

          {status && (
            <div className="ml-auto">
              {typeof status === 'string' ? (
                <Badge variant={statusVariant}>{status}</Badge>
              ) : (
                status
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const containerClasses = `
    relative bg-white rounded-2xl border border-neutral-200/80 shadow-xs
    transition-colors duration-150 overflow-hidden
    ${isInteractive ? 'cursor-pointer hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962]' : ''}
    ${className}
  `.trim();

  // If link, wrap with Next.js Link
  if (href) {
    return (
      <motion.div
        {...(prefersReduced || !isInteractive ? {} : cardHoverMotion)}
        className="h-full"
      >
        <Link href={href} className={containerClasses + ' block h-full'}>
          {cardContent}
        </Link>
      </motion.div>
    );
  }

  // If clickable via onClick
  if (onClick) {
    return (
      <motion.div
        {...(prefersReduced ? {} : cardHoverMotion)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
        className={containerClasses}
      >
        {cardContent}
      </motion.div>
    );
  }

  // Standard static metric card
  return (
    <motion.div
      {...(prefersReduced ? {} : { whileHover: { y: -1, transition: { duration: 0.15 } } })}
      className={containerClasses}
    >
      {cardContent}
    </motion.div>
  );
}
