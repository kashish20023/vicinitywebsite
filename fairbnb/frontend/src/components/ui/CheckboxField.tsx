'use client';

import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, description, checked, className = '', disabled, id, ...props }, ref) => {
    const inputId = id || (label ? `cb_${String(label).toLowerCase().replace(/\s+/g, '_')}` : undefined);

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={inputId}
            className="w-5 h-5 rounded-lg border-2 border-neutral-300 bg-white peer-checked:bg-rose-600 peer-checked:border-rose-600 peer-focus:ring-2 peer-focus:ring-rose-500/20 transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-100"
          >
            <Check className="w-3.5 h-3.5 text-white stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
          </label>
        </div>

        {(label || description) && (
          <div className="space-y-0.5 select-none">
            {label && (
              <label
                htmlFor={inputId}
                className="block text-caption font-semibold text-neutral-900 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-caption text-neutral-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = 'CheckboxField';
