'use client';

import React from 'react';

export interface FilterTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface FilterTabsProps<T extends string = string> {
  tabs: FilterTabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'pills' | 'underline' | 'cards';
  className?: string;
  size?: 'sm' | 'md';
}

export function FilterTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className = '',
  size = 'md',
}: FilterTabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={`border-b border-neutral-200 overflow-x-auto ${className}`}>
        <nav className="flex space-x-6 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`py-3 text-overline font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-caption font-semibold ${
                      isActive ? 'bg-rose-50 text-rose-600' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Default 'pills' variant
  const paddingClass = size === 'sm' ? 'px-3 py-1.5 text-caption' : 'px-4 py-2 text-overline';

  return (
    <div className={`flex items-center gap-2 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`${paddingClass} rounded-xl font-semibold transition uppercase tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer ${
              isActive
                ? 'bg-[#0e4962] text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-caption ${
                  isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
