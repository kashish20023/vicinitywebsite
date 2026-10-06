'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  ClipboardList, Search, RefreshCw, Loader2, Plus, 
  Calendar, CheckCircle2, XCircle, Clock, QrCode, X, Check
} from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual booking form state
  const [submitting, setSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({
    memberEmail: 'member@studioi.com',
    planType: 'DAY_PASS',
    unitId: 'a1010101-0001-4000-8000-000000000001',
    userNotes: 'VIP Executive desk reservation created by Admin',
  });

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/bookings');
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.bookings)
          ? res.bookings
          : Array.isArray(res?.data)
            ? res.data
            : [];
      setBookings(list);
    } catch (e) {
      console.error('Failed to load bookings', e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create exclusive hold
      const holdRes = await apiRequest('/bookings/hold', {
        method: 'POST',
        body: JSON.stringify({
          unitId: manualForm.unitId,
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        }),
      });

      // 2. Reserve
      const reserveRes = await apiRequest('/bookings/reserve', {
        method: 'POST',
        body: JSON.stringify({
          holdId: holdRes.holdId,
          planId: '328404a0-e222-446a-9fa5-e1fc8488e001',
          userNotes: manualForm.userNotes,
        }),
      });

      // 3. Confirm payment immediately
      if (reserveRes.paymentOrder?.id) {
        await apiRequest('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            orderId: reserveRes.paymentOrder.id,
            providerPaymentId: `manual_admin_${Date.now()}`,
          }),
        });
      }

      alert('Manual booking successfully created and confirmed!');
      setShowManualModal(false);
      loadBookings();
    } catch (err: any) {
      alert(`Failed to create manual booking: ${err.message || 'Error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = (Array.isArray(bookings) ? bookings : []).filter((b) => {
    const matchesSearch = 
      b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.unit?.name?.toLowerCase().includes(search.toLowerCase());
    
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && b.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0e4962]">
            Reservations Ledger
          </span>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Coworking Bookings & Passes
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time reservations stream across hot desks, cabins, and meeting rooms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Manual Booking</span>
          </button>
          <button
            onClick={loadBookings}
            className="p-2.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0e4962]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Booking ID, Member Name, Email, or Desk Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#0e4962]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CONFIRMED', 'PENDING_PAYMENT', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#0e4962] text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="border border-neutral-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-5">Booking Ref</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Inventory Unit</th>
                <th className="py-3 px-4">Plan & Schedule</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0e4962] mx-auto mb-2" />
                    Loading bookings ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[#edf4f7]/20 transition">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0e4962]">
                      {b.bookingNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900">{b.user?.name || 'Member'}</div>
                      <div className="text-[11px] text-neutral-400">{b.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-neutral-900">{b.unit?.name || 'Desk'}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{b.unit?.unitCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-700">{b.planType}</div>
                      <div className="text-[11px] text-neutral-400">
                        {new Date(b.startDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={b.status === 'CONFIRMED' ? 'success' : b.status === 'CANCELLED' ? 'error' : 'warning'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-neutral-900">
                      ₹{(Number(b.totalAmountPaise) / 100).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Booking Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-neutral-200 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900">Create Manual Reservation</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Admin-authorized desk booking allocation</p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Member Email</label>
                <input
                  type="email"
                  required
                  value={manualForm.memberEmail}
                  onChange={(e) => setManualForm({ ...manualForm, memberEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#0e4962]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Rental Plan</label>
                <select
                  value={manualForm.planType}
                  onChange={(e) => setManualForm({ ...manualForm, planType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#0e4962]"
                >
                  <option value="DAY_PASS">Day Pass (₹500 / day)</option>
                  <option value="HOURLY">Hourly Pass (₹100 / hr)</option>
                  <option value="MONTHLY">Dedicated Desk (Monthly)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={manualForm.userNotes}
                  onChange={(e) => setManualForm({ ...manualForm, userNotes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#0e4962]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Authorize Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
