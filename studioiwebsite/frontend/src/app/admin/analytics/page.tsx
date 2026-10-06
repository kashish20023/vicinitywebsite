'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3, TrendingUp, Users, DollarSign, 
  MapPin, Clock, ArrowUpRight, Zap
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const categories = [
    { label: 'Private Cabin Suites', occupancy: '94.2%', revenue: '₹14.8L', growth: '+12.4%' },
    { label: 'Dedicated Desks', occupancy: '88.5%', revenue: '₹8.2L', growth: '+8.1%' },
    { label: 'Hot Desks / Flexi Pass', occupancy: '76.0%', revenue: '₹3.6L', growth: '+18.5%' },
    { label: 'Conference / Meeting Rooms', occupancy: '62.8%', revenue: '₹1.8L', growth: '+5.2%' },
  ];

  const locations = [
    { name: 'Studio i — Lehariya Flagship, Jaipur', capacity: '60 Desks', revenue: '₹18.4L', share: '65%' },
    { name: 'Studio i — Horizon Tower, Jaipur', capacity: '38 Desks', revenue: '₹10.0L', share: '35%' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Coworking Occupancy & Analytics</h1>
        <p className="text-xs text-neutral-500 mt-1">Platform revenue velocity, seat utilization, and flagship performance.</p>
      </div>

      {/* Top Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Average Occupancy</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-neutral-900">86.4%</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +4.2%
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Peak utilization at 11:30 AM</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Gross Booking Value</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#0e4962]">₹28.4L</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.8%
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Month-to-date GMV</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">RevPAD (Rev / Desk)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-neutral-900">₹842</span>
              <span className="text-xs font-bold text-neutral-500">/ day</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Exceeds industry standard by 18%</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Member Retention</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-600">91.8%</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Recurring monthly renewal rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Utilization breakdown by Space Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-neutral-200/80">
          <CardHeader>
            <CardTitle>Seat Utilization by Space Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((c) => (
              <div key={c.label} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-900">{c.label}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Revenue: {c.revenue}</p>
                </div>
                <div className="text-right">
                  <Badge variant="pink" className="font-mono text-xs">{c.occupancy}</Badge>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">{c.growth} MoM</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Flagship Locations Breakdown */}
        <Card className="bg-white border-neutral-200/80">
          <CardHeader>
            <CardTitle>Flagship Hub Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {locations.map((loc) => (
              <div key={loc.name} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">{loc.name}</span>
                  <span className="font-black text-[#0e4962]">{loc.revenue}</span>
                </div>
                <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#0e4962] h-full rounded-full" style={{ width: loc.share }} />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>{loc.capacity}</span>
                  <span>{loc.share} of total platform revenue</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
