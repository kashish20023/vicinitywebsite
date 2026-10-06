'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/context/toast-context';

export interface ContactChipProps {
  type: 'phone' | 'email' | 'address';
  value: string;
  label?: string;
  allowCopy?: boolean;
  clickable?: boolean;
  className?: string;
}

export function ContactChip({
  type,
  value,
  label,
  allowCopy = true,
  clickable = true,
  className = '',
}: ContactChipProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copied ${type === 'phone' ? 'phone number' : type === 'email' ? 'email' : 'address'} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = type === 'phone' ? Phone : type === 'email' ? Mail : MapPin;
  const href = type === 'phone' ? `tel:${value}` : type === 'email' ? `mailto:${value}` : undefined;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200/80 text-xs text-neutral-700 font-medium transition-all group ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 shrink-0" />

      {label && <span className="font-semibold text-neutral-900">{label}:</span>}

      {clickable && href ? (
        <a
          href={href}
          className="hover:underline hover:text-neutral-900 truncate max-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      ) : (
        <span className="truncate max-w-[200px]">{value}</span>
      )}

      {allowCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className="ml-1 p-0.5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-300/50 transition cursor-pointer"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}
