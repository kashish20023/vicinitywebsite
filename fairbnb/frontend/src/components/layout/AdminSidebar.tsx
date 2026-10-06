'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  UserCog,
  Building2,
  ClipboardList,
  TicketPercent,
  CheckCircle2,
  DollarSign,
  RotateCcw,
  HelpCircle,
  BarChart3,
  UserCheck,
  Activity,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  DashboardSidebarShell,
  DashboardMobileDrawer,
  DashboardNavItem,
  useDashboardNav,
} from '@/components/dashboard/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isCollapsed, closeMobile } = useDashboardNav();

  const navItems = [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    {
      href: '/admin/moderation',
      label: 'Moderation',
      icon: ShieldAlert,
      badge: 'Live',
      badgeColor: 'bg-rose-500 text-white',
    },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/hosts', label: 'Hosts', icon: UserCog },
    { href: '/admin/co-hosts', label: 'Co-Hosts', icon: UserCheck },
    { href: '/admin/listings', label: 'Listings', icon: Building2 },
    { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
    { href: '/admin/coupons', label: 'Coupons & Offers', icon: TicketPercent },
    {
      href: '/admin/verification',
      label: 'Verification',
      icon: CheckCircle2,
      badge: '8',
      badgeColor: 'bg-amber-500 text-white',
    },
    { href: '/admin/finance', label: 'Finance', icon: DollarSign },
    { href: '/admin/settlements', label: 'Settlements', icon: RotateCcw },
    {
      href: '/admin/support',
      label: 'Support',
      icon: HelpCircle,
      badge: '5',
      badgeColor: 'bg-rose-500 text-white',
    },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
  ];

  const bottomItems = [
    { href: '/admin/ai-settings', label: 'AI Controls', icon: Sparkles },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const renderNavContent = (collapsed: boolean, onItemClick?: () => void) => (
    <>
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <DashboardNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              isCollapsed={collapsed}
              badge={item.badge}
              badgeColor={item.badgeColor}
              layoutIdScope={collapsed ? 'admin-collapsed' : 'admin-desktop'}
              onClick={onItemClick}
            />
          );
        })}
      </div>

      <div className="pt-3 mt-3 border-t border-neutral-100 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <DashboardNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              isCollapsed={collapsed}
              layoutIdScope={collapsed ? 'admin-collapsed' : 'admin-desktop'}
              onClick={onItemClick}
            />
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <DashboardSidebarShell roleTitle="Admin" roleBadgeText="Admin" homeHref="/admin/dashboard">
        {renderNavContent(isCollapsed)}
      </DashboardSidebarShell>

      <DashboardMobileDrawer roleTitle="Admin" roleBadgeText="Admin" homeHref="/admin/dashboard">
        {renderNavContent(false, closeMobile)}
      </DashboardMobileDrawer>
    </>
  );
}
