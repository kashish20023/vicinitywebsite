'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, clearStoredSession, setStoredSession } from '@/lib/api';
import {
  LayoutDashboard, Building2, Calendar, Users2,
  Wallet, ShieldAlert, LogOut, ChevronRight, Sparkles, Building, Menu, X
} from 'lucide-react';

export default function HostLayout({
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

  const handleSwitchToHost = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'host@studioi.com', password: 'StudioI@Host2026' }),
      });
      const data = await res.json();
      if (data.token) {
        setStoredSession(data.token, data.user);
        setCurrentUser(data.user);
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to login as Host');
    }
  };

  const navItems = [
    { label: 'Host Today', href: '/host/today', icon: LayoutDashboard },
    { label: 'Property Listings', href: '/host/listings', icon: Building },
    { label: '+ Add New Listing', href: '/host/listings/new', icon: Sparkles },
    { label: 'Multi-Calendar', href: '/host/calendar', icon: Calendar },
    { label: 'Reservations', href: '/host/bookings', icon: ChevronRight },
    { label: 'Guest Messages', href: '/host/messages', icon: Users2 },
    { label: 'Earnings & Payouts', href: '/host/earnings', icon: Wallet },
    { label: 'Co-Host Governance', href: '/host/co-hosts', icon: Users2 },
    { label: 'Sent Invitations', href: '/host/invites', icon: ChevronRight },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Access check: User must be HOST or ADMIN
  if (!currentUser || (currentUser.role !== 'HOST' && currentUser.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-[#edf4f7] text-[#0e4962] rounded-full flex items-center justify-center mx-auto border border-[#adcada]/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">Studio i Host Portal</h2>
            <p className="text-xs text-neutral-500 mt-2">
              Workspace Host access required. You are currently {currentUser ? `signed in as ${currentUser.role} (${currentUser.email})` : 'signed out'}.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSwitchToHost}
              className="w-full py-3.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              Sign In as Studio i Host (Instant Demo)
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
                Host Platform
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

      {/* User Info & Switcher */}
      <div className="pt-6 border-t border-neutral-100 space-y-4 shrink-0">
        <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-xs">
          <span className="text-[10px] uppercase font-bold text-[#0e4962] block tracking-wider">
            Verified Host
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

      {/* Main Host Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
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
              <span>Host</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-neutral-900 font-bold capitalize">
                {pathname.split('/')[2] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-full">
              Host Console Active
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
