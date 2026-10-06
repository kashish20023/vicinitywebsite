'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, Users, MessageSquare, CheckCircle2, Clock, 
  XCircle, Filter, Search, ArrowUpRight
} from 'lucide-react';

interface Booking {
  id: string;
  bookingRef: string;
  guestName: string;
  guestEmail: string;
  property: string;
  checkIn: string;
  checkOut: string;
  totalAmountRupees: number;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Pending Approval';
  paymentStatus: 'PAID' | 'REFUNDED' | 'HELD';
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    bookingRef: 'BK-77102',
    guestName: 'Ananya Verma',
    guestEmail: 'ananya.v@gmail.com',
    property: 'Lehariya KGK Realty — Private Cabin 402',
    checkIn: 'Sep 23, 2026',
    checkOut: 'Sep 28, 2026',
    totalAmountRupees: 24500,
    status: 'Upcoming',
    paymentStatus: 'PAID',
  },
  {
    id: 'bk-2',
    bookingRef: 'BK-77105',
    guestName: 'Vikram Singh',
    guestEmail: 'vikram.singh@tech.io',
    property: 'Horizon Tower — Executive Dedicated Desk #12',
    checkIn: 'Sep 25, 2026',
    checkOut: 'Oct 02, 2026',
    totalAmountRupees: 18000,
    status: 'Pending Approval',
    paymentStatus: 'HELD',
  },
  {
    id: 'bk-3',
    bookingRef: 'BK-77080',
    guestName: 'Rohan Joshi',
    guestEmail: 'rohan.j@yahoo.com',
    property: 'Lehariya KGK Realty — Meeting Room B',
    checkIn: 'Sep 20, 2026',
    checkOut: 'Sep 20, 2026',
    totalAmountRupees: 12000,
    status: 'Completed',
    paymentStatus: 'PAID',
  },
];

export default function HostBookingsManagerPage() {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState<string>('Upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookings = bookings.filter(b => 
    (activeTab === 'ALL' || b.status === activeTab) &&
    (b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     b.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
     b.property.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Reservation Management</span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Bookings & Guest Reservations Desk
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Monitor reservation flows, inspect stay dates, verify payouts, and respond to pending approval requests.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search booking ref or guest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#0e4962] shadow-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200">
        {['Upcoming', 'Pending Approval', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'bg-[#0e4962] text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-[#edf4f7]/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((b) => (
          <div key={b.id} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#0e4962] text-xs">{b.bookingRef}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                    b.status === 'Upcoming' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    b.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-neutral-900 mt-1">{b.guestName}</h3>
                <p className="text-xs text-neutral-500">{b.guestEmail} • {b.property}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Payout Amount</span>
                <span className="font-black text-[#0e4962] text-lg">₹{b.totalAmountRupees.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4 text-neutral-700">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0e4962]" />
                  <span>Check-In: <strong>{b.checkIn}</strong></span>
                </div>
                <span className="text-neutral-300">→</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0e4962]" />
                  <span>Check-Out: <strong>{b.checkOut}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/host/messages"
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#0e4962]" /> Contact Guest
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
