'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';

export interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  subtitle?: React.ReactNode;
  trend?: {
    value: number | string;
    label?: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'rose' | 'emerald' | 'amber' | 'blue' | 'purple' | 'cyan';
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  loading?: boolean;
}

const VARIANT_STYLES = {
  default: {
    iconBg: 'bg-neutral-100 text-neutral-600',
    accentText: 'text-neutral-900',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600',
    accentText: 'text-rose-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    accentText: 'text-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    accentText: 'text-amber-600',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
    accentText: 'text-blue-600',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600',
    accentText: 'text-purple-600',
  },
  cyan: {
    iconBg: 'bg-cyan-50 text-cyan-600',
    accentText: 'text-cyan-600',
  },
};

export function StatCard({
  title,
  label,
  value,
  icon,
  subtitle,
  trend,
  variant = 'default',
  action,
  className = '',
  loading = false,
}: StatCardProps) {
  const finalTitle = title || label || '';
  const currentVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-5 h-5" />;
    }
    if (typeof icon === 'object' && icon !== null) {
      if ('render' in icon && typeof (icon as any).render === 'function') {
        try {
          return (icon as any).render({ className: 'w-5 h-5' }, null);
        } catch {
          const IconComponent = icon as any;
          return <IconComponent className="w-5 h-5" />;
        }
      }
      return React.createElement(icon as any, { className: 'w-5 h-5' });
    }
    return null;
  };

  return (
    <Card
      className={`border border-neutral-200 shadow-xs rounded-2xl bg-white p-5 transition hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-overline font-semibold uppercase tracking-wider text-neutral-500">
            {finalTitle}
          </span>
          {loading ? (
            <div className="h-8 flex items-center">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : (
            <p className="text-h2 font-bold font-tabular text-neutral-900 tracking-tight">
              {value}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${currentVariant.iconBg}`}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      {(trend || subtitle || action) && (
        <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-caption">
          {trend ? (
            <div
              className={`flex items-center gap-1 font-semibold ${
                trend.isPositive ?? true ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ?? true ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.label && (
                <span className="text-neutral-400 font-normal ml-0.5">{trend.label}</span>
              )}
            </div>
          ) : subtitle ? (
            <div className="text-neutral-500">{subtitle}</div>
          ) : <div />}

          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
              >
                {action.label} <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
              >
                {action.label} <ArrowRight className="w-3 h-3" />
              </button>
            )
          )}
        </div>
      )}
    </Card>
  );
}
