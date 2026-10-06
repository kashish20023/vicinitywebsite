'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Building, Users, Calendar, Wallet, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react';

export default function HostDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiRequest('/hosts/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load host stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-neutral-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-900 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Hero Welcome Card */}
      <div className="bg-linear-to-r from-neutral-900 via-neutral-900 to-[#1A0B14] border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Host Command Center</span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Coworking Campus & Asset Portfolio
          </h1>
          <p className="text-xs text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Monitor real-time bookings, floor occupancy, delegated co-host permissions, and financial settlements for your flagship locations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/host/workspaces"
            className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md"
          >
            <Building className="w-4 h-4" />
            Manage Workspaces
          </Link>
          <Link
            href="/host/co-hosts"
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-purple-300 border border-purple-800/40 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
          >
            <Users className="w-4 h-4 text-purple-400" />
            Co-Host Team
          </Link>
          <Link
            href="/host/earnings"
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            Request Payout
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Managed Spaces</span>
            <Building className="w-4 h-4 text-[#0e4962]" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.workspacesCount || 0}</div>
          <div className="text-[11px] text-neutral-500 mt-1">{stats?.totalUnits || 0} total units</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.totalBookingsCount || 0}</div>
          <div className="text-[11px] text-emerald-400 mt-1">{stats?.activeBookingsCount || 0} active now</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Check-Ins</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.upcomingBookingsCount || 0}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Scheduled for this week</div>
        </div>

        <Link
          href="/host/co-hosts"
          className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-600/60 p-5 rounded-3xl shadow-sm transition block group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-purple-400 transition-colors">
              Co-Host Team
            </span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.cohostsCount || 2} Delegates</div>
          <div className="text-[11px] text-purple-400 mt-1 flex items-center justify-between">
            <span>{stats?.pendingInvitesCount || 1} pending invite</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Host Earnings</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₹{((stats?.totalEarningsRupees || 0)).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Direct settlement balance</div>
        </div>
      </div>

      {/* Recent Bookings Feed */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">Recent Campus Bookings</h2>
          <span className="text-xs text-neutral-400">Live transaction stream</span>
        </div>

        {(!stats?.recentBookings || stats.recentBookings.length === 0) ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No recent confirmed bookings yet. Newly reserved seats will show here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-800 pb-2">
                <tr>
                  <th className="py-2.5">Booking Ref</th>
                  <th className="py-2.5">Member</th>
                  <th className="py-2.5">Unit</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {stats.recentBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 font-mono text-[#0e4962] font-bold">{b.bookingNumber}</td>
                    <td className="py-3 text-white font-medium">{b.user?.name || 'Member'}</td>
                    <td className="py-3">{b.unit?.name || 'Desk'} ({b.unit?.unitType || 'HOT_DESK'})</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-full">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-white">
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
