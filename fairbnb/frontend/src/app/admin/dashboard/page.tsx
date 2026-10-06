'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  Users,
  Building2,
  RefreshCw,
  DollarSign,
  ClipboardList,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  DashboardSkeleton,
} from '@/components/dashboard';
import { Badge } from '@/components/ui/Badge';
import { pageVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/motion';

interface OverviewResponse {
  overview: {
    users: {
      total: number;
      hosts: number;
      guests: number;
      admins: number;
      verified: number;
      unverified: number;
      blocked: number;
    };
    properties: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      published: number;
      draft: number;
      categories: Array<{ category: string; count: number }>;
    };
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  recentProperties: Array<{
    id: string;
    title: string;
    city: string;
    state: string;
    basePrice: number | string;
    status: string;
    verificationStatus: string;
    createdAt: string;
    host?: { name: string; email?: string; phone: string } | null;
  }>;
}

interface PlatformStatsResponse {
  stats: {
    pendingVerificationsCount: number;
    pendingPropertiesCount: number;
    totalUsers: number;
    totalHosts: number;
    totalGuests: number;
    totalProperties: number;
    publishedProperties: number;
    totalBookingsCount: number;
    totalRevenue: number;
  };
}

interface FinancialCollectionsResponse {
  summary: {
    totalCollected: number;
    platformFeeEarnings: number;
    hostPayoutsPending: number;
    hostPayoutsPaid: number;
    totalBookingsPaid: number;
  };
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [statsData, setStatsData] = useState<PlatformStatsResponse | null>(null);
  const [, setFinanceData] = useState<FinancialCollectionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, statsRes, collectionsRes] = await Promise.all([
        api.get<OverviewResponse>('/admin/overview'),
        api.get<PlatformStatsResponse>('/admin/stats'),
        api.get<FinancialCollectionsResponse>('/admin/collections').catch(() => null),
      ]);
      setData(overviewRes);
      setStatsData(statsRes);
      if (collectionsRes) setFinanceData(collectionsRes);
    } catch (err: unknown) {
      console.error('Error fetching admin dashboard metrics:', err);
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch admin dashboard metrics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('fairbnb_token');

    async function load() {
      try {
        const [overviewRes, statsRes, collectionsRes] = await Promise.all([
          api.get<OverviewResponse>('/admin/overview'),
          api.get<PlatformStatsResponse>('/admin/stats'),
          api.get<FinancialCollectionsResponse>('/admin/collections').catch(() => null),
        ]);
        if (!ignore) {
          setData(overviewRes);
          setStatsData(statsRes);
          if (collectionsRes) setFinanceData(collectionsRes);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Error fetching admin dashboard metrics:', err);
          const msg = err instanceof ApiError ? err.message : 'Failed to fetch admin dashboard metrics.';
          setError(msg);
          setLoading(false);
        }
      }
    }

    if (isAuthenticated || hasToken) {
      load();
    } else if (!authLoading) {
      queueMicrotask(() => {
        if (!ignore) setLoading(false);
      });
    }

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, authLoading]);

  const handleQuickAdminLogin = async () => {
    setLoggingInAdmin(true);
    try {
      await login({ identifier: 'admin@fairbnb.com', password: 'admin123' }, '/admin/dashboard');
      await fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin authentication failed.';
      alert(msg);
    } finally {
      setLoggingInAdmin(false);
    }
  };

  const overview = data?.overview;
  const stats = statsData?.stats;
  const recentUsers = data?.recentUsers || [];
  const recentProperties = data?.recentProperties || [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* 1. PAGE HEADER */}
      <PageHeader
        workspace="ADMINISTRATION"
        title="Platform Overview"
        description="Real-time operations, host verification queues, and financial summary."
        icon={ShieldCheck}
        actions={
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* CONNECTION STATUS ALERT (IF DEMO/RESTRICTED TOKEN) */}
      {error && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 shadow-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-amber-950 text-sm">Dashboard Data Connection Notice</h4>
            <p className="text-xs text-amber-800 mt-0.5">{error}</p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={loggingInAdmin}
                className="px-3 py-1.5 bg-amber-900 text-white rounded-lg text-xs font-semibold hover:bg-amber-950 transition cursor-pointer"
              >
                {loggingInAdmin ? 'Authenticating Admin...' : 'Authenticate as Admin (1-Click)'}
              </button>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
              >
                Retry API Fetch
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-6">
          <DashboardSkeleton.StatGrid count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardSkeleton.List count={4} />
            <DashboardSkeleton.List count={4} />
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: TOP KPI METRICS */}
          <motion.div
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={staggerItemVariants}>
              <StatCard
                label="Gross Platform Revenue"
                value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
                icon={DollarSign}
                trend={{ value: 'Guest Bookings', direction: 'up', label: 'confirmed' }}
                description="Total platform transaction volume"
              />
            </motion.div>

            <motion.div variants={staggerItemVariants}>
              <StatCard
                label="Total Properties"
                value={overview?.properties.total ?? stats?.totalProperties ?? 0}
                icon={Building2}
                status={`${overview?.properties.published ?? stats?.publishedProperties ?? 0} Live`}
                statusVariant="success"
                href="/admin/listings"
                description={`${overview?.properties.pending ?? 0} pending review`}
              />
            </motion.div>

            <motion.div variants={staggerItemVariants}>
              <StatCard
                label="Reservations Completed"
                value={stats?.totalBookingsCount ?? 0}
                icon={ClipboardList}
                href="/admin/bookings"
                description="Guest reservations across portfolio"
              />
            </motion.div>

            <motion.div variants={staggerItemVariants}>
              <StatCard
                label="Registered Accounts"
                value={overview?.users.total ?? stats?.totalUsers ?? 0}
                icon={Users}
                href="/admin/users"
                description={`${overview?.users.hosts ?? stats?.totalHosts ?? 0} Hosts • ${overview?.users.guests ?? stats?.totalGuests ?? 0} Guests`}
              />
            </motion.div>
          </motion.div>

          {/* SECTION 2: OPERATIONAL ACTION HUBS */}
          <div className="space-y-3">
            <h2 className="text-overline text-neutral-400">
              Operational Action Hubs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/listings"
                className="group p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:border-[#0e4962] hover:shadow-sm transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-3xl font-bold text-[#0e4962] font-tabular">
                    {overview?.properties.pending ?? 0}
                  </p>
                  <p className="text-body-sm font-semibold text-neutral-900 mt-1">Pending Listings</p>
                  <p className="text-caption text-neutral-500">Approve or reject submissions</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#0e4962]/10 text-[#0e4962] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>

              <Link
                href="/admin/verification"
                className="group p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:border-amber-500 hover:shadow-sm transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-3xl font-bold text-amber-600 font-tabular">
                    {stats?.pendingVerificationsCount ?? 0}
                  </p>
                  <p className="text-body-sm font-semibold text-neutral-900 mt-1">KYC Verification Queue</p>
                  <p className="text-caption text-neutral-500">Identity & compliance audits</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>

              <Link
                href="/admin/hosts"
                className="group p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:border-purple-500 hover:shadow-sm transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-3xl font-bold text-purple-700 font-tabular">
                    {overview?.users.hosts ?? stats?.totalHosts ?? 0}
                  </p>
                  <p className="text-body-sm font-semibold text-neutral-900 mt-1">Host Supervision Hub</p>
                  <p className="text-caption text-neutral-500">Manage hosts, earnings & tiers</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </div>

          {/* SECTION 3: RECENT ACTIVITY (TWO-COLUMN DATA TILES) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RECENT USERS */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 text-h4">Recent Registered Accounts</h3>
                  <p className="text-caption text-neutral-400">Latest users joined on FairBnB platform.</p>
                </div>
                <Link
                  href="/admin/users"
                  className="text-caption font-semibold text-[#0e4962] hover:underline"
                >
                  View All →
                </Link>
              </div>

              {recentUsers.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-body-sm">
                  No recent user registrations recorded.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0e4962]/10 text-[#0e4962] font-semibold flex items-center justify-center text-caption">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 text-body-sm truncate">{u.name}</p>
                          <p className="text-caption text-neutral-400 truncate">{u.email || u.phone}</p>
                        </div>
                      </div>

                      <Badge variant={u.role === 'HOST' ? 'info' : u.role === 'ADMIN' ? 'warning' : 'default'}>
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECENT PROPERTY SUBMISSIONS */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 text-h4">Recent Property Submissions</h3>
                  <p className="text-caption text-neutral-400">Latest listings submitted for review.</p>
                </div>
                <Link
                  href="/admin/listings"
                  className="text-caption font-semibold text-[#0e4962] hover:underline"
                >
                  View All →
                </Link>
              </div>

              {recentProperties.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-body-sm">
                  No recent property submissions recorded.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {recentProperties.map((p) => {
                    const basePriceNum = Number(p.basePrice || 0);
                    return (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/70 transition-colors">
                        <div className="max-w-[65%] min-w-0">
                          <p className="font-semibold text-neutral-900 text-body-sm truncate">{p.title}</p>
                          <p className="text-caption text-neutral-400 truncate">
                            {p.city}, {p.state} • Host: {p.host?.name || 'Host'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-semibold text-neutral-900 text-body-sm font-tabular">
                            ₹{basePriceNum.toLocaleString('en-IN')}
                          </p>
                          <div className="mt-0.5">
                            <Badge
                              variant={
                                p.verificationStatus === 'APPROVED'
                                  ? 'success'
                                  : p.verificationStatus === 'REJECTED'
                                  ? 'error'
                                  : 'warning'
                              }
                            >
                              {p.verificationStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
