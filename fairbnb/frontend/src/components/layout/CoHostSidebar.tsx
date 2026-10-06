'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  MessageSquare,
  Wrench,
  Calendar,
  DollarSign,
  Users,
  Settings,
} from 'lucide-react';
import {
  DashboardSidebarShell,
  DashboardMobileDrawer,
  DashboardNavItem,
  useDashboardNav,
} from '@/components/dashboard/navigation';

export default function CoHostSidebar() {
  const pathname = usePathname();
  const { isCollapsed, closeMobile } = useDashboardNav();

  const navItems = [
    { href: '/co-host', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/co-host/properties', label: 'Properties', icon: Building2 },
    { href: '/co-host/bookings', label: 'Bookings', icon: ClipboardList },
    {
      href: '/co-host/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: 3,
      badgeColor: 'bg-[#0e4962] text-white',
    },
    {
      href: '/co-host/maintenance',
      label: 'Tasks',
      icon: Wrench,
      badge: 2,
      badgeColor: 'bg-amber-500 text-white',
    },
    { href: '/co-host/calendar', label: 'Calendar', icon: Calendar },
    { href: '/co-host/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/co-host/hosts', label: 'Hosts', icon: Users },
    { href: '/co-host/settings', label: 'Settings', icon: Settings },
  ];

  const coHostHelpCard = (
    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-1.5 text-caption">
      <div className="flex items-center gap-2 text-neutral-900 font-semibold">
        <div className="w-5 h-5 rounded-full bg-[#0e4962] text-white flex items-center justify-center text-overline">
          👑
        </div>
        <span>You&apos;re a Co-Host</span>
      </div>
      <p className="text-neutral-500 leading-relaxed text-caption">
        Manage properties, track bookings, and coordinate with host owners.
      </p>
    </div>
  );

  const renderNavContent = (collapsed: boolean, onItemClick?: () => void) => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/co-host' && pathname.startsWith(item.href));

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
            layoutIdScope={collapsed ? 'cohost-collapsed' : 'cohost-desktop'}
            onClick={onItemClick}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <DashboardSidebarShell
        roleTitle="Co-Host"
        roleBadgeText="Co-Host"
        homeHref="/co-host"
        footerExtra={coHostHelpCard}
      >
        {renderNavContent(isCollapsed)}
      </DashboardSidebarShell>

      <DashboardMobileDrawer
        roleTitle="Co-Host"
        roleBadgeText="Co-Host"
        homeHref="/co-host"
        footerExtra={coHostHelpCard}
      >
        {renderNavContent(false, closeMobile)}
      </DashboardMobileDrawer>
    </>
  );
}
