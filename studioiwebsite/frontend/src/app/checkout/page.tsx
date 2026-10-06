'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiRequest, getStoredUser } from '@/lib/api';
import { 
  ShieldCheck, CreditCard, CheckCircle2, AlertCircle, 
  ArrowRight, Tag, Clock, Sparkles, Building, ChevronRight,
  HelpCircle, RefreshCw, Lock
} from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const holdId = searchParams.get('holdId');
  const planId = searchParams.get('planId');
  const workspaceId = searchParams.get('workspaceId');
  const unitId = searchParams.get('unitId');
  const startDateTime = searchParams.get('startDateTime');
  const endDateTime = searchParams.get('endDateTime');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quote State
  const [quote, setQuote] = useState<any>(null);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'SIMULATED'>('UPI');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Countdown timer for 10-minute hold
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Fetch Authoritative Server Quote
  const fetchQuote = async (appliedCoupon?: string, addOns?: string[]) => {
    if (!unitId || !planId) return;

    try {
      const payload: any = {
        unitId,
        planId,
        holdId,
        startDateTime,
        endDateTime,
        couponCode: appliedCoupon !== undefined ? appliedCoupon : couponCode,
        addOnIds: addOns || selectedAddOns,
      };

      const data = await apiRequest<any>('/bookings/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setQuote(data);
      if (appliedCoupon) {
        if (data.appliedCoupon) {
          setCouponMessage({
            type: 'success',
            text: `Coupon applied: ₹${(Number(data.pricing.discountPaise) / 100).toLocaleString('en-IN')} saved!`,
          });
        } else {
          setCouponMessage({
            type: 'error',
            text: 'Coupon is not applicable or minimum order amount not met.',
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to calculate quote', err);
      setError(err.message || 'Could not compute quote');
    } finally {
      setLoading(false);
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      setError('Please sign in to proceed with your booking.');
      setLoading(false);
      return;
    }
    if (!holdId || !planId || !unitId) {
      setError('Missing booking parameters or seat hold. Please return to the campus view.');
      setLoading(false);
      return;
    }

    fetchQuote();
  }, [holdId, planId, unitId]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    fetchQuote(couponCode.trim().toUpperCase());
  };

  // Execute Confirmed Booking & Simulated Payment
  const handleCompletePayment = async () => {
    setPaymentError(null);
    setProcessing(true);

    try {
      // 1. Create Booking
      const bookingRes = await apiRequest<any>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          holdId,
          planId,
          couponCode: quote?.appliedCoupon?.code || undefined,
          addOnIds: selectedAddOns,
        }),
      });

      const paymentOrderId = bookingRes.paymentOrder?.id;
      if (!paymentOrderId) {
        throw new Error('Payment initialization failed on server');
      }

      // 2. Verify Payment (Direct Simulation Mode)
      const verifyRes = await apiRequest<any>('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: paymentOrderId,
          paymentMethod,
          providerPaymentId: `sim_pay_${Date.now()}`,
          idempotencyKey: `idem_${bookingRes.booking.id}_${Date.now()}`,
        }),
      });

      if (verifyRes.success) {
        // Redirect to Digital Pass page
        router.push(`/bookings/${bookingRes.booking.id}/pass`);
      } else {
        throw new Error('Payment reconciliation failed. Please retry.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment simulation failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-gray-700">Securing your seat and computing pricing...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Checkout Notice</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">{error}</p>
          <Link href="/explore" className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full">
            Back to Spaces
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const pricing = quote?.pricing;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 flex flex-col">
      <Navbar />

      {/* Checkout Subheader */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link href="/" className="hover:text-black">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/explore" className="hover:text-black">Campuses</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-semibold">Secure Checkout</span>
          </div>

          {/* Hold Countdown Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Seat Locked for: {formatTimer(timeLeftSeconds)}</span>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0e4962] mb-1">
            <ShieldCheck className="w-4 h-4" />
            Direct Studio i Reservation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Review Booking & Confirm Payment
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Authoritative integer-paise calculations. Zero hidden charges. Guaranteed anti-double-booking locks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Booking Details & Payment Method (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Unit & Reservation Details Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0e4962]" />
                Reserved Space & Inventory
              </h3>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Unit Code</span>
                  <span className="text-sm font-bold text-gray-900">{quote?.unit?.unitCode}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Category</span>
                  <span className="text-sm font-bold text-gray-900">{quote?.unit?.unitType?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Floor</span>
                  <span className="text-sm font-bold text-gray-900">{quote?.unit?.floor?.name || '1st Floor'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Capacity</span>
                  <span className="text-sm font-bold text-gray-900">{quote?.unit?.capacity || 1} Person</span>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Starts:</span>
                  <span className="font-semibold text-gray-900">
                    {quote?.schedule?.start ? new Date(quote.schedule.start).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ends:</span>
                  <span className="font-semibold text-gray-900">
                    {quote?.schedule?.end ? new Date(quote.schedule.end).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-bold text-[#0e4962]">
                    {quote?.breakdown?.slots} {quote?.plan?.planType?.toLowerCase()} slot(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Select Payment Gateway Method */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#0e4962]" />
                  Select Payment Method (Direct Mode)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Simulated local provider enabled. All payments are verified via idempotent server verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'UPI', label: 'UPI / QR / Apps', desc: 'Google Pay, PhonePe, Paytm, BHIM' },
                  { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay, Amex' },
                  { id: 'NET_BANKING', label: 'Net Banking', desc: 'HDFC, ICICI, SBI, Axis' },
                  { id: 'SIMULATED', label: 'Instant Simulator', desc: 'One-click local sandbox verification' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                      paymentMethod === m.id
                        ? 'border-[#0e4962] bg-[#edf4f7]/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-gray-900">{m.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{m.desc}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero gateway surcharge. Instant digital pass issuance upon confirmation.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary, Coupon & Pay Action (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-md space-y-6">
              <h3 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                Price Breakdown
              </h3>

              {/* Coupon Code Input */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#0e4962]" />
                  Promotional Coupon
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. STUDIO10, WELCOME500"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0e4962] focus:bg-white transition uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>

                {couponMessage && (
                  <p
                    className={`text-xs mt-2 font-medium ${
                      couponMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}

                <div className="flex gap-2 mt-2">
                  <span
                    onClick={() => {
                      setCouponCode('STUDIO10');
                      fetchQuote('STUDIO10');
                    }}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 cursor-pointer px-2 py-0.5 rounded-md text-gray-600 font-mono"
                  >
                    Use: STUDIO10 (10% Off)
                  </span>
                  <span
                    onClick={() => {
                      setCouponCode('WELCOME500');
                      fetchQuote('WELCOME500');
                    }}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 cursor-pointer px-2 py-0.5 rounded-md text-gray-600 font-mono"
                  >
                    Use: WELCOME500 (₹500 Off)
                  </span>
                </div>
              </div>

              {/* Itemized Line Items */}
              <div className="space-y-3 pt-3 border-t border-gray-100 text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Base Rate:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{(Number(pricing?.baseRatePaise || 0) / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                {Number(pricing?.discountPaise) > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Coupon Discount:</span>
                    <span>-₹{(Number(pricing?.discountPaise) / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-gray-600">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-gray-900">
                    ₹{(Number(pricing?.taxPaise || 0) / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                {Number(pricing?.securityDepositPaise) > 0 && (
                  <div className="flex justify-between items-center text-amber-700 bg-amber-50 p-2 rounded-xl">
                    <span>Refundable Deposit (2-Mo):</span>
                    <span className="font-bold">
                      ₹{(Number(pricing?.securityDepositPaise) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-base font-extrabold text-gray-900">
                  <span>Total Payable:</span>
                  <span className="text-[#0e4962] text-xl">
                    ₹{(Number(pricing?.totalPayablePaise || 0) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Error */}
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Submit Payment CTA */}
              <button
                onClick={handleCompletePayment}
                disabled={processing || timeLeftSeconds === 0}
                className="w-full py-4 bg-[#0e4962] hover:bg-[#093447] disabled:bg-gray-300 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying Payment & Issuing Pass...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay ₹{(Number(pricing?.totalPayablePaise || 0) / 100).toLocaleString('en-IN')} & Confirm
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-gray-400">
                🔒 256-Bit SSL Encrypted • Cancellation policy applies • Studio I Direct Merchant
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
