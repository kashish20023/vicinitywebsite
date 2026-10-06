'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Compass,
  Briefcase,
  Heart,
  Play,
  User,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Pages where bottom nav should NOT appear
// ────────────────────────────────────────────────────────────────────────────
const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/host/',
  '/admin/',
  '/broker/',
  '/co-host/',
];

// ────────────────────────────────────────────────────────────────────────────
// Nav item type
// ────────────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  match: (pathname: string) => boolean;
  /** If true, tab only renders when authenticated */
  authRequired?: boolean;
  /** Only render for these roles. Undefined = all roles. */
  roles?: ('USER' | 'HOST' | 'ADMIN')[];
}

// ────────────────────────────────────────────────────────────────────────────
// All possible nav items (guest + authenticated)
// ────────────────────────────────────────────────────────────────────────────
const BASE_ITEMS: NavItem[] = [
  {
    href: '/',
    icon: Compass,
    label: 'Explore',
    match: (p) => p === '/' || p.startsWith('/properties') || p.startsWith('/search'),
  },
  {
    href: '/wishlists',
    icon: Heart,
    label: 'Wishlist',
    match: (p) => p.startsWith('/wishlists'),
  },
  {
    href: '/reels',
    icon: Play,
    label: 'Reels',
    match: (p) => p.startsWith('/reels'),
  },
  {
    href: '/guest/trips',
    icon: Briefcase,
    label: 'Trips',
    match: (p) => p.startsWith('/guest/trips') || p.startsWith('/book'),
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Don't render during auth hydration to avoid flicker
  if (isLoading) return null;

  // Hide on specific pages / dashboards
  const shouldHide = HIDDEN_PREFIXES.some((prefix) =>
    prefix.endsWith('/')
      ? pathname.startsWith(prefix)
      : pathname === prefix
  );
  if (shouldHide) return null;

  // Always show 5 tabs: Explore, Wishlist, Reels, Trips, Profile/Login
  const items: NavItem[] = [...BASE_ITEMS];

  // Last tab: Profile (logged in) or Login (guest)
  const profileItem: NavItem = isAuthenticated && user
    ? {
        href: '/account/wallet',
        icon: User,
        label: user.name.split(' ')[0],
        match: (p) => p.startsWith('/account'),
      }
    : {
        href: '/login',
        icon: User,
        label: 'Login',
        match: (p) => p === '/login',
      };

  items.push(profileItem);

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="pointer-events-auto bg-white border-t border-gray-200 px-2 py-1.5 pb-safe flex items-center justify-around">
        {items.map(({ href, icon: Icon, label, match }) => {
          const isActive = match(pathname);

          // Special case: profile tab shows user avatar when logged in
          const isProfileTab = label === (user?.name.split(' ')[0] ?? '');
          const showAvatar = isProfileTab && isAuthenticated && user;

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center gap-0.5 min-w-[48px] sm:min-w-[56px] select-none py-1"
            >
              {/* Icon container */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-[#0e4962] shadow-sm'
                    : 'bg-transparent'
                }`}
              >
                {showAvatar ? (
                  <span
                    className={`text-sm font-bold leading-none ${
                      isActive ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {user!.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Icon
                    className={`w-[20px] h-[20px] transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-caption font-medium leading-none tracking-normal transition-colors duration-200 max-w-[52px] truncate ${
                  isActive ? 'text-[#0e4962] font-semibold' : 'text-gray-500'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
