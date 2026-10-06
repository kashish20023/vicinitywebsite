'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface CouponData {
  code: string;
  discountType: string;
  discountValue: number;
}

interface BannerData {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  triggerType: string;
  triggerValue: number;
  actionType: string;
  coupon?: CouponData;
}

import { api } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function BannerModal() {
  const pathname = usePathname();
  const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlockedCoupon, setUnlockedCoupon] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const excludedPages = ['/login', '/register', '/forgot-password', '/admin', '/co-host', '/host'];
    const isExcluded = !pathname || excludedPages.some((prefix) => pathname === prefix || pathname.startsWith(prefix));

    if (isExcluded) {
      setIsOpen(false);
      return;
    }

    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const fetchActiveBanners = async () => {
      try {
        const banners: BannerData[] = await api.get(`/banners/active?page=${encodeURIComponent(pathname)}`);
        if (!banners || banners.length === 0) return;

        const banner = banners[0];
        // Check session storage if closed already
        const closedKey = `banner_closed_${banner.id}`;
        if (sessionStorage.getItem(closedKey)) return;

        if (isMounted) {
          setActiveBanner(banner);

          const delayMs = banner.triggerType === 'delay' ? (banner.triggerValue || 5) * 1000 : 500;
          timerId = setTimeout(() => {
            if (isMounted) {
              setIsOpen(true);
              // Send impression event
              api.post(`/banners/${banner.id}/impression`).catch(() => { });
            }
          }, delayMs);
        }
      } catch (err) {
        // Silent fail
      }
    };

    fetchActiveBanners();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [pathname]);

  if (!isOpen || !activeBanner) return null;

  const handleClose = () => {
    setIsOpen(false);
    if (activeBanner) {
      sessionStorage.setItem(`banner_closed_${activeBanner.id}`, 'true');
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setErrorMsg('Please enter your name and phone number');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await api.post(`/banners/${activeBanner.id}/submit-lead`, { name, phone, email });

      if (data.couponCode) {
        setUnlockedCoupon(data.couponCode);
      } else {
        // Auto close after 2 seconds if no coupon
        setTimeout(() => handleClose(), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting lead');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = () => {
    if (unlockedCoupon) {
      navigator.clipboard.writeText(unlockedCoupon);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-100">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition"
        >
          ✕
        </button>

        {/* Banner Header Image */}
        {activeBanner.imageUrl ? (
          <div className="relative h-48 w-full bg-gradient-to-tr from-rose-500 to-amber-500">
            <img
              src={activeBanner.imageUrl}
              alt={activeBanner.title || 'Special Offer'}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="relative h-28 w-full bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 p-6 text-white flex flex-col justify-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-200">Exclusive Offer</span>
            <h3 className="text-xl font-bold">{activeBanner.title || 'Special Discount for You!'}</h3>
          </div>
        )}

        <div className="p-6">
          {activeBanner.imageUrl && activeBanner.title && (
            <h3 className="text-xl font-bold text-gray-900 mb-2">{activeBanner.title}</h3>
          )}

          {activeBanner.description && (
            <p className="text-sm text-gray-600 mb-4">{activeBanner.description}</p>
          )}

          {/* Action Type: Form Lead Capture */}
          {activeBanner.actionType === 'form' && (
            <>
              {unlockedCoupon ? (
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-center animate-in zoom-in-95">
                  <div className="text-2xl mb-1">🎉</div>
                  <h4 className="text-base font-bold text-emerald-900">Offer Unlocked!</h4>
                  <p className="text-xs text-emerald-700 mb-3">Use this coupon code at checkout:</p>

                  <div className="flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-lg border border-emerald-300 shadow-sm font-mono text-lg font-bold text-emerald-800">
                    <span>{unlockedCoupon}</span>
                    <button
                      onClick={handleCopyCoupon}
                      className="ml-2 px-3 py-1 text-xs bg-emerald-600 text-white font-sans rounded hover:bg-emerald-700 transition"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitLead} className="space-y-3">
                  {errorMsg && (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold rounded-lg shadow hover:from-rose-700 hover:to-pink-700 transition disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Submitting...' : 'Claim Discount Code'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Action Type: Link Redirect */}
          {activeBanner.actionType === 'link' && activeBanner.linkUrl && (
            <a
              href={activeBanner.linkUrl}
              onClick={handleClose}
              className="block w-full py-2.5 text-center bg-rose-600 text-white font-semibold rounded-lg shadow hover:bg-rose-700 transition text-sm"
            >
              Explore Offer →
            </a>
          )}

          {/* Action Type: Coupon Direct Reveal */}
          {activeBanner.actionType === 'coupon' && activeBanner.coupon && (
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-center">
              <span className="text-xs text-amber-700 font-semibold uppercase">Coupon Code</span>
              <div className="text-xl font-bold font-mono text-amber-900 mt-1">{activeBanner.coupon.code}</div>
              <p className="text-xs text-amber-600 mt-1">
                Save {activeBanner.coupon.discountValue}
                {activeBanner.coupon.discountType === 'PERCENTAGE' ? '%' : ' INR'} on your booking!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
