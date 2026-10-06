'use client';

import React, { forwardRef } from 'react';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  currencySymbol?: string;
  error?: boolean | string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      currencySymbol = '₹',
      error,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      const num = raw ? parseInt(raw, 10) : 0;
      onChange(num);
    };

    const displayValue =
      value === '' || value === undefined || value === null
        ? ''
        : Number(value).toLocaleString('en-IN');

    return (
      <div className="relative flex items-center w-full">
        <span className="absolute left-3.5 flex items-center justify-center font-bold text-neutral-500 text-sm pointer-events-none select-none">
          {currencySymbol}
        </span>

        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          className={`w-full rounded-xl border bg-white pl-8 pr-4 py-2 text-sm font-semibold font-tabular text-neutral-900 transition outline-none placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-neutral-300 focus:border-[#0e4962] focus:ring-2 focus:ring-[#0e4962]/15'
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
