'use client';

import React from 'react';

export type StatusType =
  | 'ACTIVE'
  | 'APPROVED'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'CONFIRMED'
  | 'SETTLED'
  | 'COMPLETED'
  | 'PAID'
  | 'READY'
  | 'SUCCESS'
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'IN_REVIEW'
  | 'PROCESSING'
  | 'PAYABLE'
  | 'HELD'
  | 'DRAFT'
  | 'DISMISS'
  | 'DISMISSED'
  | 'UNVERIFIED'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REVOKED'
  | 'EXPIRED'
  | 'FAILED'
  | 'ERROR'
  | 'DELETED'
  | 'PARTIALLY_SETTLED'
  | 'STAYING'
  | 'UPCOMING'
  | 'PRIMARY'
  | 'CO_HOST'
  | 'COMMENT'
  | 'REEL'
  | 'ARCHIVED'
  | 'INACTIVE'
  | 'BLOCKED'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  // Positive / Success statuses
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  VERIFIED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  PUBLISHED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  CONFIRMED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  SETTLED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  READY: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  SUCCESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },

  // Pending / Warning statuses
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  PENDING_APPROVAL: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  IN_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  PROCESSING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  PAYABLE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  HELD: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  DRAFT: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', dot: 'bg-neutral-400' },
  DISMISS: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', dot: 'bg-neutral-400' },
  DISMISSED: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', dot: 'bg-neutral-400' },
  UNVERIFIED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },

  // Negative / Danger statuses
  SUSPENDED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  REVOKED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  EXPIRED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  FAILED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  ERROR: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  DELETED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },

  // Info / Blue / Purple statuses
  PARTIALLY_SETTLED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  STAYING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  UPCOMING: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  PRIMARY: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  CO_HOST: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  COMMENT: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  REEL: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },

  // Neutral
  ARCHIVED: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', dot: 'bg-neutral-400' },
  INACTIVE: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', dot: 'bg-neutral-400' },
  BLOCKED: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', dot: 'bg-neutral-400' },
};

const DEFAULT_COLOR = {
  bg: 'bg-neutral-50',
  text: 'text-neutral-700',
  border: 'border-neutral-200',
  dot: 'bg-neutral-400',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-xs',
};

export function StatusBadge({
  status,
  label,
  showDot = false,
  pulse = false,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const normalizedKey = (status || '').toUpperCase().trim();
  const theme = STATUS_COLOR_MAP[normalizedKey] || DEFAULT_COLOR;
  const displayLabel = label || status?.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-colors ${theme.bg} ${theme.text} ${theme.border} ${SIZE_CLASSES[size]} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${theme.dot}`} />
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
