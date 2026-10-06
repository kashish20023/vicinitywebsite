'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { buttonTapMotion } from '@/lib/motion';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface EmptyStateProps {
  /** Icon displayed in the badge circle */
  icon?: React.ComponentType<{ className?: string }>;
  /** Headline message */
  title: string;
  /** Explanatory description */
  description?: string;
  /** Primary call-to-action button or link */
  primaryAction?: EmptyStateAction;
  /** Optional secondary link or action */
  secondaryAction?: EmptyStateAction;
  /** Optional container style override */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={`bg-white rounded-3xl border border-dashed border-neutral-300 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      {Icon && (
        <div
          className="w-14 h-14 rounded-2xl bg-[#0e4962]/10 text-[#0e4962] flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-200"
          aria-hidden="true"
        >
          <Icon className="w-7 h-7" />
        </div>
      )}

      <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-sm text-neutral-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          {primaryAction && (
            <ActionButton
              action={primaryAction}
              variant="primary"
              prefersReduced={prefersReduced}
            />
          )}

          {secondaryAction && (
            <ActionButton
              action={secondaryAction}
              variant="secondary"
              prefersReduced={prefersReduced}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  action,
  variant,
  prefersReduced,
}: {
  action: EmptyStateAction;
  variant: 'primary' | 'secondary';
  prefersReduced: boolean | null;
}) {
  const Icon = action.icon;
  const isPrimary = variant === 'primary';

  const baseClasses = `
    inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
    transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[#0e4962] focus-visible:ring-offset-1
    ${
      isPrimary
        ? 'bg-[#0e4962] text-white hover:bg-[#093447] shadow-xs'
        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
    }
  `.trim();

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      <span>{action.label}</span>
    </>
  );

  if (action.href) {
    return (
      <motion.div {...(prefersReduced ? {} : buttonTapMotion)}>
        <Link href={action.href} className={baseClasses}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      {...(prefersReduced ? {} : buttonTapMotion)}
      onClick={action.onClick}
      className={`${baseClasses} cursor-pointer`}
    >
      {content}
    </motion.button>
  );
}
