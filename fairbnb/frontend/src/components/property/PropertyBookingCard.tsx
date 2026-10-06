'use client';

import React, { useState } from 'react';
import { Star, ChevronDown, Flag, Plus, Minus } from 'lucide-react';

interface PropertyBookingCardProps {
  basePrice: number;
  avgRating: number;
  totalReviews: number;
  maxGuests: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenCount: number;
  infants: number;
  pets: number;
  nights: number;
  onAdultsChange: React.Dispatch<React.SetStateAction<number>>;
  onChildrenChange: React.Dispatch<React.SetStateAction<number>>;
  onInfantsChange: React.Dispatch<React.SetStateAction<number>>;
  onPetsChange: React.Dispatch<React.SetStateAction<number>>;
  onScrollToAvailability: () => void;
  onReserve: () => void;
}

export function PropertyBookingCard({
  basePrice,
  avgRating,
  totalReviews,
  maxGuests,
  checkIn,
  checkOut,
  adults,
  childrenCount,
  infants,
  pets,
  nights,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  onPetsChange,
  onScrollToAvailability,
  onReserve,
}: PropertyBookingCardProps) {
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const totalGuests = adults + childrenCount;

  function getGuestSummary() {
    const parts = [];
    if (adults + childrenCount > 0) parts.push(`${adults + childrenCount} guest${adults + childrenCount !== 1 ? 's' : ''}`);
    if (infants > 0) parts.push(`${infants} infant${infants !== 1 ? 's' : ''}`);
    if (pets > 0) parts.push(`${pets} pet${pets !== 1 ? 's' : ''}`);
    return parts.join(', ') || '0 guest';
  }

  return (
    <div className="w-full lg:w-[370px] xl:w-[380px] flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-5">

        {/* Card 1: Main Booking Card */}
        <div className="border border-gray-200 rounded-2xl shadow-lg p-6 bg-white">
          {/* Top Row: Price + Reviews */}
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                ₹{basePrice.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-gray-500 font-normal"> night</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
              <span className="font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '0'}</span>
              <span>·</span>
              <span className="underline">{totalReviews} reviews</span>
            </div>
          </div>

          {/* Date & Guest Input Box */}
          <div className="border border-gray-300/80 rounded-xl overflow-hidden mb-4">
            {/* Two-column Dates row */}
            <div className="grid grid-cols-2 divide-x divide-gray-300/80">
              <button
                type="button"
                onClick={onScrollToAvailability}
                className="p-3 text-left hover:bg-gray-50 transition"
              >
                <p className="text-overline font-semibold text-gray-900 uppercase tracking-wider">CHECK-IN</p>
                <p className="text-body-sm text-gray-700 font-normal mt-0.5 font-tabular">
                  {checkIn
                    ? new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Add date'}
                </p>
              </button>
              <button
                type="button"
                onClick={onScrollToAvailability}
                className="p-3 text-left hover:bg-gray-50 transition"
              >
                <p className="text-overline font-semibold text-gray-900 uppercase tracking-wider">CHECKOUT</p>
                <p className="text-body-sm text-gray-700 font-normal mt-0.5 font-tabular">
                  {checkOut
                    ? new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Add date'}
                </p>
              </button>
            </div>

            {/* Guests row */}
            <div className="border-t border-gray-300/80 p-3 relative">
              <p className="text-overline font-semibold text-gray-900 uppercase tracking-wider">GUESTS</p>
              <button
                type="button"
                onClick={() => setGuestDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between text-body-sm text-gray-800 mt-0.5"
              >
                <span className="font-normal">{getGuestSummary()}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${guestDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Guest Stepper Dropdown */}
              {guestDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setGuestDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl p-4 shadow-xl z-30 space-y-4">
                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-900">Adults</p>
                        <p className="text-caption text-gray-500 font-normal">Age 13+</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onAdultsChange(a => Math.max(1, a - 1))}
                          disabled={adults <= 1}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-body-sm font-tabular">{adults}</span>
                        <button
                          type="button"
                          onClick={() => onAdultsChange(a => a + 1)}
                          disabled={totalGuests >= maxGuests}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-900">Children</p>
                        <p className="text-caption text-gray-500 font-normal">Ages 2–12</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onChildrenChange(c => Math.max(0, c - 1))}
                          disabled={childrenCount <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-body-sm font-tabular">{childrenCount}</span>
                        <button
                          type="button"
                          onClick={() => onChildrenChange(c => c + 1)}
                          disabled={totalGuests >= maxGuests}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-900">Infants</p>
                        <p className="text-caption text-gray-500 font-normal">Under 2</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onInfantsChange(i => Math.max(0, i - 1))}
                          disabled={infants <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-body-sm font-tabular">{infants}</span>
                        <button
                          type="button"
                          onClick={() => onInfantsChange(i => i + 1)}
                          disabled={infants >= 5}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Pets */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-gray-900">Pets</p>
                        <p className="text-caption text-gray-500 font-normal">Service animals</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onPetsChange(p => Math.max(0, p - 1))}
                          disabled={pets <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-body-sm font-tabular">{pets}</span>
                        <button
                          type="button"
                          onClick={() => onPetsChange(p => p + 1)}
                          disabled={pets >= 3}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-500 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setGuestDropdownOpen(false)}
                        className="text-xs font-bold text-gray-900 underline hover:text-black py-1 px-2"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reserve CTA Button */}
          <button
            type="button"
            onClick={onReserve}
            className="w-full py-3.5 bg-[#0f4c5c] hover:bg-[#0a3844] active:bg-[#06242c] text-white font-medium text-button rounded-xl transition shadow-xs"
          >
            {checkIn && checkOut ? 'Reserve' : 'Check availability'}
          </button>

          {/* Sub-caption */}
          <p className="text-center text-caption text-gray-500 mt-3 font-normal">
            Request only — payment is handled offline
          </p>

          {/* Dynamic Price Calculation */}
          {checkIn && checkOut && nights > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-200 space-y-2.5 text-body-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="underline">
                  ₹{basePrice.toLocaleString('en-IN')} × {nights} nights
                </span>
                <span className="font-tabular">₹{(basePrice * nights).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="underline">Fair Stay service fee</span>
                <span className="font-tabular">₹0</span>
              </div>
              <div className="flex items-center justify-between font-bold text-gray-900 text-body pt-3 border-t border-gray-200">
                <span>Total</span>
                <span className="font-tabular">₹{(basePrice * nights).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Flexible Cancellation info card */}
        <div className="border border-gray-200 rounded-2xl p-4 bg-white flex items-start gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-gray-100/80 border border-gray-200 flex flex-col items-center justify-center flex-shrink-0 text-gray-800">
            <span className="text-overline font-semibold uppercase leading-none text-gray-500">SEP</span>
            <span className="text-caption font-bold leading-tight font-tabular">17</span>
          </div>
          <div>
            <h4 className="text-body-sm font-semibold text-gray-900">Flexible Cancellation</h4>
            <p className="text-caption text-gray-500 mt-0.5 leading-relaxed font-normal">
              Full refund 1 day prior to arrival.
            </p>
          </div>
        </div>

        {/* Report Listing link */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => alert('Thank you. Our team will review this listing.')}
            className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1.5"
          >
            <Flag className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
            <span className="underline">Report this listing</span>
          </button>
        </div>

      </div>
    </div>
  );
}
