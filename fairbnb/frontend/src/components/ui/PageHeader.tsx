'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  backLabel,
  badge,
  actions,
  action,
  children,
  className = '',
}: PageHeaderProps) {
  const actionContent = actions || action || children;
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6 ${className}`}
    >
      <div className="space-y-1">
        {/* Back Link or Breadcrumbs */}
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 hover:text-rose-600 transition mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel || 'Back'}</span>
          </Link>
        ) : breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-caption text-neutral-500 font-medium mb-1 flex-wrap">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-neutral-300" />}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-rose-600 transition font-semibold"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-neutral-900 font-semibold' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        ) : null}

        {/* Title & Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {typeof title === 'string' ? (
            <h1 className="text-h2 sm:text-h1 font-bold text-neutral-900 tracking-tight">
              {title}
            </h1>
          ) : (
            title
          )}
          {badge}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-neutral-500 text-body-sm font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      {actionContent && (
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {actionContent}
        </div>
      )}
    </div>
  );
}
