'use client';

import React, { useState } from 'react';
import { 
  DollarSign, RefreshCw, CheckCircle2, AlertTriangle, 
  ChevronRight, Filter, Download, ArrowUpRight, ShieldCheck, Eye, X
} from 'lucide-react';

interface Settlement {
  id: string;
  bookingRef: string;
  property: string;
  host: string;
  coHost: string;
  guest: string;
  grossAmount: number;
  platformFee: number; // 10%
  hostPayout: number;
  coHostSplit: number;
  gstAmount: number;
  status: 'READY' | 'HELD' | 'PROCESSING' | 'SETTLED' | 'PARTIALLY_SETTLED' | 'CANCELLED';
  bankTxRef?: string;
  holdReason?: string;
  date: string;
}

const MOCK_SETTLEMENTS: Settlement[] = [
  {
    id: 'SET-9041',
    bookingRef: 'BK-77102',
    property: 'Lehariya KGK Realty — Private Cabin 402',
    host: 'Shyam Media Group',
    coHost: 'Rajesh Sharma (15% Split)',
    guest: 'Ananya Verma',
    grossAmount: 24500,
    platformFee: 2450,
    hostPayout: 18742.5,
    coHostSplit: 3307.5,
    gstAmount: 441,
    status: 'READY',
    bankTxRef: 'HDFC9902148102',
    date: '2026-09-23',
  },
  {
    id: 'SET-9042',
    bookingRef: 'BK-77105',
    property: 'Horizon Tower — Executive Dedicated Desk #12',
    host: 'Priya Mehta',
    coHost: 'Karan Patel (10% Split)',
    guest: 'Vikram Singh',
    grossAmount: 18000,
    platformFee: 1800,
    hostPayout: 14580,
    coHostSplit: 1620,
    gstAmount: 324,
    status: 'HELD',
    holdReason: 'KYC Document Verification Pending for Host',
    date: '2026-09-22',
  },
  {
    id: 'SET-9043',
    bookingRef: 'BK-77098',
    property: 'Rathore Bhawan Alwar — Event Space Center',
    host: 'Shyam Media Group',
    coHost: 'None (Direct Payout)',
    guest: 'TechVentures Pvt Ltd',
    grossAmount: 65000,
    platformFee: 6500,
    hostPayout: 58500,
    coHostSplit: 0,
    gstAmount: 1170,
    status: 'SETTLED',
    bankTxRef: 'ICIC0001928419',
    date: '2026-09-21',
  },
  {
    id: 'SET-9044',
    bookingRef: 'BK-77080',
    property: 'Lehariya KGK Realty — Meeting Room B',
    host: 'Suresh Kumar',
    coHost: 'Neha Gupta (20% Split)',
    guest: 'Rohan Joshi',
    grossAmount: 12000,
    platformFee: 1200,
    hostPayout: 8640,
    coHostSplit: 2160,
    gstAmount: 216,
    status: 'PROCESSING',
    date: '2026-09-23',
  },
];

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>(MOCK_SETTLEMENTS);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = ['ALL', 'READY', 'HELD', 'PROCESSING', 'SETTLED', 'PARTIALLY_SETTLED', 'CANCELLED'];

  const filteredSettlements = settlements.filter(s => activeTab === 'ALL' || s.status === activeTab);

  const handleExecuteTransfer = (id: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'SETTLED', bankTxRef: `BANK-${Math.floor(100000 + Math.random() * 900000)}` } : s));
      if (selectedSettlement?.id === id) {
        setSelectedSettlement(prev => prev ? { ...prev, status: 'SETTLED', bankTxRef: `BANK-${Math.floor(100000 + Math.random() * 900000)}` } : null);
      }
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2.5 py-1 rounded-full border border-[#adcada]">
            Fairbnb Financial Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Payout Settlement Engine
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Deterministic split calculations, eligibility state machine evaluation, and bank transfer execution.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setSettlements([...MOCK_SETTLEMENTS])}
            className="px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-[#0e4962]" />
            Re-Evaluate Splits
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Gross Booking Volume</div>
          <div className="text-2xl font-black text-neutral-900 mt-1">
            ₹{settlements.reduce((acc, s) => acc + s.grossAmount, 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Direct booking ledger total</div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Platform Revenue (10%)</div>
          <div className="text-2xl font-black text-[#0e4962] mt-1">
            ₹{settlements.reduce((acc, s) => acc + s.platformFee, 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Net Studio i Service Fee</div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Host Direct Disbursements</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{settlements.reduce((acc, s) => acc + s.hostPayout, 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Primary owner net share</div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Co-Host Split Allocations</div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            ₹{settlements.reduce((acc, s) => acc + s.coHostSplit, 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">18-permission delegated splits</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'bg-[#0e4962] text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-[#edf4f7]/50 hover:text-[#0e4962]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Settlement Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-extrabold text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-6">Settlement ID</th>
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Property & Host</th>
                <th className="py-3.5 px-4">Co-Host Split</th>
                <th className="py-3.5 px-4">Gross Vol</th>
                <th className="py-3.5 px-4">Platform Fee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSettlements.map((s) => (
                <tr key={s.id} className="hover:bg-[#edf4f7]/20 transition">
                  <td className="py-4 px-6 font-mono font-bold text-[#0e4962]">{s.id}</td>
                  <td className="py-4 px-4 font-mono font-semibold text-neutral-900">{s.bookingRef}</td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-neutral-900 truncate max-w-xs">{s.property}</div>
                    <div className="text-[11px] text-neutral-400">Host: {s.host}</div>
                  </td>
                  <td className="py-4 px-4 font-medium text-purple-700">{s.coHost}</td>
                  <td className="py-4 px-4 font-bold text-neutral-900">₹{s.grossAmount.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 font-bold text-[#0e4962]">₹{s.platformFee.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                      s.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      s.status === 'READY' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      s.status === 'HELD' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedSettlement(s)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0e4962]" /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Drawer Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedSettlement(null)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2 py-0.5 rounded-md border border-[#adcada]">
                Settlement Inspection #{selectedSettlement.id}
              </span>
              <h2 className="text-xl font-black text-neutral-900 mt-2">{selectedSettlement.property}</h2>
              <p className="text-xs text-neutral-500">Booking Ref: {selectedSettlement.bookingRef} • Guest: {selectedSettlement.guest}</p>
            </div>

            {/* Split Allocations Breakdown */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-200 font-bold text-neutral-900">
                <span>Gross Booking Total</span>
                <span>₹{selectedSettlement.grossAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-neutral-600">
                <span>Platform Service Fee (10%)</span>
                <span className="font-bold text-[#0e4962]"> - ₹{selectedSettlement.platformFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-neutral-600">
                <span>Co-Host Revenue Split Allocation</span>
                <span className="font-bold text-purple-700"> - ₹{selectedSettlement.coHostSplit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-neutral-600">
                <span>GST Tax Obligation</span>
                <span> - ₹{selectedSettlement.gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-neutral-200 font-black text-sm text-emerald-700">
                <span>Net Primary Host Disbursement</span>
                <span>₹{selectedSettlement.hostPayout.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {selectedSettlement.holdReason && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Hold Reason: {selectedSettlement.holdReason}</span>
              </div>
            )}

            {selectedSettlement.bankTxRef && (
              <div className="text-xs text-neutral-500">
                Banking Gateway Reference: <span className="font-mono font-bold text-neutral-900">{selectedSettlement.bankTxRef}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {selectedSettlement.status !== 'SETTLED' && (
                <button
                  onClick={() => handleExecuteTransfer(selectedSettlement.id)}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Disbursement...' : 'Execute Transfers via Banking Gateway'}
                </button>
              )}
              <button
                onClick={() => setSelectedSettlement(null)}
                className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
