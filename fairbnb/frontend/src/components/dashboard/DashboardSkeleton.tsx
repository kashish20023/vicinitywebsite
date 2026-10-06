import React from 'react';

/**
 * Common shimmer bar primitive.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-neutral-200/80 rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Metric card skeleton matching StatCard dimensions.
 */
export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-5 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-xs space-y-4 ${className}`}
      aria-label="Loading metric"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      </div>
      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Grid of metric card skeletons.
 */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * List skeleton for bookings, activity feed, recent messages, etc.
 */
export function ListSkeleton({
  count = 4,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`} aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-white rounded-xl border border-neutral-200/80 shadow-xs flex items-center gap-4"
        >
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table rows skeleton matching dashboard data tables.
 */
export function TableRowSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-neutral-100 animate-pulse">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="py-4 px-4">
              <Skeleton
                className={`h-4 ${c === 0 ? 'w-32' : c === columns - 1 ? 'w-16' : 'w-24'}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Generic content / chart block skeleton.
 */
export function ContentBlockSkeleton({
  height = 'h-64',
  className = '',
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-xs space-y-4 ${className}`}
      aria-label="Loading content"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className={`w-full ${height} bg-neutral-100/80 rounded-xl animate-pulse flex items-center justify-center`}>
        <div className="w-10 h-10 rounded-full border-2 border-neutral-200 border-t-neutral-400 animate-spin" />
      </div>
    </div>
  );
}

export const DashboardSkeleton = {
  Base: Skeleton,
  StatCard: StatCardSkeleton,
  StatGrid: StatGridSkeleton,
  List: ListSkeleton,
  TableRows: TableRowSkeleton,
  Block: ContentBlockSkeleton,
};
