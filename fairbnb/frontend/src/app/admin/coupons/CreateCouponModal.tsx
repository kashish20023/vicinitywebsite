'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { X, Percent, IndianRupee, AlertCircle, Info, Sparkles, Loader2, Calendar, ShieldCheck } from 'lucide-react';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdCoupon: any) => void;
}

export function CreateCouponModal({ isOpen, onClose, onSuccess }: CreateCouponModalProps) {
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('15');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('1000');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('500');
  const [usageLimit, setUsageLimit] = useState<string>('100');
  
  // Default validUntil: 30 days from now at 23:59
  const getDefaultExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(23, 59, 0, 0);
    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [validUntil, setValidUntil] = useState<string>(getDefaultExpiry());

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus & Accessibility
  const codeInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      // Auto-focus code input on open
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter a coupon code.');
      return;
    }

    const numDiscount = parseFloat(discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      setErrorMessage('Please enter a valid discount value greater than 0.');
      return;
    }

    if (discountType === 'PERCENTAGE' && numDiscount > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%.');
      return;
    }

    if (!validUntil) {
      setErrorMessage('Please specify an expiry date and cutoff time.');
      return;
    }

    const expiryDate = new Date(validUntil);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      setErrorMessage('Expiry date must be in the future.');
      return;
    }

    const numMinOrder = minOrderAmount ? parseFloat(minOrderAmount) : 0;
    if (isNaN(numMinOrder) || numMinOrder < 0) {
      setErrorMessage('Minimum booking amount must be a positive number.');
      return;
    }

    const numMaxDiscount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined;
    if (numMaxDiscount !== undefined && (isNaN(numMaxDiscount) || numMaxDiscount < 0)) {
      setErrorMessage('Maximum discount cap must be a positive number.');
      return;
    }

    const numUsageLimit = usageLimit ? parseInt(usageLimit, 10) : 100;
    if (isNaN(numUsageLimit) || numUsageLimit < 1) {
      setErrorMessage('Usage limit must be at least 1 redemption.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        code: cleanCode,
        discountType,
        discountValue: numDiscount,
        minOrderAmount: numMinOrder,
        maxDiscountAmount: discountType === 'PERCENTAGE' ? (numMaxDiscount ?? null) : null,
        validUntil: expiryDate.toISOString(),
        usageLimit: numUsageLimit,
      };

      const result = await api.post('/coupons', payload);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Failed to create coupon:', err);
      // Preserve entered values, present exact server error
      const message =
        err?.message ||
        (err?.data && (err.data.message || err.data.error)) ||
        'Failed to create coupon. Please verify your details.';
      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-coupon-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl border border-neutral-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-coupon-modal-title" className="text-h3 font-bold text-neutral-900 tracking-tight">
                Create Booking Coupon
              </h2>
              <p className="text-body-sm text-neutral-500 font-normal">
                Issue a promotional discount code for guest bookings across the platform.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <form id="create-coupon-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Cannot release coupon: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* SECTION A: COUPON IDENTITY & DISCOUNT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
              <span className="text-overline font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                Step 1
              </span>
              <h3 className="text-overline font-semibold text-neutral-800 uppercase tracking-wider">
                Coupon Details & Discount
              </h3>
            </div>

            {/* Coupon Code Input */}
            <div>
              <label htmlFor="coupon-code" className="block text-label font-medium text-neutral-700 mb-1">
                Coupon Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={codeInputRef}
                  id="coupon-code"
                  type="text"
                  required
                  placeholder="e.g. FAIRBNB2026, SUMMER15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-mono font-semibold tracking-wider text-body-sm uppercase outline-none transition text-neutral-900 bg-white"
                />
              </div>
              <p className="text-caption text-neutral-400 mt-1 font-normal">
                Normalized to uppercase. Alphanumeric characters, hyphens, and underscores only.
              </p>
            </div>

            {/* Discount Type Selector */}
            <div>
              <label className="block text-label font-medium text-neutral-700 mb-1.5">
                Discount Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDiscountType('PERCENTAGE')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    discountType === 'PERCENTAGE'
                      ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      discountType === 'PERCENTAGE' ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-body-sm font-semibold text-neutral-900">Percentage Discount</div>
                    <div className="text-caption text-neutral-500 font-normal">e.g. 10%, 15% off booking subtotal</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType('FLAT')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    discountType === 'FLAT'
                      ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      discountType === 'FLAT' ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-body-sm font-semibold text-neutral-900">Flat Amount</div>
                    <div className="text-caption text-neutral-500 font-normal">e.g. ₹500, ₹1,000 instant discount</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Discount Value & Max Cap Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="discount-value" className="block text-label font-medium text-neutral-700 mb-1">
                  Discount Value ({discountType === 'PERCENTAGE' ? '%' : '₹'}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-caption font-semibold text-neutral-400">
                    {discountType === 'PERCENTAGE' ? '%' : '₹'}
                  </span>
                  <input
                    id="discount-value"
                    type="number"
                    min="0.01"
                    max={discountType === 'PERCENTAGE' ? '100' : undefined}
                    step="any"
                    required
                    placeholder={discountType === 'PERCENTAGE' ? '15' : '500'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-caption font-semibold font-tabular outline-none transition text-neutral-900 bg-white"
                  />
                </div>
                <p className="text-caption text-neutral-400 mt-1 font-normal">
                  {discountType === 'PERCENTAGE'
                    ? 'Enter percentage rate (1 to 100).'
                    : 'Enter flat rupee reduction amount.'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="max-discount-cap"
                  className={`block text-label font-medium mb-1 ${
                    discountType === 'PERCENTAGE' ? 'text-neutral-700' : 'text-neutral-400'
                  }`}
                >
                  Max Discount Cap (₹) {discountType === 'PERCENTAGE' && <span className="text-neutral-400 font-normal">(Optional)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-caption font-semibold text-neutral-400">
                    ₹
                  </span>
                  <input
                    id="max-discount-cap"
                    type="number"
                    min="0"
                    step="any"
                    disabled={discountType !== 'PERCENTAGE'}
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 500' : 'N/A for Flat'}
                    value={discountType === 'PERCENTAGE' ? maxDiscountAmount : ''}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className={`w-full pl-8 pr-4 py-2 rounded-xl border text-caption font-semibold font-tabular outline-none transition ${
                      discountType === 'PERCENTAGE'
                        ? 'border-neutral-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-neutral-900 bg-white'
                        : 'border-neutral-100 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                    }`}
                  />
                </div>
                <p className="text-caption text-neutral-400 mt-1 font-normal">
                  {discountType === 'PERCENTAGE'
                    ? 'Limits maximum savings for high-value bookings.'
                    : 'Fixed discounts apply the exact value directly.'}
                </p>
              </div>
            </div>

            {/* Expiry Date & Cutoff Time */}
            <div>
              <label htmlFor="valid-until" className="block text-xs font-bold text-neutral-700 mb-1">
                Expiry Date & Cutoff Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="valid-until"
                  type="datetime-local"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-xs font-medium outline-none transition text-neutral-900 bg-white"
                />
              </div>
              <p className="text-caption text-neutral-400 mt-1">
                Coupon will automatically stop being accepted at this exact timestamp (IST / UTC+05:30).
              </p>
            </div>
          </div>

          {/* SECTION B: BOOKING & USAGE RESTRICTIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
              <span className="text-overline font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                Step 2
              </span>
              <h3 className="text-overline font-semibold text-neutral-800 uppercase tracking-wider">
                Booking & Usage Restrictions
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="min-order-amount" className="block text-label font-medium text-neutral-700 mb-1">
                  Minimum Booking Subtotal (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-caption font-semibold text-neutral-400">
                    ₹
                  </span>
                  <input
                    id="min-order-amount"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-caption font-semibold font-tabular outline-none transition text-neutral-900 bg-white"
                  />
                </div>
                <p className="text-caption text-neutral-400 mt-1 font-normal">
                  Booking subtotal required before coupon applies (0 = no minimum).
                </p>
              </div>

              <div>
                <label htmlFor="usage-limit" className="block text-label font-medium text-neutral-700 mb-1">
                  Total Redemption Limit (Pool Cap)
                </label>
                <input
                  id="usage-limit"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="100"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-caption font-semibold font-tabular outline-none transition text-neutral-900 bg-white"
                />
                <p className="text-caption text-neutral-400 mt-1 font-normal">
                  Maximum times this coupon can be redeemed across the platform.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION C: PLATFORM APPLICABILITY & RELEASE POLICY */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="flex items-center gap-2 text-caption font-semibold text-neutral-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Platform Applicability & Release Policy</span>
            </div>
            <ul className="text-caption text-neutral-600 space-y-1 pl-6 list-disc font-normal">
              <li>
                <strong>Platform-wide applicability:</strong> This coupon applies to all verified properties for bookings meeting the minimum booking threshold.
              </li>
              <li>
                <strong>Immediate Activation:</strong> Creating this coupon immediately releases and activates it for guest checkout redemption.
              </li>
              <li>
                <strong>Anti-Farming Rule:</strong> Guest booking cancellations do not restore used coupon quotas; only host or admin cancellations return redemptions to the pool.
              </li>
            </ul>
          </div>
        </form>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-button font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-coupon-form"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-98 text-button font-semibold text-white shadow-sm shadow-rose-500/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Releasing Coupon...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create & Release Coupon</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
