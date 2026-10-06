'use client';

import React, { forwardRef } from 'react';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: boolean | string;
  sizeVariant?: 'sm' | 'md' | 'lg';
}

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      leadingIcon,
      trailingIcon,
      error,
      sizeVariant = 'md',
      className = '',
      disabled,
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

        <input
          ref={ref}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white font-medium text-neutral-900 transition outline-none placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed ${
            leadingIcon ? 'pl-10' : ''
          } ${trailingIcon ? 'pr-10' : ''} ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-neutral-300 focus:border-[#0e4962] focus:ring-2 focus:ring-[#0e4962]/15'
          } ${SIZE_STYLES[sizeVariant]} ${className}`}
          {...props}
        />

        {trailingIcon && (
          <div className="absolute right-3.5 flex items-center justify-center text-neutral-400">
            {trailingIcon}
          </div>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
