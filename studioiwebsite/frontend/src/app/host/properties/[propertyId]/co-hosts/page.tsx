'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, UserPlus, Shield, CheckCircle2, ChevronDown, ChevronUp, 
  Percent, DollarSign, Copy, Check, Trash2, Edit3, X, Sparkles, Lock
} from 'lucide-react';

interface CoHost {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  packagePreset: 'FULL_ACCESS' | 'OPERATIONS' | 'CALENDAR_MESSAGING' | 'CUSTOM';
  permissions: string[];
  payoutRuleType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'CLEANING_FEE_PLUS_PERCENTAGE';
  payoutValue: number;
}

const ALL_18_PERMISSIONS = [
  // Property & Listing
  { code: 'VIEW_PROPERTY', label: 'View Property Details', category: 'Property & Listing' },
  { code: 'EDIT_LISTING', label: 'Edit Listing & Descriptions', category: 'Property & Listing' },
  // Calendar & Availability
  { code: 'VIEW_CALENDAR', label: 'View Property Calendar', category: 'Calendar & Availability' },
  { code: 'MANAGE_CALENDAR', label: 'Manage Calendar & Block Dates', category: 'Calendar & Availability' },
  // Bookings & Pricing
  { code: 'VIEW_BOOKINGS', label: 'View Guest Bookings', category: 'Bookings & Pricing' },
  { code: 'MANAGE_BOOKINGS', label: 'Approve & Manage Bookings', category: 'Bookings & Pricing' },
  { code: 'CANCEL_BOOKINGS', label: 'Cancel Guest Bookings', category: 'Bookings & Pricing' },
  { code: 'VIEW_PRICING', label: 'View Nightly Rates', category: 'Bookings & Pricing' },
  { code: 'MANAGE_PRICING', label: 'Modify Rates & Discounts', category: 'Bookings & Pricing' },
  // Guest Communication
  { code: 'VIEW_GUESTS', label: 'View Guest Profiles', category: 'Guest Communication' },
  { code: 'MESSAGE_GUESTS', label: 'Send Messages to Guests', category: 'Guest Communication' },
  { code: 'MANAGE_MAINTENANCE', label: 'Manage Maintenance', category: 'Guest Communication' },
  { code: 'MANAGE_CLEANING', label: 'Coordinate Cleaning', category: 'Guest Communication' },
  // Reviews & Marketing
  { code: 'VIEW_REVIEWS', label: 'View Guest Reviews', category: 'Reviews & Marketing' },
  { code: 'RESPOND_TO_REVIEWS', label: 'Respond to Guest Reviews', category: 'Reviews & Marketing' },
  { code: 'MANAGE_COUPONS', label: 'Manage Property Coupons', category: 'Reviews & Marketing' },
  // Team Governance
  { code: 'VIEW_COHOSTS', label: 'View Property Co-Hosts', category: 'Team Governance' },
  { code: 'MANAGE_COHOSTS', label: 'Manage Co-Hosts', category: 'Team Governance' },
];

const MOCK_COHOSTS: CoHost[] = [
  {
    id: 'ch-01',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@gmail.com',
    phone: '+91 98290 88776',
    status: 'ACTIVE',
    packagePreset: 'OPERATIONS',
    permissions: ['VIEW_PROPERTY', 'VIEW_CALENDAR', 'MANAGE_CALENDAR', 'VIEW_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE', 'MANAGE_CLEANING'],
    payoutRuleType: 'PERCENTAGE',
    payoutValue: 15,
  },
  {
    id: 'ch-02',
    name: 'Neha Gupta',
    email: 'neha.gupta@studioi.com',
    phone: '+91 94140 11223',
    status: 'ACTIVE',
    packagePreset: 'FULL_ACCESS',
    permissions: ALL_18_PERMISSIONS.map(p => p.code),
    payoutRuleType: 'PERCENTAGE',
    payoutValue: 20,
  }
];

export default function PropertyCoHostsPage() {
  const [coHosts, setCoHosts] = useState<CoHost[]>(MOCK_COHOSTS);
  const [expandedCoHostId, setExpandedCoHostId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['VIEW_PROPERTY', 'VIEW_CALENDAR', 'MESSAGE_GUESTS']);
  const [payoutType, setPayoutType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [payoutVal, setPayoutVal] = useState(10);
  const [copiedToken, setCopiedToken] = useState(false);

  const togglePermission = (code: string) => {
    setSelectedPermissions(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const newCoHost: CoHost = {
      id: `ch-${Math.floor(100 + Math.random() * 900)}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      phone: '+91 98000 00000',
      status: 'PENDING',
      packagePreset: 'CUSTOM',
      permissions: selectedPermissions,
      payoutRuleType: payoutType,
      payoutValue: payoutVal,
    };
    setCoHosts([...coHosts, newCoHost]);
    setShowInviteModal(false);
    setInviteEmail('');
  };

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Granular RBAC Governance</span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Property Co-Host Governance & Revenue Splits
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Delegate operational access using 18 granular permission flags and automated payout splits.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Invite New Co-Host
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Total Team Members</div>
          <div className="text-2xl font-black text-neutral-900 mt-1">{coHosts.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Active Operators</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {coHosts.filter(c => c.status === 'ACTIVE').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Pending Invites</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {coHosts.filter(c => c.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="text-xs font-bold text-neutral-400 uppercase">Revenue Splits Active</div>
          <div className="text-2xl font-black text-[#0e4962] mt-1">100% Configured</div>
        </div>
      </div>

      {/* Co-Host Cards List */}
      <div className="space-y-4">
        {coHosts.map((ch) => {
          const isExpanded = expandedCoHostId === ch.id;
          return (
            <div key={ch.id} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-[#0e4962] to-[#1a6585] flex items-center justify-center font-black text-white text-base shadow-xs">
                    {ch.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-neutral-900">{ch.name}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                        ch.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ch.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">{ch.email} • {ch.phone}</div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block">Payout Share Split</span>
                  <span className="font-black text-[#0e4962] text-sm">
                    {ch.payoutValue}% {ch.payoutRuleType}
                  </span>
                </div>
              </div>

              {/* Granted Permissions Pills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Granted Permissions ({ch.permissions.length} of 18)
                  </span>
                  <button
                    onClick={() => setExpandedCoHostId(isExpanded ? null : ch.id)}
                    className="text-xs text-[#0e4962] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? 'Collapse Matrix' : '+ Inspect All 18 Flags'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ch.permissions.slice(0, 6).map((code) => {
                    const item = ALL_18_PERMISSIONS.find(p => p.code === code);
                    return (
                      <span key={code} className="px-2.5 py-1 bg-[#edf4f7] border border-[#adcada]/50 text-[#0e4962] text-[10px] font-bold rounded-lg">
                        ✓ {item?.label || code}
                      </span>
                    );
                  })}
                  {ch.permissions.length > 6 && !isExpanded && (
                    <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-bold rounded-lg border border-neutral-200">
                      +{ch.permissions.length - 6} More Granted
                    </span>
                  )}
                </div>
              </div>

              {/* Full 18 Permission Inspect Drawer */}
              {isExpanded && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4">
                  <span className="text-xs font-bold text-neutral-900 block">Full 18-Permission Granular Matrix</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {ALL_18_PERMISSIONS.map((item) => {
                      const isGranted = ch.permissions.includes(item.code);
                      return (
                        <div key={item.code} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isGranted ? 'bg-white border-[#0e4962]/40 text-neutral-900 font-bold shadow-2xs' : 'bg-neutral-100/60 border-neutral-200 text-neutral-400'
                        }`}>
                          <span className="text-[11px]">{item.label}</span>
                          <span className={isGranted ? 'text-[#0e4962]' : 'text-neutral-400'}>{isGranted ? 'Granted' : 'Locked'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Co-Host Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleInviteSubmit} className="bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962]">Permission & Split Builder</span>
              <h2 className="text-xl font-black text-neutral-900 mt-1">Invite Co-Host to Workspace</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Co-Host Email Address</label>
                <input
                  type="email"
                  placeholder="cohost@domain.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
                  required
                />
              </div>

              {/* 18 Permission Selector Matrix */}
              <div>
                <span className="font-bold text-neutral-700 block mb-2">Configure 18 Permission Flags</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {ALL_18_PERMISSIONS.map((item) => {
                    const isChecked = selectedPermissions.includes(item.code);
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => togglePermission(item.code)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                          isChecked ? 'bg-[#edf4f7]/60 border-[#0e4962] text-neutral-900 font-bold' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                        }`}
                      >
                        <span className="text-[11px]">{item.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#0e4962] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payout Rule Builder */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Payout Split Type</label>
                  <select
                    value={payoutType}
                    onChange={(e: any) => setPayoutType(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
                  >
                    <option value="PERCENTAGE">Percentage Share (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Split Value</label>
                  <input
                    type="number"
                    value={payoutVal}
                    onChange={(e) => setPayoutVal(Number(e.target.value))}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:border-[#0e4962] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Send Co-Host Invitation
              </button>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition border border-neutral-200 cursor-pointer"
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
