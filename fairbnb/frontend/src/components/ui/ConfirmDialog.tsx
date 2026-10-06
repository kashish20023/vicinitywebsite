'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
    iconBg: 'bg-rose-50 border-rose-200',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  warning: {
    icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
    iconBg: 'bg-amber-50 border-amber-200',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: <Info className="w-6 h-6 text-blue-600" />,
    iconBg: 'bg-blue-50 border-blue-200',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-200',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmText,
  cancelText,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const finalConfirmLabel = confirmLabel || confirmText || 'Confirm';
  const finalCancelLabel = cancelLabel || cancelText || 'Cancel';
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" showCloseButton={!loading}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${config.iconBg}`}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="text-h4 font-bold text-neutral-900">{title}</h3>
            <p className="text-body-sm text-neutral-600 mt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-button font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
          >
            {finalCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-button font-medium rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 ${config.confirmBtn}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
