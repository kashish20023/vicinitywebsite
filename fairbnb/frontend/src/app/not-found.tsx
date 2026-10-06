import React from 'react';
import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-neutral-100 text-[#0e4962] rounded-3xl mx-auto flex items-center justify-center shadow-inner">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <p className="text-overline font-bold tracking-widest text-[#0e4962] uppercase">
            404 Error
          </p>
          <h1 className="text-h1 font-bold text-neutral-900">Page not found</h1>
          <p className="text-body text-neutral-600">
            We can&apos;t seem to find the page you&apos;re looking for. It might have been moved or removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0e4962] hover:bg-[#1a6585] text-white rounded-xl font-medium text-button transition shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/search"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl font-medium text-button transition shadow-xs cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search Stays</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
