'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options?: SelectOption[];
  leadingIcon?: React.ReactNode;
  error?: boolean | string;
  sizeVariant?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      options,
      leadingIcon,
      error,
      sizeVariant = 'md',
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative flex items-center w-full">
        {leadingIcon && (
          <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-neutral-400">
            {leadingIcon}
          </div>
        )}

        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none rounded-xl border bg-white font-medium text-neutral-900 transition outline-none pr-10 cursor-pointer disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed ${
            leadingIcon ? 'pl-10' : ''
          } ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-neutral-300 focus:border-[#0e4962] focus:ring-2 focus:ring-[#0e4962]/15'
          } ${SIZE_STYLES[sizeVariant]} ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-neutral-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
