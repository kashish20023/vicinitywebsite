'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import HostSidebar from "@/components/layout/HostSidebar";
import HostHeader from "@/components/layout/HostHeader";
import { DashboardNavProvider } from "@/components/dashboard/navigation";

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/host/today');
      } else if (user?.role !== 'HOST' && user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || (user?.role !== 'HOST' && user?.role !== 'ADMIN')) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-[#0e4962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardNavProvider>
      <div className="h-screen flex bg-white overflow-hidden text-gray-900">
        <HostSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <HostHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardNavProvider>
  );
}

