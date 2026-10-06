'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const TOAST_STYLES = {
  success: 'border-emerald-200/80 bg-white/95 text-neutral-900 shadow-emerald-500/10',
  error: 'border-rose-200/80 bg-white/95 text-neutral-900 shadow-rose-500/10',
  warning: 'border-amber-200/80 bg-white/95 text-neutral-900 shadow-amber-500/10',
  info: 'border-blue-200/80 bg-white/95 text-neutral-900 shadow-blue-500/10',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) =>
      addToast('success', message, title, duration),
    error: (message: string, title?: string, duration?: number) =>
      addToast('error', message, title, duration),
    warning: (message: string, title?: string, duration?: number) =>
      addToast('warning', message, title, duration),
    info: (message: string, title?: string, duration?: number) =>
      addToast('info', message, title, duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* GLOBAL TOAST CONTAINER */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none p-4 sm:p-0 select-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${TOAST_STYLES[t.type]}`}
          >
            <div className="mt-0.5">{TOAST_ICONS[t.type]}</div>
            <div className="flex-1 space-y-0.5 pr-2">
              {t.title && <p className="font-bold text-xs text-neutral-900">{t.title}</p>}
              <p className="text-xs text-neutral-600 font-medium leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
