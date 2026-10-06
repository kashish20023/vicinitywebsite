"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, User, ShieldCheck, LogOut, Ticket, Home, Briefcase } from "lucide-react";
import AuthModal from "./AuthModal";
import { getStoredUser, clearStoredSession } from "@/lib/api";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleSignOut = () => {
    clearStoredSession();
    setCurrentUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/explore" },
    { name: "Stays", href: process.env.NEXT_PUBLIC_FAIR_URL || "http://localhost:3000", isExternal: true },
    { name: "Experience", href: "/#experience" },
    { name: "Locations", href: "/#locations" },
  ];

  return (
    <>
      <header className="sticky top-4 z-50 px-3 sm:px-6 w-full max-w-[1180px] mx-auto">
        <nav className="bg-black text-white rounded-full px-6 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between shadow-2xl backdrop-blur-md border border-neutral-800 transition-all duration-300">
          {/* Logo & Product Switcher */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-1 group shrink-0">
              <div className="relative h-7 w-28 sm:h-8 sm:w-32 flex items-center">
                <Image
                  src="/assets/logo-studioi.png"
                  alt="Studio i"
                  width={128}
                  height={32}
                  priority
                  className="object-contain w-auto h-auto"
                />
              </div>
            </Link>

            {/* Desktop Dual-Product Switcher */}
            <nav
              aria-label="Product Switcher"
              className="hidden lg:flex items-center bg-neutral-900/90 p-1 rounded-full border border-neutral-800 relative shadow-inner"
            >
              <a
                href={process.env.NEXT_PUBLIC_FAIR_URL || "http://localhost:3000"}
                className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-neutral-400 hover:text-white transition-colors duration-200"
                title="Switch to Fair Stays"
              >
                <Home className="w-3.5 h-3.5 text-neutral-400" />
                <span>Stays</span>
                <span className="text-[10px] font-normal text-neutral-500">Fair</span>
              </a>

              <Link
                href="/"
                className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors duration-200"
                title="Current product: Co-working (Studio I)"
              >
                <div className="absolute inset-0 bg-[#0e4962] rounded-full shadow-xs" />
                <Briefcase className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Co-working</span>
                <span className="text-[10px] font-normal relative z-10 text-white/80">Studio I</span>
              </Link>
            </nav>

            {/* Mobile Direct Return Button */}
            <a
              href={process.env.NEXT_PUBLIC_FAIR_URL || "http://localhost:3000"}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-[11px] font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-2xs"
              title="Switch to Fair Stays"
            >
              <Home className="w-3 h-3 text-[#0e4962]" />
              <span>Stays</span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7 lg:gap-9 text-[14px] sm:text-[15px] font-medium tracking-tight">
            {navLinks.map((link) => (
              link.isExternal ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-neutral-200 hover:text-white transition-colors duration-200 relative group py-1"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0e4962] transition-all duration-300 group-hover:w-full" />
                </a>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-neutral-200 hover:text-white transition-colors duration-200 relative group py-1"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0e4962] transition-all duration-300 group-hover:w-full" />
                </Link>
              )
            ))}
          </div>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser?.role === "HOST" && (
              <Link
                href="/host"
                className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-[#0e4962]/40 text-[#0e4962] text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0e4962]" />
                Host Platform
              </Link>
            )}

            {(currentUser?.role === "COHOST" || (currentUser?.cohostPermissions && currentUser.cohostPermissions.length > 0)) && (
              <Link
                href="/co-host"
                className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Co-Host Portal
              </Link>
            )}

            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Admin Portal
              </Link>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href={
                    currentUser.role === "HOST" ? "/host" :
                      currentUser.role === "COHOST" ? "/co-host" :
                        currentUser.role === "ADMIN" ? "/admin" : "/my-bookings"
                  }
                  className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Ticket className="w-3.5 h-3.5 text-[#0e4962]" />
                  {currentUser.role === "HOST" ? "Host Workspace" :
                    currentUser.role === "COHOST" ? "Co-Host Workspace" :
                      currentUser.role === "ADMIN" ? "Admin Console" : "My Bookings"}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2 rounded-full bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Hamburger Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {!currentUser && (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#0e4962] text-white text-xs font-bold"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-white transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </nav>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-black/95 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Mobile Switch Experience */}
            <div className="px-3 py-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">Switch Product</span>
              <div className="flex items-center gap-2">
                <a
                  href={process.env.NEXT_PUBLIC_FAIR_URL || "http://localhost:3000"}
                  className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl border border-neutral-800 bg-black/60 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors"
                >
                  <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-[#0e4962]" /> Stays</span>
                  <span className="text-[10px] text-neutral-500">Fair</span>
                </a>
                <span className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0e4962] text-white text-xs font-semibold shadow-xs">
                  <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Co-working</span>
                  <span className="text-[10px] opacity-80">Studio I</span>
                </span>
              </div>
            </div>
            {navLinks.map((link) => (
              link.isExternal ? (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium py-2 px-3 rounded-lg hover:bg-neutral-900 hover:text-[#0e4962] transition-colors"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium py-2 px-3 rounded-lg hover:bg-neutral-900 hover:text-[#0e4962] transition-colors"
                >
                  {link.name}
                </Link>
              )
            ))}

            {currentUser && (
              <>
                <div className="border-t border-neutral-800 pt-2 flex flex-col gap-2">
                  <Link
                    href={
                      currentUser.role === "HOST" ? "/host" :
                        currentUser.role === "COHOST" ? "/co-host" :
                          currentUser.role === "ADMIN" ? "/admin" : "/my-bookings"
                    }
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-neutral-900 text-sm font-semibold"
                  >
                    <Ticket className="w-4 h-4 text-[#0e4962]" />
                    {currentUser.role === "HOST" ? "Host Dashboard" :
                      currentUser.role === "COHOST" ? "Co-Host Dashboard" :
                        currentUser.role === "ADMIN" ? "Admin Portal" : "My Bookings"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-red-400 hover:bg-neutral-900 text-sm font-semibold text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out ({currentUser.name})
                  </button>
                </div>
              </>
            )}

            {!currentUser && (
              <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full text-center py-2.5 rounded-full bg-[#0e4962] text-white font-semibold text-sm hover:bg-[#093447] transition-colors"
                >
                  Sign In / Create Account
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </>
  );
}
