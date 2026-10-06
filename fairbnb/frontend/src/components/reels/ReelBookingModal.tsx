'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';

export interface ReelBookingProperty {
  id: string;
  title: string;
  city?: string;
  pricePerNight?: number;
  thumbnailUrl?: string;
}

export interface ReelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: ReelBookingProperty;
  reelId: string;
}

export interface BookingQuoteResult {
  available: boolean;
  reason?: string;
  pricing?: {
    nights: number;
    basePricePerNight: number;
    accommodationTotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    totalAmount: number;
  };
}

export function ReelBookingModal({
  isOpen,
  onClose,
  property,
  reelId,
}: ReelBookingModalProps) {
  // Default dates: tomorrow -> day after tomorrow
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getDayAfterTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  };

  const [checkIn, setCheckIn] = useState<string>(getTomorrow);
  const [checkOut, setCheckOut] = useState<string>(getDayAfterTomorrow);
  const [guests, setGuests] = useState<number>(2);
  const [isCheckingQuote, setIsCheckingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<BookingQuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isProceeding, setIsProceeding] = useState<boolean>(false);
  const requestIdRef = React.useRef<number>(0);

  // Revalidate quote when dates, guests, or property change
  useEffect(() => {
    if (!isOpen || !property?.id) return;

    const currentRequestId = ++requestIdRef.current;
    setQuote(null); // Invalidate any previous quote immediately

    const todayStr = new Date().toISOString().split('T')[0];
    if (!checkIn || checkIn < todayStr) {
      setQuoteError('Check-in date cannot be in the past');
      setIsCheckingQuote(false);
      return;
    }

    if (!checkOut || checkOut <= checkIn) {
      setQuoteError('Check-out date must be after check-in date');
      setIsCheckingQuote(false);
      return;
    }

    if (guests < 1 || guests > 16) {
      setQuoteError('Number of guests must be between 1 and 16');
      setIsCheckingQuote(false);
      return;
    }

    let active = true;
    setIsCheckingQuote(true);
    setQuoteError(null);

    const checkInIso = new Date(`${checkIn}T00:00:00.000Z`).toISOString();
    const checkOutIso = new Date(`${checkOut}T00:00:00.000Z`).toISOString();

    api
      .post<BookingQuoteResult>('/api/bookings/quote', {
        propertyId: property.id,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        guests,
      })
      .then((res) => {
        if (active && currentRequestId === requestIdRef.current) {
          setQuote(res);
        }
      })
      .catch((err: any) => {
        if (active && currentRequestId === requestIdRef.current) {
          setQuoteError(err?.message || 'Unable to verify availability for selected dates');
        }
      })
      .finally(() => {
        if (active && currentRequestId === requestIdRef.current) {
          setIsCheckingQuote(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, property?.id, checkIn, checkOut, guests]);

  if (!isOpen) return null;

  const handleProceedToBooking = () => {
    if (isProceeding || isCheckingQuote || !quote || !quote.available) return;
    setIsProceeding(true);

    // Track attribution analytics event asynchronously; never block navigation
    try {
      api
        .post(`/api/reels/${reelId}/events`, {
          eventType: 'BOOKING_STARTED',
          propertyId: property.id,
          metadata: { checkIn, checkOut, guests },
        })
        .catch(() => {});
    } catch {}

    // Redirect to canonical FairBnB checkout journey preserving full context
    const bookUrl = `/book/${encodeURIComponent(property.id)}?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}&ref_reel_id=${encodeURIComponent(reelId)}&ref_source=reels`;
    window.location.href = bookUrl;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reel-booking-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-gray-900 border border-white/15 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-[#38bdf8] uppercase">
              Book Viewed Stay
            </span>
            <h2 id="reel-booking-title" className="text-base font-bold text-white truncate max-w-[280px]">
              {property.title}
            </h2>
            {property.city && (
              <p className="text-xs text-gray-400">{property.city}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking drawer"
            className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date & Guests Selection */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                Check-in Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                Check-out Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">
              Number of Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                <option key={num} value={num} className="bg-gray-900 text-white">
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Availability & Price Display */}
        <div className="mt-4 p-3.5 bg-black/40 rounded-xl border border-white/10">
          {isCheckingQuote ? (
            <div className="flex items-center gap-2 text-xs text-gray-300 py-2">
              <Sparkles className="w-4 h-4 text-[#38bdf8] animate-spin" />
              Checking availability and rates...
            </div>
          ) : quoteError ? (
            <div className="flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{quoteError}</span>
            </div>
          ) : quote?.available === false ? (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {quote.reason === 'PROPERTY_ALREADY_BOOKED'
                  ? 'These dates are already booked. Please choose different dates.'
                  : 'Property is unavailable for the selected dates.'}
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-300">Indicative Rate:</span>
                <span className="text-base font-bold text-[#67e8f9]">
                  ₹{property.pricePerNight ? property.pricePerNight.toLocaleString('en-IN') : '—'}
                  <span className="text-[11px] text-gray-400 font-normal"> / night</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                *Verified host rate. Final breakdown and instant confirmation guaranteed at checkout.
              </p>
            </div>
          )}
        </div>

        {/* Booking CTA Button */}
        <div className="mt-4">
          <button
            onClick={handleProceedToBooking}
            disabled={!quote || quote?.available === false || isCheckingQuote || Boolean(quoteError)}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs transition-all shadow-lg active:scale-95 ${
              !quote || quote?.available === false || isCheckingQuote || Boolean(quoteError)
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-[#0e4962] hover:bg-[#165a78] text-white border border-[#38bdf8]/30 shadow-[#0e4962]/50'
            }`}
          >
            <span>Proceed to Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
