'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LogOut, LogIn, Users, Calendar, Clock, Sparkles, 
  MessageSquare, Key, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function HostTodayPage() {
  const [activeTab, setActiveTab] = useState<'CHECKINS' | 'CHECKOUTS' | 'STAYING'>('CHECKINS');

  const checkIns = [
    {
      id: 'CI-101',
      guestName: 'Ananya Verma',
      property: 'Lehariya KGK Realty — Private Cabin 402',
      arrivalTime: '2:00 PM',
      keycodeStatus: 'Sent via WhatsApp (Code: 8841)',
      phone: '+91 98290 11223',
    },
    {
      id: 'CI-102',
      guestName: 'Rohan Sharma',
      property: 'Horizon Tower — Executive Dedicated Desk #12',
      arrivalTime: '4:30 PM',
      keycodeStatus: 'Keycard Ready at Desk 10th Floor',
      phone: '+91 94140 33445',
    },
  ];

  const checkOuts = [
    {
      id: 'CO-201',
      guestName: 'Karan Patel',
      property: 'Rathore Bhawan Alwar — Event Space',
      checkoutTime: '11:00 AM',
      inspectionStatus: 'Pending Departure Checklist',
    },
  ];

  const currentlyStaying = [
    {
      id: 'ST-301',
      guestName: 'TechVentures Team (5 seats)',
      property: 'Lehariya KGK Realty — Team Suite B',
      checkOutDate: 'Sep 30, 2026',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Daily Host Operational Desk</span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Today Command Center
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Track live check-ins, departure inspection checklists, active stayers, and 24h pending booking approvals.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/host/listings/new"
            className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            + Add New Listing
          </Link>
          <Link
            href="/host/calendar"
            className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-2 transition border border-neutral-200"
          >
            <Calendar className="w-4 h-4 text-[#0e4962]" />
            Block Dates
          </Link>
        </div>
      </div>

      {/* Guest Movement Overview Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2.5 sm:gap-3 border-b border-neutral-200 pb-3 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('CHECKINS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'CHECKINS' ? 'bg-[#0e4962] text-white shadow-xs' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-[#edf4f7]/40'
            }`}
          >
            Checking In Today ({checkIns.length})
          </button>
          <button
            onClick={() => setActiveTab('CHECKOUTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'CHECKOUTS' ? 'bg-[#0e4962] text-white shadow-xs' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-[#edf4f7]/40'
            }`}
          >
            Checking Out Today ({checkOuts.length})
          </button>
          <button
            onClick={() => setActiveTab('STAYING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'STAYING' ? 'bg-[#0e4962] text-white shadow-xs' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-[#edf4f7]/40'
            }`}
          >
            Currently Staying ({currentlyStaying.length})
          </button>
        </div>

        {/* Tab Content Cards */}
        {activeTab === 'CHECKINS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkIns.map((ci) => (
              <div key={ci.id} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <LogIn className="w-3 h-3" /> Expected Arrival: {ci.arrivalTime}
                  </span>
                  <Link href="/host/messages" className="text-xs text-[#0e4962] hover:underline flex items-center gap-1 font-bold">
                    <MessageSquare className="w-3.5 h-3.5" /> Message Guest
                  </Link>
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900">{ci.guestName}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{ci.property}</p>
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#0e4962] shrink-0" />
                  <span>Access Key: {ci.keycodeStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'CHECKOUTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkOuts.map((co) => (
              <div key={co.id} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <LogOut className="w-3 h-3" /> Departure by: {co.checkoutTime}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900">{co.guestName}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{co.property}</p>
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Inspection: {co.inspectionStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'STAYING' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentlyStaying.map((cs) => (
              <div key={cs.id} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3" /> Staying until {cs.checkOutDate}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900">{cs.guestName}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{cs.property}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Reservations Queue */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Pending Reservation Requests</h2>
            <p className="text-xs text-neutral-500">Must be accepted or declined within 24 hours.</p>
          </div>
          <span className="px-2.5 py-1 bg-[#edf4f7] text-[#0e4962] text-[10px] font-bold rounded-full uppercase border border-[#adcada]">
            2 Actions Required
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-neutral-900 text-sm">Vikram Malhotra • 2 Guests</div>
              <div className="text-xs text-neutral-500 mt-0.5">Lehariya KGK Realty — Meeting Room A (3 Hours) • Total: ₹4,500</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3.5 py-2 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition cursor-pointer">
                Approve Booking
              </button>
              <button className="px-3.5 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-semibold rounded-xl transition cursor-pointer">
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
