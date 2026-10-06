'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Building2,
  ClipboardList,
  MessageSquare,
  DollarSign,
  BarChart3,
  HelpCircle,
  Settings,
  Mail,
  Users,
  UserCheck,
} from 'lucide-react';
import {
  DashboardSidebarShell,
  DashboardMobileDrawer,
  DashboardNavItem,
  DashboardNavCollapsible,
  useDashboardNav,
} from '@/components/dashboard/navigation';

export default function HostSidebar() {
  const pathname = usePathname();
  const { isCollapsed, closeMobile } = useDashboardNav();

  const isCoHostRoute = pathname.includes('/invites') || pathname.includes('/co-hosts');
  const [userToggledCoHost, setUserToggledCoHost] = useState<boolean | null>(null);
  const isCoHostOpen = userToggledCoHost !== null ? userToggledCoHost : isCoHostRoute;

  const navItems = [
    { href: '/host/today', label: 'Today', icon: Home },
    { href: '/host/calendar', label: 'Calendar', icon: Calendar },
    { href: '/host/listings', label: 'Listings', icon: Building2 },
    { href: '/host/bookings', label: 'Bookings', icon: ClipboardList },
    { href: '/host/messages', label: 'Messages', icon: MessageSquare },
  ];

  const subItems = [
    { href: '/host/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/host/insights', label: 'Insights', icon: BarChart3 },
  ];

  const bottomItems = [
    { href: '/host/support', label: 'Help & Support', icon: HelpCircle },
    { href: '/host/settings', label: 'Settings', icon: Settings },
  ];

  const coHostChildren = [
    {
      href: '/host/invites',
      label: 'Co-host Invite',
      icon: Mail,
      isActive: pathname === '/host/invites',
    },
    {
      href: '/host/co-hosts/own',
      label: "Own's Co-host",
      icon: UserCheck,
      isActive: pathname === '/host/co-hosts/own',
    },
  ];

  // Render navigation links (shared between desktop and mobile)
  const renderNavContent = (collapsed: boolean, onItemClick?: () => void) => (
    <>
      {/* Primary items */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <DashboardNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              isCollapsed={collapsed}
              layoutIdScope={collapsed ? 'host-collapsed' : 'host-desktop'}
              onClick={onItemClick}
            />
          );
        })}
      </div>

      {/* Sub items & Co-host accordion */}
      <div className="pt-3 mt-3 border-t border-neutral-100 space-y-1">
        {subItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <DashboardNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              isCollapsed={collapsed}
              layoutIdScope={collapsed ? 'host-collapsed' : 'host-desktop'}
              onClick={onItemClick}
            />
          );
        })}

        {/* Collapsible Co-Host section */}
        <DashboardNavCollapsible
          label="Co-host"
          icon={Users}
          isOpen={isCoHostOpen}
          onToggle={() => setUserToggledCoHost(!isCoHostOpen)}
          isParentActive={isCoHostRoute}
          isCollapsed={collapsed}
          items={coHostChildren}
          onItemClick={onItemClick}
        />
      </div>

      {/* Support & Settings */}
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
              layoutIdScope={collapsed ? 'host-collapsed' : 'host-desktop'}
              onClick={onItemClick}
            />
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent / Collapsible Sidebar */}
      <DashboardSidebarShell roleTitle="Host" roleBadgeText="Host" homeHref="/host/today">
        {renderNavContent(isCollapsed)}
      </DashboardSidebarShell>

      {/* Mobile Drawer */}
      <DashboardMobileDrawer roleTitle="Host" roleBadgeText="Host" homeHref="/host/today">
        {renderNavContent(false, closeMobile)}
      </DashboardMobileDrawer>
    </>
  );
}
