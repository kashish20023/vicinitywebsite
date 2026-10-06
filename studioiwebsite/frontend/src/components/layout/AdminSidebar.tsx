'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Building2,
  ClipboardList,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  MapPin,
  ExternalLink,
  Layers
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('studioi_token');
      localStorage.removeItem('studioi_user');
      window.location.href = '/';
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/moderation', label: 'Moderation Queue', icon: ShieldAlert, badge: 'Live', badgeVariant: 'pink' as const },
    { href: '/admin/verification', label: 'KYC Verification', icon: CheckCircle2, badge: 'Verified', badgeVariant: 'success' as const },
    { href: '/admin/users', label: 'User Directory', icon: Users },
    { href: '/admin/hosts', label: 'Host Governance', icon: Building2 },
    { href: '/admin/co-hosts', label: 'Co-Host Governance', icon: Users, badge: 'Delegates', badgeVariant: 'pink' as const },
    { href: '/admin/listings', label: 'Workspaces & Units', icon: Layers },
    { href: '/admin/bookings', label: 'Bookings Manager', icon: ClipboardList },
    { href: '/admin/finance', label: 'Finance & Collections', icon: DollarSign },
    { href: '/admin/settlements', label: 'Payout Settlements', icon: Sparkles, badge: 'Split', badgeVariant: 'pink' as const },
    { href: '/admin/coupons', label: 'Coupons & Promos', icon: Sparkles },
    { href: '/admin/marketing/banners', label: 'Banners & Features', icon: Sparkles },
    { href: '/admin/support', label: 'Disputes & Support', icon: HelpCircle },
    { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
    { href: '/admin/audit-logs', label: 'Security Audit Logs', icon: ShieldAlert },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200 text-neutral-800 select-none shadow-xs w-64">
      {/* Studio I Brand Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-neutral-100 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onCloseMobile}>
          <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-[#0e4962] to-[#1a6585] flex items-center justify-center text-white font-black text-lg shadow-xs group-hover:scale-105 transition-transform duration-200">
            i
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight text-neutral-900">
              Studio <span className="text-[#0e4962]">i</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2 py-0.5 rounded-full border border-[#adcada]">
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${isActive
                ? 'bg-[#0e4962] text-white shadow-xs font-extrabold'
                : 'text-neutral-600 hover:bg-[#edf4f7]/40 hover:text-[#0e4962]'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-[#0e4962]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge
                  variant={item.badgeVariant || 'default'}
                  className={`text-[10px] px-2 py-0.2 ${isActive ? 'bg-white/20 text-white border-white/30' : ''}`}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}

        {/* Secondary Settings Links */}
        <div className="pt-4 mt-4 border-t border-neutral-100 space-y-1">
          <Link
            href="/admin/settings/amenities-tags"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${pathname === '/admin/settings/amenities-tags'
              ? 'bg-[#0e4962] text-white shadow-xs'
              : 'text-neutral-600 hover:bg-[#edf4f7]/40 hover:text-[#0e4962]'
              }`}
          >
            <Layers className="w-4 h-4 text-neutral-400 group-hover:text-[#0e4962] transition-colors" />
            <span>Amenities & Facilities</span>
          </Link>

          <Link
            href="/admin/settings"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${pathname === '/admin/settings'
              ? 'bg-[#0e4962] text-white shadow-xs'
              : 'text-neutral-600 hover:bg-[#edf4f7]/40 hover:text-[#0e4962]'
              }`}
          >
            <Settings className="w-4 h-4 text-neutral-400 group-hover:text-[#0e4962] transition-colors" />
            <span>Platform Settings</span>
          </Link>
        </div>
      </nav>

      {/* Footer Return & Logout */}
      <div className="p-4 border-t border-neutral-100 space-y-2 shrink-0">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition border border-neutral-200 rounded-xl hover:bg-neutral-50"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Public Site</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:text-red-700 transition border border-red-100 hover:border-red-200 rounded-xl hover:bg-red-50/50 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex-1 max-w-xs w-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
