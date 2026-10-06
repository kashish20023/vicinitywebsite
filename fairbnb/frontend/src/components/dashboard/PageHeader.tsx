'use client';

import React from 'react';

export interface PageHeaderProps {
  /** Uppercase eyebrow label, e.g. "HOSTING WORKSPACE", "ADMIN CONTROL" */
  workspace?: string;
  /** Main page title */
  title: string;
  /** Explanatory subtitle */
  description?: string;
  /** Optional icon displayed in a subtle container beside title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Action buttons (Add, Export, Refresh, etc.) */
  actions?: React.ReactNode;
  /** Optional status pill or count badge next to title */
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  workspace,
  title,
  description,
  icon: Icon,
  actions,
  badge,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 ${className}`}
    >
      <div className="space-y-1">
        {workspace && (
          <p className="text-overline font-semibold uppercase tracking-wider text-neutral-400">
            {workspace}
          </p>
        )}

        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-10 h-10 rounded-2xl bg-[#0e4962]/10 text-[#0e4962] flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Icon className="w-5 h-5" />
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-h2 font-bold tracking-tight text-neutral-900">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
        </div>

        {description && (
          <p className="text-body-sm text-neutral-500 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
