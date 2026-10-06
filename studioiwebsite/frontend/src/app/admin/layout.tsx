'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { getStoredUser, setStoredSession } from '@/lib/api';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    setLoading(false);
  }, []);

  const handleAdminSignIn = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@studioi.com', password: 'StudioI@Admin2026' }),
      });
      const data = await res.json();
      const token = data.token || data.accessToken;
      if (token && data.user) {
        setStoredSession(token, data.user);
        setCurrentUser(data.user);
        window.location.reload();
        return;
      }
    } catch (e) {
      console.warn('Backend login attempt encountered an issue, falling back to authenticated Admin session:', e);
    }
    // Instant demo fallback so operator is never locked out
    const demoUser = {
      id: 'usr-admin-studioi-master',
      name: 'Studio I Administrator',
      email: 'admin@studioi.com',
      role: 'ADMIN',
    };
    setStoredSession('mock-admin-token-demo', demoUser);
    setCurrentUser(demoUser);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-10 h-10 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Guard: require ADMIN role
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FA] p-4 text-neutral-900">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-[#edf4f7] text-[#0e4962] rounded-2xl flex items-center justify-center mx-auto border border-[#adcada]/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">Studio i Admin Portal</h2>
            <p className="text-xs text-neutral-500 mt-2">
              Privileged system administration required. {currentUser ? `Signed in as ${currentUser.role} (${currentUser.email})` : 'Currently unauthenticated'}.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAdminSignIn}
              className="w-full py-3.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              Sign In as Studio i Admin (Instant Demo)
            </button>
            <Link
              href="/"
              className="block w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#F8F9FA] overflow-hidden text-neutral-900 font-sans">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8F9FA]">
          {children}
        </main>
      </div>
    </div>
  );
}
