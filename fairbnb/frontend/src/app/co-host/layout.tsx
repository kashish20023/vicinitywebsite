'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import CoHostSidebar from '@/components/layout/CoHostSidebar';
import CoHostHeader from '@/components/layout/CoHostHeader';
import { DashboardNavProvider } from '@/components/dashboard/navigation';

export default function CoHostPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isCoHost, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/co-host');
      } else if (!isCoHost && user?.role !== 'HOST' && user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isCoHost, isLoading, user, router]);

  if (isLoading || !isAuthenticated || (!isCoHost && user?.role !== 'HOST' && user?.role !== 'ADMIN')) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-3 border-[#0e4962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardNavProvider>
      <div className="h-screen flex bg-neutral-50 overflow-hidden text-gray-900">
        <CoHostSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <CoHostHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            {children}
          </main>
        </div>
      </div>
    </DashboardNavProvider>
  );
}

