'use client';

import React from 'react';
import { Sparkles, Home } from 'lucide-react';

export interface PropertyGridProps {
  children?: React.ReactNode;
  loading?: boolean;
  skeletonCount?: number;
  columns?: 2 | 3 | 4 | 5;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  itemCount?: number;
  className?: string;
}

const COLUMN_STYLES = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
};

function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-neutral-200/90 rounded-3xl overflow-hidden shadow-2xs animate-pulse">
      <div className="aspect-[16/10] w-full bg-neutral-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-neutral-200 rounded-md w-3/4" />
        <div className="h-3 bg-neutral-200 rounded-md w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 bg-neutral-100 rounded-full w-20" />
          <div className="h-6 bg-neutral-100 rounded-full w-24" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="h-5 bg-neutral-200 rounded-md w-24" />
          <div className="h-8 bg-neutral-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGrid({
  children,
  loading = false,
  skeletonCount = 8,
  columns = 4,
  emptyTitle = 'No properties found',
  emptySubtitle = 'Try adjusting your search filters or dates to find available stays.',
  emptyIcon,
  emptyAction,
  itemCount,
  className = '',
}: PropertyGridProps) {
  if (loading) {
    return (
      <div className={`grid gap-5 sm:gap-6 ${COLUMN_STYLES[columns]} ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <PropertyCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  const isEmpty = itemCount !== undefined ? itemCount === 0 : React.Children.count(children) === 0;

  if (isEmpty) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-neutral-300 p-8 sm:p-12 max-w-xl mx-auto space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-[#0e4962]/10 border border-[#0e4962]/20 flex items-center justify-center text-[#0e4962] mx-auto">
          {emptyIcon || <Home className="w-8 h-8 text-[#0e4962]" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900">{emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {emptySubtitle}
          </p>
        </div>
        {emptyAction && <div className="pt-2">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className={`grid gap-5 sm:gap-6 ${COLUMN_STYLES[columns]} ${className}`}>
      {children}
    </div>
  );
}
