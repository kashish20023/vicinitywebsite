'use client';

import React from 'react';

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  helperText?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  optional,
  error,
  helperText,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={htmlFor}
            className="block text-caption font-semibold text-neutral-800"
          >
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
          {optional && (
            <span className="text-overline text-neutral-400 font-normal">Optional</span>
          )}
        </div>
      )}

      <div>{children}</div>

      {error ? (
        <p className="text-caption font-medium text-rose-600 flex items-center gap-1 animate-in fade-in duration-150">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-caption text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
