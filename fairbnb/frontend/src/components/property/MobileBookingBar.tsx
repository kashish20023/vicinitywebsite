'use client';

import React from 'react';

interface MobileBookingBarProps {
  basePrice: number;
  checkIn: string;
  checkOut: string;
  onReserve: () => void;
}

export function MobileBookingBar({
  basePrice,
  checkIn,
  checkOut,
  onReserve,
}: MobileBookingBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg">
      <div>
        <span className="text-body-lg font-bold font-tabular text-gray-900">
          ₹{basePrice.toLocaleString('en-IN')}
        </span>
        <span className="text-caption text-gray-500"> / night</span>
        <p className="text-caption text-gray-600 underline font-tabular">
          {checkIn && checkOut ? `${checkIn} – ${checkOut}` : 'Select dates'}
        </p>
      </div>

      <button
        type="button"
        onClick={onReserve}
        className="bg-[#0f4c5c] hover:bg-[#0a3844] text-white text-button px-6 py-3 rounded-xl transition"
      >
        {checkIn && checkOut ? 'Reserve' : 'Check availability'}
      </button>
    </div>
  );
}
