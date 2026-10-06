'use client';

import React, { useState } from 'react';
import { 
  Wallet, TrendingUp, CreditCard, ArrowUpRight, 
  CheckCircle2, Building, RefreshCw, Download
} from 'lucide-react';

interface PayoutLog {
  id: string;
  amountRupees: number;
  bankAccount: string;
  status: 'SETTLED' | 'PROCESSING';
  date: string;
  txRef: string;
}

const MOCK_PAYOUTS: PayoutLog[] = [
  {
    id: 'PO-8801',
    amountRupees: 18742.50,
    bankAccount: 'HDFC Bank (•••• 9902)',
    status: 'SETTLED',
    date: '2026-09-23',
    txRef: 'BANK-990214',
  },
  {
    id: 'PO-8802',
    amountRupees: 58500.00,
    bankAccount: 'ICICI Bank (•••• 1928)',
    status: 'SETTLED',
    date: '2026-09-21',
    txRef: 'BANK-192841',
  },
];

export default function HostEarningsPage() {
  const [payouts, setPayouts] = useState<PayoutLog[]>(MOCK_PAYOUTS);

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Financial Governance</span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
          Host Earnings & Bank Payout Setup
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Direct settlement ledger tracking gross booking revenue, net host earnings, and co-host payout splits.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Total Net Earnings</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">₹485,000</div>
          <div className="text-[11px] text-neutral-500 mt-1">Direct booking ledger total</div>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Available Payout Balance</div>
          <div className="text-3xl font-black text-neutral-900 mt-1">₹34,500</div>
          <div className="text-[11px] text-[#0e4962] font-bold mt-1">Ready for transfer</div>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Co-Host Split Paid</div>
          <div className="text-3xl font-black text-purple-600 mt-1">₹72,750</div>
          <div className="text-[11px] text-neutral-500 mt-1">15% delegated share</div>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Primary Payout Method</div>
          <div className="text-sm font-bold text-neutral-900 mt-2">HDFC Bank •••• 9902</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">IFSC: HDFC0000102</div>
        </div>
      </div>

      {/* Payout Logs Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-neutral-900">Disbursement Transfer History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Payout ID</th>
                <th className="py-3.5 px-4">Amount Disbursed</th>
                <th className="py-3.5 px-4">Target Bank Account</th>
                <th className="py-3.5 px-4">Transaction Ref</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-[#edf4f7]/20 transition">
                  <td className="py-4 px-4 font-mono font-bold text-[#0e4962]">{p.id}</td>
                  <td className="py-4 px-4 font-black text-emerald-600">₹{p.amountRupees.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 font-bold text-neutral-900">{p.bankAccount}</td>
                  <td className="py-4 px-4 font-mono text-neutral-500">{p.txRef}</td>
                  <td className="py-4 px-4 text-neutral-500">{p.date}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
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
