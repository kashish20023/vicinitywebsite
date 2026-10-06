'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, clearStoredSession, setStoredSession } from '@/lib/api';
import {
  Building2, Users2, Calendar, ShieldCheck,
  LogOut, ChevronRight, ShieldAlert, Menu, X
} from 'lucide-react';

export default function CoHostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const handleSwitchToCohost = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cohost@studioi.com', password: 'StudioI@Cohost2026' }),
      });
      const data = await res.json();
      if (data.token) {
        setStoredSession(data.token, data.user);
        setCurrentUser(data.user);
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to login as Co-Host');
    }
  };

  const navItems = [
    { label: 'Portal Overview', href: '/co-host', icon: Building2 },
    { label: 'Assigned Properties', href: '/co-host/properties', icon: Building2 },
    { label: 'Multi-Calendar', href: '/co-host/calendar', icon: Calendar },
    { label: 'Guest Reservations', href: '/co-host/bookings', icon: Users2 },
    { label: 'Guest Messages', href: '/co-host/messages', icon: Users2 },
    { label: 'Tasks & Maintenance', href: '/co-host/maintenance', icon: ShieldCheck },
    { label: 'Primary Hosts Directory', href: '/co-host/hosts', icon: Users2 },
    { label: 'Co-Host Earnings Split', href: '/co-host/earnings', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Access check: User must have cohost delegation or be ADMIN
  const hasCohostAccess = currentUser && (
    (currentUser.cohostPermissions && currentUser.cohostPermissions.length > 0) ||
    currentUser.role === 'COHOST' ||
    currentUser.role === 'ADMIN'
  );

  if (!hasCohostAccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-[#edf4f7] text-[#0e4962] rounded-full flex items-center justify-center mx-auto border border-[#adcada]/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">Studio i Co-Host Portal</h2>
            <p className="text-xs text-neutral-500 mt-2">
              Co-host permission matrix active. Access granted to authorized secondary hosts and operators.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSwitchToCohost}
              className="w-full py-3.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              Sign In as Assigned Co-Host (Instant Demo)
            </button>
            <Link
              href="/"
              className="block w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition"
            >
              Return to Studio i Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sidebarMarkup = (
    <div className="w-64 bg-white border-r border-neutral-200/80 p-6 flex flex-col justify-between shrink-0 h-full">
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-[#0e4962] to-[#1a6585] flex items-center justify-center font-black text-white text-lg shadow-xs">
              i
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-neutral-900 block">Studio i</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962] block">
                Co-Host Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${isActive
                  ? 'bg-[#0e4962] text-white shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-[#0e4962] hover:bg-[#edf4f7]/50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info */}
      <div className="pt-6 border-t border-neutral-100 space-y-4 shrink-0">
        <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-xs">
          <span className="text-[10px] uppercase font-bold text-[#0e4962] block tracking-wider">
            Delegated Co-Host
          </span>
          <span className="font-bold text-neutral-900 block truncate">{currentUser.name}</span>
          <span className="text-neutral-500 text-[11px] truncate block">{currentUser.email}</span>
        </div>

        <div className="flex gap-2">
          {/* <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex-1 text-center py-2 bg-neutral-100 hover:bg-neutral-200 text-[11px] font-semibold rounded-xl text-neutral-700"
          >
            Public Site
          </Link> */}
          <button
            onClick={() => {
              clearStoredSession();
              window.location.href = '/';
            }}
            title="Sign out"
            className="
              group flex items-center gap-2
              h-9 px-3.5
              rounded-xl
              text-neutral-500
              transition-all duration-200
              hover:bg-red-50
              hover:text-red-600
              active:scale-95
              cursor-pointer
            "
          >
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />

            <span className="text-[13px] font-medium">
              Logout
            </span>
          </button>
          {/* <button
            onClick={() => {
              clearStoredSession();
              window.location.href = '/';
            }}
            className="p-2 bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-400 rounded-xl transition cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button> */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex shrink-0">
        {sidebarMarkup}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex-1 max-w-xs w-full">
            {sidebarMarkup}
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Co-Host</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-neutral-900 font-bold capitalize">
                {pathname.split('/')[2] || 'Assigned Workspaces'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold rounded-full">
              Delegation Active
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 bg-[#F8F9FA]">
          {children}
        </main>
      </div>
    </div>
  );
}
