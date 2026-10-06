'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SearchExpandedModal } from '@/components/search/SearchExpandedModal';
import { LocationSelectorPopover } from '@/components/layout/LocationSelectorPopover';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { motion } from 'framer-motion';
import {
  Search,
  User,
  Heart,
  Home,
  ShieldCheck,
  Briefcase,
  LogOut,
  Sparkles,
  Users,
  Wallet,
  Bell,
  MessageSquare,
  UserCircle,
  Settings,
  HelpCircle,
  ClipboardList,
  Luggage,
  MapPin,
  Calendar,
} from 'lucide-react';

interface AirbnbHeaderProps {
  onSearch?: (params: { city: string; guests: number }) => void;
  currentCity?: string;
  currentGuests?: number;
}

export function AirbnbHeader({ onSearch, currentCity = '', currentGuests = 1 }: AirbnbHeaderProps) {
  const { user, isAuthenticated, isCoHost, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [notificationsPopoverOpen, setNotificationsPopoverOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktopHeader, setIsDesktopHeader] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/';

  // Responsive desktop check
  useEffect(() => {
    const handleResize = () => {
      setIsDesktopHeader(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll position threshold tracking
  useEffect(() => {
    const COLLAPSE_AT = 64;
    const EXPAND_AT = 16;
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled((prev) => {
        if (y > COLLAPSE_AT) return true;
        if (y < EXPAND_AT) return false;
        return prev;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (target.closest('button[data-menu-trigger="true"]')) return;
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSearchSubmit = (params: { city: string; guests: number }) => {
    if (onSearch) {
      onSearch(params);
    } else {
      router.push(`/?city=${encodeURIComponent(params.city)}&guests=${params.guests}`);
    }
  };

  const searchCollapsed = isHome && isScrolled && !searchModalOpen;
  const searchLiftY = isDesktopHeader ? -68 : -56;

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white border-b border-gray-200/60 transition-[box-shadow,padding] duration-300 ease-out ${isScrolled ? 'shadow-sm' : ''
          }`}
      >
        <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12  relative">
          <div className="relative overflow-visible">

            {/* Row 1: Logo | Nav | Actions */}
            <div
              className={`relative flex items-center justify-between z-20 overflow-visible transition-[min-height,height,padding] duration-300 ease-out ${isHome && searchCollapsed
                ? 'min-h-16 md:min-h-21 py-2 md:py-2'
                : 'min-h-14 md:min-h-21 h-auto py-2 md:py-2'
                }`}
            >
              {/* 1. BRAND LOGO */}
              <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0 relative z-10 group">
                <span className="font-bold tracking-tight text-[#0e4962] text-display">
                  Stays
                </span>
              </Link>

              {/* 2. CENTER NAVIGATION LINKS */}
              {!searchCollapsed && (
                <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-6 xl:gap-8">
                  <Link
                    href="/"
                    className={`relative text-sm py-4 transition-colors font-semibold ${pathname === '/' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    Stays
                    {pathname === '/' && (
                      <span className="absolute bottom-1 left-0 right-0 h-0.5 bg-[#0e4962] rounded-full" />
                    )}
                  </Link>
                  <Link
                    href="/events"
                    className={`relative text-sm py-4 transition-colors font-semibold ${(pathname === '/events' || pathname === '/vicinity-events') ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    Fair Stay Events
                    {(pathname === '/events' || pathname === '/vicinity-events') && (
                      <span className="absolute bottom-1 left-0 right-0 h-0.5 bg-[#0e4962] rounded-full" />
                    )}
                  </Link>
                  <a
                    href={process.env.NEXT_PUBLIC_STUDIOI_URL || 'http://localhost:3001'}
                    className="relative text-sm py-4 transition-colors text-gray-500 hover:text-gray-900 font-medium"
                  >
                    Co-Working
                  </a>
                </nav>
              )}

              {/* 3. RIGHT ACTIONS BAR */}
              <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0 relative z-40">

                {/* List Your Space */}
                <Link
                  href="/account/wallet"
                  className="hidden xl:block text-sm font-semibold text-gray-900 py-2 px-4 rounded-full hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap"
                >
                  List Your Space
                </Link>

                {/* Wallet Balance Badge */}
                <Link
                  href="/account/wallet"
                  className={`items-center gap-1.5 py-1.5 px-2 sm:px-3 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 ${searchCollapsed ? 'hidden sm:flex' : 'hidden xl:flex'
                    }`}
                >
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">₹0</span>
                </Link>

                {/* Location Selector (Anywhere pill) */}
                <div className="hidden sm:block relative">
                  <button
                    type="button"
                    onClick={() => setLocationPopoverOpen(!locationPopoverOpen)}
                    className="justify-center whitespace-nowrap text-sm py-2 px-4 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 transition-all font-medium flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#0e4962]" />
                    <span className="hidden sm:inline-block max-w-[140px] truncate">
                      {currentCity || 'Anywhere'}
                    </span>
                  </button>

                  <LocationSelectorPopover
                    isOpen={locationPopoverOpen}
                    onClose={() => setLocationPopoverOpen(false)}
                    onSelectCity={(selectedCity) => {
                      handleSearchSubmit({ city: selectedCity, guests: currentGuests });
                    }}
                    currentCity={currentCity}
                  />
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsPopoverOpen(!notificationsPopoverOpen)}
                    className="rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-xs relative hover:scale-105 transition-transform w-10 h-10 text-gray-700 cursor-pointer"
                    aria-label="Toggle notifications"
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                  </button>

                  <NotificationsPopover
                    isOpen={notificationsPopoverOpen}
                    onClose={() => setNotificationsPopoverOpen(false)}
                  />
                </div>

                {/* User Menu Trigger Button */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    data-menu-trigger="true"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center border border-gray-200 rounded-full hover:shadow-md transition-shadow relative shrink-0 lg:gap-3 lg:pl-3 lg:pr-1.5 lg:py-1.5 p-0.5 bg-white cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 hidden lg:block text-gray-700"
                      viewBox="0 0 32 32"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="m2 16h28" />
                      <path d="m2 24h28" />
                      <path d="m2 8h28" />
                    </svg>
                    <div className="w-8 h-8 lg:w-7 lg:h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-[#0e4962]">
                      {isAuthenticated && user ? (
                        <span className="font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
                      ) : (
                        <svg
                          className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500"
                          viewBox="0 0 32 32"
                          fill="currentColor"
                        >
                          <path d="m16 .7c-8.437 0-15.3 6.863-15.3 15.3s6.863 15.3 15.3 15.3 15.3-6.863 15.3-15.3-6.863-15.3-15.3-15.3zm0 28c-4.021 0-7.605-1.884-9.933-4.81a12.425 12.425 0 0 1 6.451-4.4 6.507 6.507 0 0 1 -3.018-5.49c0-3.584 2.916-6.5 6.5-6.5s6.5 2.916 6.5 6.5a6.513 6.513 0 0 1 -3.019 5.491 12.42 12.42 0 0 1 6.452 4.4c-2.328 2.925-5.912 4.809-9.933 4.809z" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* USER DROPDOWN MENU */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden pointer-events-auto cursor-default">
                      {isAuthenticated && user ? (
                        <>
                          <div className="px-4 py-3 bg-blue-50/60 border-b border-gray-100">
                            <p className="text-body-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                            <p className="text-caption text-gray-500 truncate mt-0.5">{user.email || user.phone}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 text-overline font-semibold rounded-full bg-[#0e4962] text-white uppercase tracking-wider">
                                {isCoHost ? 'Co-Host' : user.role === 'USER' ? 'Guest' : user.role} Mode
                              </span>
                              {user.phoneVerified && (
                                <span className="text-caption text-blue-600 font-medium flex items-center gap-0.5">
                                  <ShieldCheck className="w-3 h-3 inline" /> Verified
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Navigation Dropdown Block */}
                          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 px-1">Navigation</p>
                            <div className="flex flex-col gap-1">
                              <Link
                                href="/"
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${pathname === '/' ? 'bg-[#0e4962] text-white shadow-xs' : 'border border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                                  }`}
                              >
                                <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Stays</span>
                              </Link>
                              <Link
                                href="/events"
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${pathname === '/events' || pathname === '/vicinity-events' ? 'bg-[#0e4962] text-white shadow-xs' : 'border border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                                  }`}
                              >
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fair Stay Events</span>
                              </Link>
                              <a
                                href={process.env.NEXT_PUBLIC_STUDIOI_URL || 'http://localhost:3001'}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium transition-colors"
                              >
                                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#0e4962]" /> Co-working</span>
                              </a>
                            </div>
                          </div>

                          <div className="py-1 border-b border-gray-100">
                            <Link
                              href="/"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                            >
                              <Home className="w-4 h-4 text-[#0e4962]" />
                              <span>Stays Marketplace</span>
                            </Link>
                            {(user.role === 'HOST' || isCoHost) && (
                              <Link
                                href={isCoHost ? '/co-host' : '/host/today'}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0e4962] hover:bg-gray-50 font-semibold"
                              >
                                <ClipboardList className="w-4 h-4 text-[#0e4962]" />
                                <span>{isCoHost ? 'Switch to Co-Host Portal' : 'Switch to Host Dashboard'}</span>
                              </Link>
                            )}
                            {user.role === 'ADMIN' && (
                              <Link
                                href="/admin/dashboard"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0e4962] hover:bg-gray-50 font-semibold"
                              >
                                <ShieldCheck className="w-4 h-4 text-[#0e4962]" />
                                <span>Switch to Admin Console</span>
                              </Link>
                            )}
                          </div>

                          <div className="py-1 border-b border-gray-100">
                            <Link
                              href="/wishlists"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                            >
                              <Heart className="w-4 h-4 text-gray-500" />
                              <span>Wishlists</span>
                            </Link>
                            <Link
                              href="/guest/trips"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                            >
                              <Luggage className="w-4 h-4 text-gray-500" />
                              <span>Trips & Bookings</span>
                            </Link>
                          </div>

                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                logout();
                              }}
                              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Log out</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-1">
                          {/* Navigation Dropdown Block */}
                          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 px-1">Navigation</p>
                            <div className="flex flex-col gap-1">
                              <Link
                                href="/"
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${pathname === '/' ? 'bg-[#0e4962] text-white shadow-xs' : 'border border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                                  }`}
                              >
                                <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Stays</span>
                              </Link>
                              <Link
                                href="/events"
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${pathname === '/events' || pathname === '/vicinity-events' ? 'bg-[#0e4962] text-white shadow-xs' : 'border border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                                  }`}
                              >
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fair Stay Events</span>
                              </Link>
                              <a
                                href={process.env.NEXT_PUBLIC_STUDIOI_URL || 'http://localhost:3001'}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium transition-colors"
                              >
                                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#0e4962]" /> Co-working</span>
                              </a>
                            </div>
                          </div>
                          <Link
                            href="/register"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
                          >
                            Sign up
                          </Link>
                          <Link
                            href="/login"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                          >
                            Log in
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Search — Framer Motion vertical slide spring morph */}
            {isHome && (
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] ${searchCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                  }`}
              >
                <div className="min-h-0 overflow-visible -mb-8">
                  <motion.div
                    className={`relative z-20 flex justify-center w-full pb-2 ${searchCollapsed ? 'px-14 sm:px-24 md:px-32 lg:px-40 pointer-events-none *:pointer-events-auto' : ''
                      }`}
                    initial={false}
                    animate={{ y: searchCollapsed ? searchLiftY : 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 42,
                      mass: 0.88,
                    }}
                  >
                    {searchCollapsed ? (
                      /* COMPACT MORPHED SEARCH PILL */
                      <div
                        role="button"
                        onClick={() => setSearchModalOpen(true)}
                        className="inline-flex items-center gap-2 sm:gap-3 border border-gray-200 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow py-2 px-3 sm:px-5 cursor-pointer text-xs font-semibold text-gray-800 pointer-events-auto"
                      >
                        <span>{currentCity || 'Anywhere'}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500 font-normal">Anytime</span>
                        {/* Add guests only on desktop */}
                        <span className="hidden sm:inline text-gray-300">|</span>
                        <span className="hidden sm:inline text-gray-500 font-normal">
                          {currentGuests > 1 ? `${currentGuests} guests` : 'Add guests'}
                        </span>
                        <div className="bg-[#0e4962] text-white p-1.5 rounded-full ml-1">
                          <Search className="w-3 h-3" />
                        </div>
                      </div>
                    ) : (
                      /* SEARCH CAPSULE: MOBILE (lg:hidden) & DESKTOP (hidden lg:block) */
                      <div className="flex justify-center w-full">

                        {/* MOBILE VIEW PILL */}
                        <div className="lg:hidden">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSearchModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow pl-2 pr-2.5 py-2 cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#0e4962] text-white flex items-center justify-center shrink-0">
                              <Search className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {currentCity || 'Where to?'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchModalOpen(true);
                              }}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-caption font-medium text-gray-900 hover:bg-gray-200 transition-colors"
                            >
                              <Sparkles className="w-3 h-3 text-[#0e4962]" />
                              <span>AI</span>
                            </button>
                          </div>
                        </div>

                        {/* DESKTOP EXPANDED SEARCH CAPSULE */}
                        <div className="hidden lg:block">
                          <div className="inline-flex items-center rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-1.5 max-w-full w-auto">

                            {/* WHERE */}
                            <button
                              type="button"
                              onClick={() => setSearchModalOpen(true)}
                              className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100/70 rounded-[1.75rem] transition-colors min-w-[140px] lg:min-w-[160px] text-left cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-[14px] bg-gray-100/80 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4 text-gray-700" />
                              </div>
                              <div className="text-left flex flex-col justify-center min-w-0">
                                <p className="text-label font-semibold text-gray-900 leading-tight truncate">Where</p>
                                <p className="text-caption text-gray-500 leading-tight mt-0.5 truncate">
                                  {currentCity || 'Any location'}
                                </p>
                              </div>
                            </button>

                            <div className="hidden md:block w-px h-8 bg-gray-200 shrink-0 self-center mx-2" aria-hidden="true" />

                            {/* WHEN */}
                            <button
                              type="button"
                              onClick={() => setSearchModalOpen(true)}
                              className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100/70 rounded-[1.75rem] transition-colors min-w-[140px] lg:min-w-[160px] text-left cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-[14px] bg-gray-100/80 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-gray-700" />
                              </div>
                              <div className="text-left flex flex-col justify-center min-w-0">
                                <p className="text-label font-semibold text-gray-900 leading-tight truncate">When</p>
                                <p className="text-caption text-gray-500 leading-tight mt-0.5 truncate">Anytime</p>
                              </div>
                            </button>

                            <div className="hidden md:block w-px h-8 bg-gray-200 shrink-0 self-center mx-2" aria-hidden="true" />

                            {/* WHO */}
                            <div className="hidden lg:block">
                              <button
                                type="button"
                                onClick={() => setSearchModalOpen(true)}
                                className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100/70 rounded-[1.75rem] transition-colors min-w-[140px] lg:min-w-[160px] text-left cursor-pointer"
                              >
                                <div className="w-10 h-10 rounded-[14px] bg-gray-100/80 flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-gray-700" />
                                </div>
                                <div className="text-left flex flex-col justify-center min-w-0">
                                  <p className="text-label font-semibold text-gray-900 leading-tight truncate">Who</p>
                                  <p className="text-caption text-gray-500 leading-tight mt-0.5 truncate">
                                    {currentGuests > 1 ? `${currentGuests} guests` : 'Add guests'}
                                  </p>
                                </div>
                              </button>
                            </div>

                            <div className="hidden md:block w-px h-8 bg-gray-200 shrink-0 self-center mx-2" aria-hidden="true" />

                            {/* AI & SEARCH BUTTONS */}
                            <div className="flex items-center gap-4 pl-3 pr-1">
                              <button
                                type="button"
                                onClick={() => router.push('/search')}
                                className="bg-[#0e4962] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm hover:shadow-md transition-shadow w-[68px] h-[52px] cursor-pointer"
                                title="Search Stays"
                              >
                                <Search className="w-5 h-5 text-white" />
                              </button>
                            </div>

                          </div>
                        </div>

                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* EXPANDABLE SEARCH MODAL */}
      <SearchExpandedModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={handleSearchSubmit}
        initialCity={currentCity}
        initialGuests={currentGuests}
      />
    </>
  );
}
