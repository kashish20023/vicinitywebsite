'use client';

import React, { forwardRef } from 'react';

export interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  showCount?: boolean;
  maxLength?: number;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      error,
      showCount = false,
      maxLength,
      className = '',
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="relative w-full space-y-1">
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white p-3 text-sm font-medium text-neutral-900 transition outline-none placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-neutral-300 focus:border-[#0e4962] focus:ring-2 focus:ring-[#0e4962]/15'
          } ${className}`}
          {...props}
        />

        {showCount && maxLength && (
          <div className="flex justify-end text-caption text-neutral-400 font-mono">
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    );
  }
);

TextareaField.displayName = 'TextareaField';
