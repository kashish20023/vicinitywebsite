'use client';

import React from 'react';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <AirbnbHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20">
        <div className="space-y-4 mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Cancellation Policies
          </h1>
          <p className="text-gray-600 text-lg font-light">
            Detailed refund rules and cancellation timelines for our properties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Flexible */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <h2 className="text-2xl font-bold text-gray-900">Flexible</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6 font-light">
              Best for guests who want maximum flexibility with their travel plans.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-emerald-700 min-w-[4rem]">
                  100%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled at least <strong>1 day</strong> before check-in.
                </span>
              </li>
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-red-600 min-w-[4rem]">
                  0%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled within <strong>24 hours</strong> of check-in.
                </span>
              </li>
            </ul>
          </div>

          {/* Moderate */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <h2 className="text-2xl font-bold text-gray-900">Moderate</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6 font-light">
              A balanced option for standard bookings.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-emerald-700 min-w-[4rem]">
                  100%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled at least <strong>5 days</strong> before check-in.
                </span>
              </li>
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-amber-600 min-w-[4rem]">
                  50%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled within <strong>5 days</strong> of check-in.
                </span>
              </li>
            </ul>
          </div>

          {/* Limited */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <h2 className="text-2xl font-bold text-gray-900">Limited</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6 font-light">
              Good for planned trips with definitive dates.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-emerald-700 min-w-[4rem]">
                  100%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled at least <strong>14 days</strong> before check-in.
                </span>
              </li>
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-amber-600 min-w-[4rem]">
                  50%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled between <strong>7 and 14 days</strong> before check-in.
                </span>
              </li>
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-red-600 min-w-[4rem]">
                  0%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled less than <strong>7 days</strong> before check-in.
                </span>
              </li>
            </ul>
          </div>

          {/* Firm */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <h2 className="text-2xl font-bold text-gray-900">Firm</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6 font-light">
              Stricter policy for high-demand or long-term stays.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-emerald-700 min-w-[4rem]">
                  100%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled at least <strong>30 days</strong> before check-in.
                </span>
              </li>
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-amber-600 min-w-[4rem]">
                  50%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled between <strong>7 and 30 days</strong> before check-in.
                </span>
              </li>
              <li className="flex gap-4 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-red-600 min-w-[4rem]">
                  0%
                </span>
                <span className="text-xs sm:text-sm text-gray-700">
                  Refund if cancelled less than <strong>7 days</strong> before check-in.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-900">
            Additional Information
          </h3>
          <ul className="list-disc list-inside space-y-3 text-gray-600 text-sm font-light leading-relaxed">
            <li>Cleaning fees are fully refunded if you cancel before check-in.</li>
            <li>Service fees are non-refundable unless stated otherwise.</li>
            <li>
              For non-refundable bookings or cancellations made outside the refund window, taxes may still be refundable depending on local laws.
            </li>
            <li>
              In case of extenuating circumstances (e.g. natural disasters), please contact support for review.
            </li>
          </ul>
        </div>
      </main>
      <AirbnbFooter />
    </div>
  );
}
