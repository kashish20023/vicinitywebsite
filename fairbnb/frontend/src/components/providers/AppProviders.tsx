'use client';

import React from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ToastProvider } from '@/context/toast-context';
import { BannerModal } from '@/components/ui/BannerModal';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
        <BannerModal />
        <MobileBottomNav />
      </ToastProvider>
    </AuthProvider>
  );
}
