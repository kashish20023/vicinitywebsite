'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { LogOut, Building2, ShieldCheck, Home, Compass, Users, Briefcase, Calendar } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isCoHost, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-[#0e4962] flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">
              fair<span className="text-[#0e4962]">bnb</span>
            </span>
          </Link>

          {/* Product Navigation */}
          <nav
            aria-label="Product Navigation"
            className="hidden sm:flex items-center bg-gray-100/90 p-1 rounded-full border border-gray-200/80 relative shadow-2xs"
          >
            <Link
              href="/"
              className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors duration-200"
              title="Current product: Stays (Fair)"
            >
              <div className="absolute inset-0 bg-[#0e4962] rounded-full shadow-xs" />
              <Home className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Stays</span>
            </Link>

            <Link
              href="/events"
              className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200"
              title="Fair Stay Events"
            >
              <Calendar className="w-3.5 h-3.5 relative z-10 text-gray-500" />
              <span className="relative z-10 whitespace-nowrap">Fair Stay Events</span>
            </Link>

            <a
              href={process.env.NEXT_PUBLIC_STUDIOI_URL || 'http://localhost:3001'}
              className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200"
              title="Switch to Studio I Co-working"
            >
              <Briefcase className="w-3.5 h-3.5 relative z-10 text-gray-500" />
              <span className="relative z-10">Co-working</span>
            </a>
          </nav>

          <nav className="hidden md:flex items-center gap-6 text-nav font-medium text-gray-600">
            <Link href="/" className="hover:text-[#0e4962] transition flex items-center gap-1.5">
              <Home className="w-4 h-4" /> Explore Stays
            </Link>
            {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
              <>
                <Link href="/host/today" className="hover:text-[#0e4962] transition flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Host Dashboard
                </Link>
                <Link href="/co-host" className="hover:text-[#0e4962] transition flex items-center gap-1.5 text-[#0e4962] font-semibold">
                  <Users className="w-4 h-4" /> Co-Host Portal
                </Link>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <Link href="/admin/dashboard" className="hover:text-[#0e4962] transition flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Admin Console
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-body-sm font-semibold text-gray-900 leading-none">{user.name}</p>
                <span className="text-overline text-[#0e4962] bg-[#0e4962]/10 px-2.5 py-0.5 rounded-full inline-block mt-1">
                  {isCoHost ? 'Co-Host' : user.role === 'USER' ? 'Guest' : user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-body-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-button text-white bg-[#0e4962] hover:bg-[#093447] px-5 py-2.5 rounded-2xl shadow-sm hover:shadow transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>

  );
}
