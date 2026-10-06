'use client';

import React from 'react';
import { Search, X, LayoutGrid, List } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface SortOption {
  id: string;
  label: string;
}

export interface FilterToolbarProps {
  /** Search string */
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  /** Filter pills */
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  /** Sort select options */
  sortOptions?: SortOption[];
  activeSort?: string;
  onSortChange?: (sortId: string) => void;
  /** View mode switcher */
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  /** Extra controls slot */
  children?: React.ReactNode;
  className?: string;
}

export function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  activeFilter,
  onFilterChange,
  sortOptions,
  activeSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  children,
  className = '',
}: FilterToolbarProps) {
  return (
    <div
      className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/80 shadow-xs ${className}`}
    >
      {/* LEFT: Filter Pills */}
      {filters && filters.length > 0 && onFilterChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={`px-3.5 py-1.5 rounded-xl text-caption font-semibold whitespace-nowrap transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0e4962] text-white shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200/60'
                }`}
              >
                <span>{filter.label}</span>
                {filter.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-overline font-semibold font-tabular ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-200/80 text-neutral-700'
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* RIGHT: Search, Sort, View Controls */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
        {/* Search Box */}
        {onSearchChange && (
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-200/80 rounded-xl text-caption font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-[#0e4962] focus:bg-white focus:ring-1 focus:ring-[#0e4962] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Sort Select */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200/80 rounded-xl text-caption font-semibold text-neutral-700 outline-none focus:border-[#0e4962] focus:ring-1 focus:ring-[#0e4962] cursor-pointer transition-colors shrink-0"
          >
            {sortOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* View Mode Toggle */}
        {viewMode && onViewModeChange && (
          <div className="flex items-center border border-neutral-200/80 rounded-xl overflow-hidden bg-neutral-50 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0e4962] shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#0e4962] shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
