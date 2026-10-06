'use client';

import React from 'react';
import Link from 'next/link';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import { Wallet } from 'lucide-react';

export default function WalletPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      {/* 1. AIRBNB HEADER */}
      <AirbnbHeader />

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-medium mb-6">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Account
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-semibold text-gray-900">Wallet</span>
        </nav>

        {/* PAGE HEADING */}
        <div className="mb-8">
          <h1 className="text-h1 font-bold text-gray-900 tracking-tight">
            My Wallet
          </h1>
          <p className="text-body text-gray-600 mt-2 max-w-2xl leading-relaxed">
            Cashback, signup bonuses, and refund credits appear here. Use your balance at checkout when paying for stays.
          </p>
        </div>

        {/* TWO-COLUMN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: AVAILABLE BALANCE CARD */}
          <div className="lg:col-span-4 bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
            {/* WALLET ICON IN CIRCLE */}
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0e4962]">
              <Wallet className="w-6 h-6 stroke-[2]" />
            </div>

            <div>
              <span className="text-overline font-semibold text-gray-400 uppercase tracking-wider block">
                AVAILABLE BALANCE
              </span>
              <div className="text-display font-bold font-tabular text-gray-900 mt-1">
                ₹0
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Credits come from promotions, booking cashback, and wallet refunds. Use them at checkout on your next stay.
              </p>

              {/* RULES INFO CONTAINER */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs text-gray-700 space-y-2.5 font-medium leading-normal">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 font-bold">•</span>
                  <span>Up to 50% of your wallet balance per booking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 font-bold">•</span>
                  <span>At least ₹500 must be paid online per booking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 font-bold">•</span>
                  <span>New credits expire after 90 days — book soon!</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TRANSACTION HISTORY CARD */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Transaction History
            </h2>

            <div className="bg-white border border-gray-200/90 rounded-3xl p-10 sm:p-16 text-center shadow-2xs flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                <Wallet className="w-8 h-8 stroke-[1.75]" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                No transactions yet
              </h3>

              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1.5 max-w-sm leading-relaxed">
                When you receive refunds, cashback, or promotional credits, they will appear here.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* 3. AIRBNB FOOTER */}
      <AirbnbFooter />
    </div>
  );
}
