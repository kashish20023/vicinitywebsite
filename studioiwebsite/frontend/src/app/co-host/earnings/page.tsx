'use client';

import React, { useState } from 'react';
import {
  Wallet, TrendingUp, CheckCircle2, Building2,
  Percent, ArrowUpRight, ShieldCheck, CreditCard, RefreshCw
} from 'lucide-react';

interface SplitRule {
  id: string;
  property: string;
  primaryHost: string;
  splitType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'CLEANING_FEE_PLUS_PERCENTAGE';
  splitValue: number;
  totalEarnedRupees: number;
  payoutStatus: 'ACTIVE' | 'HELD';
}

const MOCK_SPLITS: SplitRule[] = [
  {
    id: 'spl-101',
    property: 'Lehariya KGK Realty — Executive Coworking Floor',
    primaryHost: 'Shyam Media Group',
    splitType: 'PERCENTAGE',
    splitValue: 15,
    totalEarnedRupees: 72750,
    payoutStatus: 'ACTIVE',
  },
  {
    id: 'spl-102',
    property: 'Horizon Tower — Executive Private Cabins',
    primaryHost: 'Priya Mehta',
    splitType: 'PERCENTAGE',
    splitValue: 20,
    totalEarnedRupees: 38400,
    payoutStatus: 'ACTIVE',
  },
];

export default function CoHostEarningsPage() {
  const [splits, setSplits] = useState<SplitRule[]>(MOCK_SPLITS);

  const totalEarned = splits.reduce((acc, s) => acc + s.totalEarnedRupees, 0);

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Financial Split Ledger</span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
          Co-Host Revenue Split Ledger & Payouts
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Automated revenue split calculations disburse your co-hosting commission directly to your verified bank account.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Split Earned</span>
            <Wallet className="w-4 h-4 text-[#0e4962]" />
          </div>
          <div className="text-3xl font-black text-neutral-900">₹{totalEarned.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-bold">100% Disbursed via Banking Gateway</div>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase">Active Split Agreements</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600">{splits.length} Properties</div>
          <div className="text-[11px] text-neutral-500 mt-1">Granular 18-permission contracts</div>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase">Linked Bank Account</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-black text-neutral-900 mt-1">HDFC Bank •••• 9021</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">IFSC: HDFC0000240</div>
        </div>
      </div>

      {/* Payout Rules Breakdown Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs space-y-4">
        <h2 className="text-base font-bold text-neutral-900 p-4 mb-0">Property Split Agreement Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Property & Primary Host</th>
                <th className="py-3.5 px-4">Split Agreement</th>
                <th className="py-3.5 px-4">Share Rate</th>
                <th className="py-3.5 px-4">Total Earned Split</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {splits.map((s) => (
                <tr key={s.id} className="hover:bg-[#edf4f7]/20 transition">
                  <td className="py-4 px-4 font-bold text-neutral-900">
                    <div>{s.property}</div>
                    <div className="text-[11px] text-neutral-500">Host: {s.primaryHost}</div>
                  </td>
                  <td className="py-4 px-4 font-mono uppercase text-purple-600">{s.splitType}</td>
                  <td className="py-4 px-4 font-bold text-[#0e4962]">{s.splitValue}% Share</td>
                  <td className="py-4 px-4 font-black text-emerald-600">₹{s.totalEarnedRupees.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.payoutStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
