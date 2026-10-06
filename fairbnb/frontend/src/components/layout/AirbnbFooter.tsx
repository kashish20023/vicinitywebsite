'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/constants';

export function AirbnbFooter() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 mt-10 max-sm:mt-4 text-neutral-700 text-sm">
      <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 relative">
        {/* TOP SECTION: 3 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-12 sm:pb-16">
          {/* COL 1: STAYS BRAND & CONSULTANCY INFO */}
          <div className="md:col-span-6 lg:col-span-6 space-y-4 max-w-xl">
            <h2 className="text-display font-bold text-[#0e4962] tracking-tight">
              Stays
            </h2>

            <p className="text-body-sm text-neutral-600 leading-relaxed">
              {BRAND_NAME} is committed to delivering a high level of expertise, customer service, and attention to detail to the market of accommodation booking.
            </p>

            <p className="text-body-sm text-neutral-600 leading-relaxed">
              We are a full-service property consultancy offering tailored solutions for property owners. Our expertise spans strategic development, architectural and interior design, and comprehensive property management.
            </p>

            <p className="text-body-sm font-semibold text-neutral-900 pt-1">
              Simply the best rental solution for your home.
            </p>
          </div>

          {/* COL 2: EXPLORE */}
          <div className="md:col-span-3 lg:col-span-3 space-y-4 md:pl-6 lg:pl-12">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">
              Explore
            </h3>
            <ul className="space-y-3 text-xs sm:text-[13.5px] text-neutral-600">
              <li>
                <Link href="/about" className="hover:text-[#0e4962] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#0e4962] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#0e4962] transition-colors">
                  {BRAND_NAME} Events
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 3: LEGAL */}
          <div className="md:col-span-3 lg:col-span-3 space-y-4 md:pl-6">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">
              Legal
            </h3>
            <ul className="space-y-3 text-xs sm:text-[13.5px] text-neutral-600">
              <li>
                <Link href="/terms-and-conditions" className="hover:text-[#0e4962] transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#0e4962] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="hover:text-[#0e4962] transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION: COPYRIGHT & SOCIAL ICONS */}
        <div className="pt-8 border-t border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="space-y-1">
            <p>© 2026 {BRAND_NAME}. All rights reserved.</p>
            <p className="flex items-center gap-1 text-caption text-neutral-400">
              <span>Design, Developed and Managed by IDEA India</span>
              <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-2 inline ml-0.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </p>
          </div>

          {/* Social Icons (Facebook, Twitter/X, Instagram) */}
          <div className="flex items-center gap-4 text-neutral-600">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-neutral-900 transition-colors"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            {/* Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-neutral-900 transition-colors"
              aria-label="Twitter"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-neutral-900 transition-colors"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
