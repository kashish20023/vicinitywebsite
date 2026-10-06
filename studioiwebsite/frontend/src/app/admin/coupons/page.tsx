'use client';

import React, { useState } from 'react';
import { Tag, Plus, Check, X, Percent, DollarSign, Calendar, Sparkles } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderValue: number;
  maxRedemptions: number;
  currentRedemptions: number;
  expiryDate: string;
  isActive: boolean;
  applicableScope: 'ALL_PROPERTIES' | 'JAIPUR_ONLY' | 'ALWAR_ONLY';
}

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'CPN-101',
    code: 'STUDIOI2026',
    type: 'PERCENTAGE',
    value: 20,
    minOrderValue: 5000,
    maxRedemptions: 500,
    currentRedemptions: 142,
    expiryDate: '2026-12-31',
    isActive: true,
    applicableScope: 'ALL_PROPERTIES',
  },
  {
    id: 'CPN-102',
    code: 'HORIZONFIRST',
    type: 'FIXED_AMOUNT',
    value: 1500,
    minOrderValue: 8000,
    maxRedemptions: 200,
    currentRedemptions: 89,
    expiryDate: '2026-10-15',
    isActive: true,
    applicableScope: 'JAIPUR_ONLY',
  },
  {
    id: 'CPN-103',
    code: 'ALWARCOMMUNITY',
    type: 'PERCENTAGE',
    value: 15,
    minOrderValue: 3000,
    maxRedemptions: 100,
    currentRedemptions: 45,
    expiryDate: '2026-11-01',
    isActive: true,
    applicableScope: 'ALWAR_ONLY',
  },
];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [showModal, setShowModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [newValue, setNewValue] = useState(10);
  const [newMinOrder, setNewMinOrder] = useState(2000);
  const [newMaxRedemptions, setNewMaxRedemptions] = useState(100);

  const toggleCouponStatus = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    const created: Coupon = {
      id: `CPN-${Math.floor(100 + Math.random() * 900)}`,
      code: newCode.toUpperCase().trim(),
      type: newType,
      value: Number(newValue),
      minOrderValue: Number(newMinOrder),
      maxRedemptions: Number(newMaxRedemptions),
      currentRedemptions: 0,
      expiryDate: '2026-12-31',
      isActive: true,
      applicableScope: 'ALL_PROPERTIES',
    };
    setCoupons([created, ...coupons]);
    setShowModal(false);
    setNewCode('');
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2.5 py-1 rounded-full border border-[#adcada]">
            Promotional Campaigns
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Coupons & Discount Governance
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage platform promo codes, maximum redemption caps, and campus applicability.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon Code
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-extrabold text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-6">Promo Code</th>
                <th className="py-3.5 px-4">Discount Type</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Min Order</th>
                <th className="py-3.5 px-4">Redemptions</th>
                <th className="py-3.5 px-4">Scope</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#edf4f7]/20 transition">
                  <td className="py-4 px-6 font-mono font-black text-[#0e4962]">{c.code}</td>
                  <td className="py-4 px-4 font-bold text-neutral-900">{c.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount (₹)'}</td>
                  <td className="py-4 px-4 font-black text-neutral-900">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                  </td>
                  <td className="py-4 px-4">₹{c.minOrderValue.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 font-semibold text-neutral-600">
                    {c.currentRedemptions} / {c.maxRedemptions}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold rounded-md uppercase">
                      {c.applicableScope.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      c.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => toggleCouponStatus(c.id)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        c.isActive ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700' : 'bg-[#edf4f7] hover:bg-[#edf4f7] text-[#0e4962]'
                      }`}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateCoupon} className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962]">Coupon Generator</span>
              <h2 className="text-xl font-black text-neutral-900 mt-1">Create Promotional Code</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Coupon Code Name</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-mono uppercase font-bold focus:outline-none focus:border-[#0e4962]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Discount Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium focus:outline-none focus:border-[#0e4962]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold focus:outline-none focus:border-[#0e4962]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold focus:outline-none focus:border-[#0e4962]"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={newMaxRedemptions}
                    onChange={(e) => setNewMaxRedemptions(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold focus:outline-none focus:border-[#0e4962]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Publish Coupon Code
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
