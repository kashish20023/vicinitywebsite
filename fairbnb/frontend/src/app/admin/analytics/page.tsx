'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { TrendingUp, Calendar, DollarSign, Loader2, RefreshCw, BarChart2, PieChart, Percent, Users, Award } from 'lucide-react';

interface AnalyticsData {
  timeframe: string;
  mode: string;
  kpis: {
    grossBookingVolume: number;
    totalCompletedReservations: number;
    averageDailyRate: number;
    occupancyRatePercentage: number;
  };
  timeSeries: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [mode, setMode] = useState<'booked' | 'stayed'>('booked');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get<AnalyticsData>(`/admin/analytics/overview?range=${range}&mode=${mode}`);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch analytics overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, range, mode]);

  const kpis = data?.kpis;
  const timeSeries = data?.timeSeries || [];

  // Compute maximum revenue in timeSeries for dynamic bar chart height
  const maxRevenue = Math.max(...timeSeries.map((t) => t.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-8 select-none">
      {/* HEADER & CONTROLS */}
      <PageHeader
        title="Platform Analytics & Intelligence"
        subtitle="Gross Booking Volume (GBV), Average Daily Rate (ADR), and Occupancy progression."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Analytics' },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* RANGE SELECTOR */}
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-caption font-semibold transition uppercase ${range === r ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* MODE SELECTOR */}
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              {(['booked', 'stayed'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-lg text-caption font-semibold transition capitalize ${mode === m ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={fetchAnalytics}
              className="p-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl transition shadow-xs"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="py-24 text-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-caption font-medium text-neutral-500">Processing platform time-series metrics...</p>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Gross Booking Volume (GBV)"
              value={`₹${(kpis?.grossBookingVolume ?? 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              variant="emerald"
              subtitle={`Total revenue generated (${data?.timeframe})`}
            />

            <StatCard
              title="Completed Reservations"
              value={kpis?.totalCompletedReservations ?? 0}
              icon={Calendar}
              variant="blue"
              subtitle="Confirmed guest stays"
            />

            <StatCard
              title="Average Daily Rate (ADR)"
              value={`₹${(kpis?.averageDailyRate ?? 0).toLocaleString('en-IN')}`}
              icon={TrendingUp}
              variant="purple"
              subtitle="Average price per booked night"
            />

            <StatCard
              title="Occupancy Rate"
              value={`${kpis?.occupancyRatePercentage ?? 0}%`}
              icon={Percent}
              variant="amber"
              subtitle="Capacity utilization percentage"
            />
          </div>

          {/* VISUAL REVENUE PROGRESSION CHART */}
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-h4 font-semibold text-neutral-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-600" /> Time-Series Revenue Progression
                </h3>
                <p className="text-caption text-neutral-400 mt-0.5">Daily breakdown of total booking volume over the last {data?.timeframe}.</p>
              </div>
              <span className="text-overline font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full uppercase tracking-wider">
                Mode: {mode}
              </span>
            </div>

            {timeSeries.length === 0 ? (
              <div className="py-16 text-center text-neutral-400">
                <PieChart className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-caption font-medium text-neutral-500">No time-series data recorded for this timeframe range.</p>
              </div>
            ) : (
              <div className="pt-6 pb-2">
                <div className="h-56 flex items-end gap-2 overflow-x-auto pb-4">
                  {timeSeries.map((t, idx) => {
                    const heightPercent = Math.max(10, Math.round((t.revenue / maxRevenue) * 100));
                    return (
                      <div key={idx} className="flex-1 min-w-[28px] flex flex-col items-center group relative">
                        {/* TOOLTIP OVERLAY */}
                        <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-neutral-900 text-white text-caption p-2 rounded-xl shadow-lg z-20 whitespace-nowrap pointer-events-none">
                          <span className="font-semibold font-tabular">₹{t.revenue.toLocaleString('en-IN')}</span>
                          <span className="text-neutral-300">{t.bookings} booking(s)</span>
                        </div>

                        {/* BAR */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-lg group-hover:from-purple-800 group-hover:to-purple-600 transition-all shadow-xs"
                        />
                        <span className="text-overline font-mono text-neutral-400 mt-2 truncate w-full text-center">
                          {t.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
