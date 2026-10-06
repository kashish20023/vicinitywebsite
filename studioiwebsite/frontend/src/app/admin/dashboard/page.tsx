'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, Building2, ShieldCheck, Clock, ArrowRight, 
  Loader2, RefreshCw, DollarSign, Calendar, TrendingUp,
  AlertCircle, CheckCircle2, MapPin
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/dashboard');
      setData(res);
    } catch (e) {
      console.error('Failed to load admin overview', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e4962]" />
        <p className="text-xs text-neutral-500 mt-3 font-semibold">Loading Admin Overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#edf4f7] text-[#0e4962] border border-[#adcada]">
              Live Operations
            </span>
            <span className="text-xs text-neutral-400 font-medium">Jaipur Flagship Hubs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-2">
            Studio i Command Center
          </h1>
          <p className="text-xs text-neutral-500 mt-1.5 max-w-xl leading-relaxed">
            Universal oversight across members, coworking inventory, 2D floor plan layouts, manual reservations, and host payout settlements.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0e4962]' : ''}`} />
          </button>
          <Link
            href="/admin/listings"
            className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Workspaces</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <Card className="border border-neutral-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-[#edf4f7] text-[#0e4962] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-neutral-900">
              {data?.totalBookings || 0}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {data?.activeBookings || 0} active reservations
            </div>
          </CardContent>
        </Card>

        {/* Total Inventory Units */}
        <Card className="border border-neutral-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Inventory Units</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-neutral-900">
              {data?.totalUnits || 0}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500 mt-1">
              Desks, Cabins & Meeting Suites
            </div>
          </CardContent>
        </Card>

        {/* Total Registered Users */}
        <Card className="border border-neutral-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Community Members</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-neutral-900">
              {data?.totalUsers || 0}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500 mt-1">
              Members, Hosts & Co-hosts
            </div>
          </CardContent>
        </Card>

        {/* Financial Collections */}
        <Card className="border border-neutral-200/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">
              ₹{(Number(data?.totalRevenueRupees || 0)).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500 mt-1">
              100% Integer Paise Precision
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/spaces/85b1a37a-a43b-48ad-8181-fc46f990ad8e/floor-plan"
          className="bg-white border border-neutral-200/80 p-5 rounded-2xl hover:border-[#0e4962] transition group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#0e4962] uppercase tracking-wider">2D Floor Plan Canvas</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#0e4962] transition-transform group-hover:translate-x-1" />
          </div>
          <h3 className="font-bold text-sm text-neutral-900 mt-2">Lehariya 1st Floor Layout Editor</h3>
          <p className="text-xs text-neutral-500 mt-1">Reposition desks, adjust coordinates, and publish live layout versions.</p>
        </Link>

        <Link
          href="/admin/bookings"
          className="bg-white border border-neutral-200/80 p-5 rounded-2xl hover:border-[#0e4962] transition group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Coworking Desk Bookings</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
          </div>
          <h3 className="font-bold text-sm text-neutral-900 mt-2">Create & Inspect Bookings</h3>
          <p className="text-xs text-neutral-500 mt-1">Search reservations, view QR passes, or create manual desk bookings.</p>
        </Link>

        <Link
          href="/admin/finance"
          className="bg-white border border-neutral-200/80 p-5 rounded-2xl hover:border-[#0e4962] transition group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">Settlements & Payouts</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
          </div>
          <h3 className="font-bold text-sm text-neutral-900 mt-2">Host Payout Approvals</h3>
          <p className="text-xs text-neutral-500 mt-1">Review pending campus settlements and process NEFT transfers in 1-click.</p>
        </Link>
      </div>

      {/* Recent Bookings Feed */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-neutral-900 tracking-tight">Recent Campus Bookings</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Live real-time feed from Lehariya & Horizon flagships</p>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs font-bold text-[#0e4962] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!data?.recentBookings || data.recentBookings.length === 0) ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            No recent bookings found. Reserved seats will appear here immediately.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Unit & Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.recentBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-[#edf4f7]/20 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0e4962]">
                      {b.bookingNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">
                      {b.user?.name || 'Member'}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600">
                      {b.unit?.name || 'Desk'} ({b.planType || 'DAY_PASS'})
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'warning'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-neutral-900">
                      ₹{(Number(b.totalAmountPaise) / 100).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
