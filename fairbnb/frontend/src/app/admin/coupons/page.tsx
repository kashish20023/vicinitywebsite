'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CreateCouponModal } from './CreateCouponModal';
import {
  TicketPercent,
  Plus,
  RefreshCw,
  Search,
  Copy,
  Check,
  Percent,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  ShieldAlert,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface CouponItem {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function getCouponStatus(c: CouponItem): 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' {
  const isPast = new Date(c.validUntil).getTime() <= Date.now();
  if (isPast) return 'EXPIRED';
  if (c.timesUsed >= c.usageLimit) return 'EXHAUSTED';
  return 'ACTIVE';
}

export default function AdminCouponsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERCENTAGE' | 'FLAT'>('ALL');

  // Modal & Alerts
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<CouponItem[]>('/coupons');
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching admin coupons:', err);
      const message =
        err?.message ||
        (err?.data && (err.data.message || err.data.error)) ||
        'Failed to load coupons from server.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCoupons();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    let active = 0;
    let expired = 0;
    let exhausted = 0;
    let totalRedemptions = 0;

    coupons.forEach((c) => {
      totalRedemptions += c.timesUsed || 0;
      const st = getCouponStatus(c);
      if (st === 'ACTIVE') active++;
      else if (st === 'EXHAUSTED') exhausted++;
      else if (st === 'EXPIRED') expired++;
    });

    return {
      total: coupons.length,
      active,
      exhausted,
      expired,
      totalRedemptions,
    };
  }, [coupons]);

  // Filtered dataset
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        if (!c.code.toUpperCase().includes(q)) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const st = getCouponStatus(c);
        if (st !== statusFilter) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL') {
        if (c.discountType !== typeFilter) return false;
      }

      return true;
    });
  }, [coupons, searchQuery, statusFilter, typeFilter]);

  const handleCouponCreated = (newCoupon: any) => {
    setSuccessBanner(`Coupon "${newCoupon.code}" was successfully created and released!`);
    fetchCoupons();
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER */}
      <PageHeader
        title="Coupons & Offers"
        subtitle="Manage booking discount coupons, redemption limits, and validity periods across properties."
        badge={
          <span className="text-overline font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
            Live Engine
          </span>
        }
        actions={
          <>
            <button
              onClick={fetchCoupons}
              disabled={loading}
              className="p-2.5 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center shadow-sm disabled:opacity-50 cursor-pointer"
              title="Refresh coupons"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-500' : ''}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-button font-semibold shadow-sm shadow-rose-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </>
        }
      />

      {/* SUCCESS BANNER */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCoupons}
            className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Coupons"
          value={metrics.total}
          subtitle="in catalog"
          icon={TicketPercent}
          variant="default"
        />
        <StatCard
          label="Active & Redeemable"
          value={metrics.active}
          subtitle="ready at checkout"
          icon={Sparkles}
          variant="emerald"
        />
        <StatCard
          label="Total Redemptions"
          value={metrics.totalRedemptions}
          subtitle="successful uses"
          icon={Flame}
          variant="rose"
        />
        <StatCard
          label="Expired / Exhausted"
          value={metrics.expired + metrics.exhausted}
          subtitle={`(${metrics.exhausted} cap, ${metrics.expired} expired)`}
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="max-w-sm w-full">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by coupon code (e.g. FAIRBNB500)..."
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center bg-neutral-100/80 p-1 rounded-2xl text-xs font-semibold text-neutral-600">
              {(['ALL', 'ACTIVE', 'EXHAUSTED', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl transition ${
                    statusFilter === st ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'hover:text-neutral-900'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center bg-neutral-100/80 p-1 rounded-2xl text-xs font-semibold text-neutral-600">
              {(['ALL', 'PERCENTAGE', 'FLAT'] as const).map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTypeFilter(tp)}
                  className={`px-3 py-1 rounded-xl transition ${
                    typeFilter === tp ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'hover:text-neutral-900'
                  }`}
                >
                  {tp === 'ALL' ? 'All Types' : tp === 'PERCENTAGE' ? 'Percentage %' : 'Flat ₹'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold border-t border-neutral-100 pt-3">
          <span>
            Showing <strong className="text-neutral-900">{filteredCoupons.length}</strong> of{' '}
            <strong className="text-neutral-900">{coupons.length}</strong> total coupons
          </span>
          {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="text-rose-600 hover:text-rose-700 font-bold hover:underline transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        columns={[
          {
            key: 'code',
            header: 'Coupon Code',
            render: (c: CouponItem) => (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1 rounded-xl border border-neutral-200/80 transition font-mono font-semibold text-neutral-900 text-body-sm">
                  <span>{c.code}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(c.code)}
                    className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded transition"
                    title="Copy coupon code"
                    aria-label={`Copy code ${c.code}`}
                  >
                    {copiedCode === c.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {copiedCode === c.code && (
                  <span className="text-overline font-semibold text-emerald-600 animate-in fade-in">
                    Copied!
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'discount',
            header: 'Discount',
            render: (c: CouponItem) => (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900 text-body-sm">
                  {c.discountType === 'PERCENTAGE' ? (
                    <>
                      <span>{c.discountValue}% OFF</span>
                      <span className="text-overline font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                        Percentage
                      </span>
                    </>
                  ) : (
                    <>
                      <span>₹{c.discountValue} FLAT</span>
                      <span className="text-overline font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                        Rupee
                      </span>
                    </>
                  )}
                </div>
                {c.discountType === 'PERCENTAGE' && (
                  <span className="text-caption text-neutral-400 font-normal">
                    {c.maxDiscountAmount ? `Max savings capped at ₹${c.maxDiscountAmount}` : 'No max cap'}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'applicability',
            header: 'Applicability & Min Booking',
            render: (c: CouponItem) => (
              <div className="flex flex-col">
                <span className="font-semibold text-neutral-800 text-body-sm">Platform-wide</span>
                <span className="text-caption text-neutral-500 font-normal">
                  {c.minOrderAmount && c.minOrderAmount > 0
                    ? `Min booking ₹${c.minOrderAmount}`
                    : 'No minimum order'}
                </span>
              </div>
            ),
          },
          {
            key: 'redemptions',
            header: 'Redemptions / Cap',
            render: (c: CouponItem) => {
              const usagePercent = Math.min(100, Math.round((c.timesUsed / c.usageLimit) * 100));
              return (
                <div className="flex flex-col gap-1 max-w-[160px]">
                  <div className="flex items-center justify-between text-caption">
                    <span className="font-semibold font-tabular text-neutral-900">
                      {c.timesUsed} / {c.usageLimit}
                    </span>
                    <span className="text-neutral-400 font-medium font-tabular">{usagePercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usagePercent >= 100
                          ? 'bg-amber-500'
                          : usagePercent > 75
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <span className="text-caption text-neutral-400">
                    {c.usageLimit - c.timesUsed} redemptions left
                  </span>
                </div>
              );
            },
          },
          {
            key: 'validity',
            header: 'Validity & Cutoff',
            render: (c: CouponItem) => {
              const expiryDate = new Date(c.validUntil);
              return (
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-900 text-caption font-tabular">
                    {expiryDate.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-caption text-neutral-400 font-tabular">
                    {expiryDate.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            },
          },
          {
            key: 'status',
            header: 'Status',
            cellClassName: 'text-center',
            render: (c: CouponItem) => {
              const status = getCouponStatus(c);
              return <StatusBadge status={status} showDot size="sm" />;
            },
          },
        ]}
        data={filteredCoupons}
        rowKey={(c: CouponItem) => c.id}
        loading={loading}
        loadingMessage="Loading coupons from engine..."
        emptyIcon={<TicketPercent className="w-12 h-12 text-neutral-300 mx-auto" />}
        emptyTitle="No coupons found"
        emptySubtitle={
          searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
            ? 'No coupons match your current search criteria or status filters.'
            : 'No discount coupons have been released yet.'
        }
      />

      {/* CREATE MODAL */}
      <CreateCouponModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCouponCreated}
      />
    </div>
  );
}
