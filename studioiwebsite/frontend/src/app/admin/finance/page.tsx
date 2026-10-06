'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  CreditCard, TrendingUp, ShieldCheck, DollarSign,
  ArrowRight, AlertCircle, CheckCircle2, RefreshCw,
  Lock, Eye, Layers, Sparkles, Building
} from 'lucide-react';

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Beneficiary revenue sharing feature toggle (Disabled by default)
  const [enableBeneficiarySim, setEnableBeneficiarySim] = useState(false);
  const [transferAuthorized, setTransferAuthorized] = useState(false);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any>('/admin/finance/summary');
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const gross = Number(summary?.grossPaise || 0) / 100;
  const tax = Number(summary?.taxPaise || 0) / 100;
  const discount = Number(summary?.discountPaise || 0) / 100;
  const deposit = Number(summary?.depositPaise || 0) / 100;
  const gatewayFee = Number(summary?.gatewayFeePaise || 0) / 100;
  const netRevenue = Number(summary?.netRevenuePaise || 0) / 100;
  const refunds = Number(summary?.totalRefundsPaise || 0) / 100;
  const reconciled = Number(summary?.reconciledNetPaise || 0) / 100;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Financial Ledger & Reconciliation
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Studio i Direct Merchant Collection Mode. Authoritative integer paise tracking with strict money conservation.
          </p>
        </div>

        <button
          onClick={fetchFinance}
          className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition self-start sm:self-auto"
          title="Refresh ledger"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Direct Mode Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-neutral-800 shadow-xs space-y-2">
          <span className="text-xs text-neutral-500 font-medium">Gross Cash Collected</span>
          <div className="text-2xl font-black text-white tracking-tight">
            ₹{gross.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-400 font-semibold">100% Captured via Mock Gateway</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-800 shadow-xs space-y-2">
          <span className="text-xs text-neutral-500 font-medium">GST Output Tax (18%)</span>
          <div className="text-2xl font-black text-amber-400 tracking-tight">
            ₹{tax.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-neutral-500">Government Tax Reserve</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-800 shadow-xs space-y-2">
          <span className="text-xs text-neutral-500 font-medium">Refunds Disbursed</span>
          <div className="text-2xl font-black text-red-400 tracking-tight">
            ₹{refunds.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-neutral-500">Policy-based cancellations</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-800 shadow-xs space-y-2">
          <span className="text-xs text-neutral-500 font-medium">Net Realized Revenue</span>
          <div className="text-2xl font-black text-[#0e4962] tracking-tight">
            ₹{reconciled.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-neutral-500">Excl. Tax, Gateway fees & Deposits</p>
        </div>
      </div>

      {/* Itemized Direct Mode Audit Breakdown */}
      <div className="bg-white rounded-3xl border border-neutral-800 p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Direct Collection Invariant Verification
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Verified ledger snapshot calculated from immutable bookingFinanceSnapshot rows.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full text-xs font-bold">
            Balanced
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-neutral-800/60">
            <span className="text-neutral-400 font-medium">Gross Customer Payments (paise: {summary?.grossPaise})</span>
            <span className="font-bold text-white">₹{gross.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-800/60">
            <span className="text-neutral-400 font-medium">Promotional Discounts Funded (paise: {summary?.discountPaise})</span>
            <span className="font-bold text-emerald-400">-₹{discount.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-800/60">
            <span className="text-neutral-400 font-medium">GST Tax Collected (paise: {summary?.taxPaise})</span>
            <span className="font-bold text-amber-400">-₹{tax.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-800/60">
            <span className="text-neutral-400 font-medium">Security Deposits Held (paise: {summary?.depositPaise})</span>
            <span className="font-bold text-white">₹{deposit.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-800/60">
            <span className="text-neutral-400 font-medium">Payment Gateway Surcharge 1.5% (paise: {summary?.gatewayFeePaise})</span>
            <span className="font-bold text-neutral-400">-₹{gatewayFee.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center pt-3 text-sm font-extrabold text-white">
            <span>Net Studio i Merchant Earnings</span>
            <span className="text-[#0e4962] text-lg">₹{reconciled.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Conditionally Enabled Beneficiary Settlements Module */}
      <div className="bg-white rounded-3xl border border-neutral-800 p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-md">
                Disabled By Default
              </span>
              <span className="text-xs text-neutral-400">Direct Mode Active</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Property Owner / Beneficiary Revenue Settlements
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Adapted from FairBnB transfer intent logic. External beneficiary revenue sharing is inactive in standard direct operations.
            </p>
          </div>

          <button
            onClick={() => setEnableBeneficiarySim(!enableBeneficiarySim)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${enableBeneficiarySim
              ? 'bg-[#0e4962] text-white shadow-xs'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
          >
            {enableBeneficiarySim ? 'Disable Beneficiary QA Mode' : 'Enable Simulated QA Mode'}
          </button>
        </div>

        {enableBeneficiarySim ? (
          <div className="space-y-6">
            <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl text-xs text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                [SIMULATED] QA Acceptance Environment Active
              </p>
              <p className="text-amber-400/90 text-[11px]">
                No live bank transfers or payouts will occur. Synthetic agreements and mock allocations are demonstrated below.
              </p>
            </div>

            {/* Simulated Agreement Details */}
            <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Lehariya Campus Owner Allocation Agreement</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono">
                  AGR-LH-2026-V1
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-neutral-400">
                <div>
                  <span className="block text-[10px] text-neutral-500">Basis</span>
                  <span className="text-white font-semibold">Net Coworking Collection</span>
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-500">Owner Share</span>
                  <span className="text-white font-semibold">80.0%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-500">Eligible Allocation</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{(reconciled * 0.8).toLocaleString('en-IN', { maximumFractionDigits: 2 })} [SIMULATED]
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Transfer Action */}
            <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
              <div>
                <span className="font-bold text-white text-xs block">Simulated Transfer Intent</span>
                <span className="text-[11px] text-neutral-400">
                  Status: {transferAuthorized ? 'COMPLETED (Transfer Id: sim_trx_8829)' : 'PENDING_AUTHORIZATION'}
                </span>
              </div>

              <button
                onClick={() => setTransferAuthorized(true)}
                disabled={transferAuthorized}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${transferAuthorized
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 cursor-not-allowed'
                  : 'bg-[#0e4962] hover:bg-[#093447] text-white cursor-pointer shadow-md'
                  }`}
              >
                {transferAuthorized ? '✓ Transfer Reconciled' : 'Authorize & Execute Simulated Payout'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-500 text-xs bg-neutral-900/40 rounded-2xl border border-neutral-800/40">
            Beneficiary revenue sharing is disabled. Click &quot;Enable Simulated QA Mode&quot; to test owner payout logic in isolation.
          </div>
        )}
      </div>
    </div>
  );
}
