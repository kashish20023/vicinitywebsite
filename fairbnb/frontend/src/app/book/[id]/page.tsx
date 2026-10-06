'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  ChevronLeft,
  Star,
  CreditCard,
  QrCode,
  Building,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface PropertySummary {
  id: string;
  title: string;
  propertyType: string;
  category: string;
  city: string;
  state: string;
  basePrice: number;
  maxGuests: number;
  minNights: number;
  instantBook: boolean;
  images: string[];
  coverImage?: string;
  cancellationPolicy?: string;
  listingExtras?: { cleaningFee?: number };
  host?: { id: string; name: string; email?: string };
}

interface BookingPricing {
  nights: number;
  basePricePerNight: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

interface BookingQuote {
  available: boolean;
  reason?: string;
  pricing?: BookingPricing;
  couponError?: string;
}

function AirbnbCheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<PropertySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live Pricing Quote State
  const [quote, setQuote] = useState<BookingQuote | null>(null);

  // Booking Query / Form State
  const [checkIn, setCheckIn] = useState<string>(() => {
    return searchParams.get('checkin') || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    return searchParams.get('checkout') || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState<number>(() => {
    return Number(searchParams.get('guests')) || 1;
  });
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NETBANKING'>('CARD');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Simulated Card Info
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('742');

  // Load property details
  useEffect(() => {
    async function loadProperty() {
      if (!propertyId) return;
      setLoading(true);
      try {
        const data = await api.get<PropertySummary>(`/properties/${propertyId}`);
        setProperty(data);
      } catch (err: any) {
        setError(err.message || 'Listing not found');
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [propertyId]);

  const mapAvailabilityReason = (reason?: string) => {
    switch (reason) {
      case 'PROPERTY_ALREADY_BOOKED':
        return 'This property is already booked for the selected dates. Please choose different dates.';
      case 'HOST_BLOCKED_DATES':
        return 'The host has blocked bookings for the selected dates. Please select other dates.';
      case 'CHECKIN_DATE_IN_PAST':
        return 'Check-in date cannot be in the past.';
      case 'CHECKOUT_MUST_BE_AFTER_CHECKIN':
        return 'Checkout date must be after check-in date.';
      default:
        return reason || 'The selected dates are unavailable for booking.';
    }
  };

  // Fetch real-time live pricing quote from backend
  useEffect(() => {
    async function fetchQuote() {
      if (!propertyId || !checkIn || !checkOut) return;
      if (new Date(checkOut) <= new Date(checkIn)) return;

      try {
        const quoteRes = await api.post<BookingQuote>('/bookings/quote', {
          propertyId,
          checkIn,
          checkOut,
          guests,
          couponCode: appliedCoupon || undefined,
        });
        setQuote(quoteRes);
        setCouponError(quoteRes.couponError || null);
        if (!quoteRes.available) {
          setError(mapAvailabilityReason(quoteRes.reason));
        } else {
          setError(null);
        }
      } catch (err: any) {
        console.error('Quote error:', err);
        setError(err.message || 'Failed to load pricing');
      }
    }
    fetchQuote();
  }, [propertyId, checkIn, checkOut, guests, appliedCoupon]);

  const calculateNights = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const nights = quote?.pricing?.nights || calculateNights(checkIn, checkOut);
  const basePrice = quote?.pricing?.basePricePerNight || property?.basePrice || 17117.66;
  const baseTotal = quote?.pricing?.baseAmount || (basePrice * nights);
  const taxAmount = quote?.pricing?.taxAmount || 9000;
  const grandTotal = quote?.pricing?.totalAmount || (baseTotal + taxAmount);

  // Format cancellation date
  const formatCancellationDate = () => {
    try {
      const d = new Date(checkIn);
      d.setDate(d.getDate() - 5);
      return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'long' })}`;
    } catch {
      return '18 October';
    }
  };

  // Format date range (e.g. 23–25 Oct 2026)
  const formatDateRange = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const month = d1.toLocaleString('en-US', { month: 'short' });
      const year = d1.getFullYear();
      return `${d1.getDate()}–${d2.getDate()} ${month} ${year}`;
    } catch {
      return '23–25 Oct 2026';
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (quote && !quote.available) {
      setError(mapAvailabilityReason(quote.reason));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const bookingPayload = {
        propertyId: property!.id,
        checkIn: new Date(checkIn).toISOString().split('T')[0],
        checkOut: new Date(checkOut).toISOString().split('T')[0],
        guests,
        ...(appliedCoupon && !couponError ? { couponCode: appliedCoupon } : {}),
      };

      const bookingRes = await api.post<any>('/bookings', bookingPayload);

      if (bookingRes?.payment?.providerOrderId) {
        try {
          await api.post('/payments/webhook', {
            event: 'payment.captured',
            payload: {
              providerOrderId: bookingRes.payment.providerOrderId,
              providerPaymentId: bookingRes.payment.providerPaymentId,
              amount: bookingRes.payment.amount,
              status: 'PAID',
            },
            signature: 'valid_mock_sig',
          });
        } catch (payErr) {
          console.warn('Payment webhook sync notice:', payErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/guest/trips');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-3" />
        <p className="text-sm font-semibold text-neutral-700">Securing reservation details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-neutral-900">Listing Not Available</h2>
        <p className="text-sm text-neutral-500 mt-1 mb-4">{error || 'This listing could not be found.'}</p>
        <Link href="/" className="px-5 py-2.5 bg-neutral-900 text-white font-bold rounded-xl text-sm">
          Return to Explore Stays
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* 1. AIRBNB CLEAN LOGO HEADER */}
      <header className="border-b border-neutral-100 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight text-[#0e4962]">
              fairbnb
            </span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN CHECKOUT CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full flex-1">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => router.push(`/properties/${property.id}`)}
            className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center transition"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-900" />
          </button>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight">
            Confirm and pay
          </h1>
        </div>

        {success ? (
          <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-12 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-900">Reservation Confirmed!</h2>
            <p className="text-sm text-emerald-800">
              Your stay at <strong>{property.title}</strong> is locked in. Redirecting to your Trips itinerary...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* LEFT COLUMN: 3 STEP CARDS */}
            <div className="lg:col-span-7 space-y-5">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: LOG IN OR SIGN UP */}
              <div className="rounded-2xl border border-neutral-300 p-6 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    1. Log in or sign up
                  </h2>
                  {isAuthenticated && user && (
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                      Logged in as <span className="font-semibold text-neutral-900">{user.name}</span> ({user.email || user.phone})
                    </p>
                  )}
                </div>

                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(
                        `/login?redirect=${encodeURIComponent(
                          typeof window !== 'undefined'
                            ? window.location.pathname + window.location.search
                            : '',
                        )}`,
                      );
                    }}
                    className="px-6 py-2.5 bg-[#0e4962] hover:bg-[#093447] active:bg-[#062432] text-white font-semibold text-sm rounded-xl transition shadow-sm self-start sm:self-auto"
                  >
                    Continue
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                )}
              </div>

              {/* STEP 2: ADD A PAYMENT METHOD */}
              <div
                className={`rounded-2xl border p-6 bg-white shadow-sm transition ${
                  !isAuthenticated
                    ? 'border-neutral-200 text-neutral-400 opacity-90'
                    : 'border-neutral-300 text-neutral-900'
                }`}
              >
                <h2 className="text-base sm:text-lg font-bold">2. Add a payment method</h2>
                {isAuthenticated && (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-medium ${
                          paymentMethod === 'CARD'
                            ? 'border-neutral-900 bg-neutral-50 text-neutral-900 font-bold'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-medium ${
                          paymentMethod === 'UPI'
                            ? 'border-neutral-900 bg-neutral-50 text-neutral-900 font-bold'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>UPI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('NETBANKING')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-medium ${
                          paymentMethod === 'NETBANKING'
                            ? 'border-neutral-900 bg-neutral-50 text-neutral-900 font-bold'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span>Netbanking</span>
                      </button>
                    </div>

                    {paymentMethod === 'CARD' && (
                      <div className="p-4 border border-neutral-200 rounded-xl space-y-3 bg-neutral-50/50">
                        <div>
                          <label className="text-overline font-semibold uppercase text-neutral-500 block mb-1">
                            Card Number
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-lg text-caption font-medium font-tabular text-neutral-900 outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-overline font-semibold uppercase text-neutral-500 block mb-1">
                              Expiration
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-lg text-caption font-medium font-tabular text-neutral-900 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-overline font-semibold uppercase text-neutral-500 block mb-1">
                              CVV
                            </label>
                            <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-lg text-caption font-medium font-tabular text-neutral-900 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 3: PROCEED TO PAYMENT */}
              <div
                className={`rounded-2xl border p-6 bg-white shadow-sm transition ${
                  !isAuthenticated
                    ? 'border-neutral-200 text-neutral-400 opacity-90'
                    : 'border-neutral-300 text-neutral-900'
                }`}
              >
                <h2 className="text-base sm:text-lg font-bold">3. Proceed to payment</h2>
                {isAuthenticated && (
                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={handleBookingSubmit}
                      disabled={submitting || (quote !== null && !quote.available)}
                      className={`w-full py-3.5 font-semibold text-base rounded-xl transition shadow-md flex items-center justify-center gap-2 ${
                        quote !== null && !quote.available
                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                          : 'bg-[#0e4962] hover:bg-[#093447] active:bg-[#062432] text-white'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing Payment & Reservation...</span>
                        </>
                      ) : quote !== null && !quote.available ? (
                        <span>Dates Unavailable</span>
                      ) : (
                        <span>Confirm and Pay ₹{grandTotal.toLocaleString('en-IN')}</span>
                      )}
                    </button>
                    <p className="text-center text-xs text-neutral-500">
                      By selecting the button above, you agree to FairBnB&apos;s Terms and Cancellation Policy.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY LISTING & PRICE SUMMARY CARD */}
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-neutral-300 shadow-sm space-y-5">
                {/* PROPERTY CARD THUMBNAIL */}
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 relative">
                    <img
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-2 leading-snug">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-900 pt-0.5">
                      <span className="flex items-center gap-0.5 font-medium">
                        <Star className="w-3.5 h-3.5 fill-black text-black" /> 4.94
                      </span>
                      <span>(17)</span>
                      <span>·</span>
                      <span className="text-neutral-700 font-medium">Guest favourite</span>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-200" />

                {/* FREE CANCELLATION */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-900">Free cancellation</p>
                  <p className="text-xs text-neutral-600">
                    Cancel before {formatCancellationDate()} for a full refund.
                  </p>
                  <button
                    type="button"
                    onClick={() => alert('Full cancellation policy: Free cancellation before check-in.')}
                    className="underline text-xs font-semibold text-neutral-900 block mt-0.5"
                  >
                    Full policy
                  </button>
                </div>

                <hr className="border-neutral-200" />

                {/* DATES */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">Dates</span>
                    <button
                      type="button"
                      onClick={() => router.push(`/properties/${property.id}`)}
                      className="text-xs font-medium bg-neutral-100 hover:bg-neutral-200 px-3 py-1 rounded-lg text-neutral-800 transition"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-sm text-neutral-700">{formatDateRange()}</p>
                </div>

                {/* GUESTS */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">Guests</span>
                    <button
                      type="button"
                      onClick={() => router.push(`/properties/${property.id}`)}
                      className="text-xs font-medium bg-neutral-100 hover:bg-neutral-200 px-3 py-1 rounded-lg text-neutral-800 transition"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-sm text-neutral-700">{guests} {guests === 1 ? 'adult' : 'adults'}</p>
                </div>

                <hr className="border-neutral-200" />

                {/* COUPON INPUT */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      disabled={!!appliedCoupon}
                      className="flex-1 px-3.5 py-2 border border-neutral-300 rounded-lg text-sm uppercase disabled:bg-neutral-50 disabled:text-neutral-500"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponInput('');
                          setCouponError(null);
                        }}
                        className="px-4 py-2 text-sm font-semibold text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (couponInput.trim()) setAppliedCoupon(couponInput.trim().toUpperCase());
                        }}
                        disabled={!couponInput.trim()}
                        className="px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-lg disabled:bg-neutral-300"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-xs text-rose-600">{couponError}</p>}
                  {appliedCoupon && !couponError && quote?.pricing?.discountAmount ? (
                    <p className="text-xs text-emerald-700 font-medium">
                      Coupon applied — you saved ₹{quote.pricing.discountAmount.toLocaleString('en-IN')}
                    </p>
                  ) : null}
                </div>

                <hr className="border-neutral-200" />

                {/* PRICE BREAKDOWN */}
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold text-neutral-900 text-base">Price details</h4>

                  <div className="flex justify-between text-neutral-700">
                    <span>
                      {nights} nights x ₹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span>₹{baseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-neutral-700">
                    <span>Taxes</span>
                    <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {quote?.pricing?.discountAmount ? quote.pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon discount</span>
                      <span>-₹{quote.pricing.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ) : null}
                </div>

                <hr className="border-neutral-200" />

                {/* TOTAL */}
                <div>
                  <div className="flex justify-between items-baseline font-bold text-base text-neutral-900">
                    <span>Total INR</span>
                    <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Price breakdown: Includes accommodation rates and GST.')}
                    className="underline text-xs font-semibold text-neutral-900 block mt-1"
                  >
                    Price breakdown
                  </button>
                </div>
              </div>

              {/* RARE FIND BOX */}
              <div className="bg-[#fff0f4] border border-[#fddbe7] rounded-2xl p-4 flex items-center gap-3">
                <span className="text-lg">💎</span>
                <p className="text-xs font-semibold text-neutral-900">
                  Rare find! This place is usually booked
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-neutral-200 py-6 px-4 sm:px-8 mt-16 bg-white text-xs text-neutral-600">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <span>·</span>
          <Link href="/company-details" className="hover:underline">Company details</Link>
        </div>
      </footer>
    </div>
  );
}

export default function AirbnbCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading checkout...</div>}>
      <AirbnbCheckoutContent />
    </Suspense>
  );
}
