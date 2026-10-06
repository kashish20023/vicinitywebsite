'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiRequest, getStoredUser } from '@/lib/api';
import { 
  Calendar, MapPin, QrCode, Clock, AlertCircle, 
  CheckCircle2, ArrowRight, XCircle, RefreshCw,
  Building, ShieldAlert, Sparkles, Filter
} from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel Modal State
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Change of schedule');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState<any | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      if (!user) {
        setError('Please sign in to view your coworking reservations.');
        setLoading(false);
        return;
      }

      const data = await apiRequest<any[]>('/bookings/my');
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role === 'HOST') {
      window.location.href = '/host';
      return;
    }
    if (user?.role === 'COHOST') {
      window.location.href = '/co-host';
      return;
    }
    if (user?.role === 'ADMIN') {
      window.location.href = '/admin';
      return;
    }
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    try {
      setCancelLoading(true);
      const res = await apiRequest<any>(`/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      setCancelResult(res);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CONFIRMED') return b.status === 'CONFIRMED';
    if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0e4962] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Member Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              My Coworking Reservations
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage your upcoming visits, access digital entry passes, or request schedule cancellations.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-full shadow-xs hover:shadow-md transition self-start sm:self-auto"
          >
            Book Another Space
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          {[
            { label: 'All Bookings', value: 'ALL' },
            { label: 'Active & Confirmed', value: 'CONFIRMED' },
            { label: 'Cancelled / Refunded', value: 'CANCELLED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-full transition ${
                statusFilter === tab.value
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 animate-pulse h-40"></div>
            ))}
          </div>
        )}

        {/* Error / Not signed in state */}
        {!loading && error && (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center max-w-md mx-auto">
            <div className="w-14 h-14 bg-[#edf4f7] text-[#0e4962] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Sign in to view bookings</h3>
            <p className="text-xs text-gray-500 mt-1 mb-6">{error}</p>
            <button
              onClick={() => {
                const btn = document.getElementById('navbar-auth-btn');
                if (btn) btn.click();
              }}
              className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full"
            >
              Log in with Studio i Account
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center max-w-md mx-auto">
            <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No reservations found</h3>
            <p className="text-xs text-gray-500 mt-1 mb-6">
              You do not have any {statusFilter.toLowerCase()} coworking bookings yet.
            </p>
            <Link
              href="/explore"
              className="px-6 py-2.5 bg-[#0e4962] text-white text-xs font-bold rounded-full hover:bg-[#093447] transition"
            >
              Explore Studio i Campuses
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const primaryItem = b.bookingItems?.[0];
              const unit = primaryItem?.unit;
              const isConfirmed = b.status === 'CONFIRMED';
              const isCancelled = b.status === 'CANCELLED';

              return (
                <div
                  key={b.id}
                  className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                        {b.bookingNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCancelled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {b.plan?.title || 'Coworking Plan'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{b.workspace?.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0e4962] shrink-0" />
                        <span>{b.workspace?.address}, {b.workspace?.city}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div>
                        <span className="text-gray-400 block font-medium">Unit:</span>
                        <span className="font-bold text-gray-900">
                          {unit?.unitCode || 'LH-01'} ({unit?.unitType?.replace('_', ' ') || 'Hot Desk'})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Schedule:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(b.startDateTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Amount Paid:</span>
                        <span className="font-extrabold text-gray-900">
                          ₹{(Number(b.totalAmountPaise) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end">
                    {isConfirmed && (
                      <>
                        <Link
                          href={`/bookings/${b.id}/pass`}
                          className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                        >
                          <QrCode className="w-4 h-4 text-[#0e4962]" />
                          Digital Pass & QR
                        </Link>

                        <button
                          onClick={() => {
                            setCancellingBooking(b);
                            setCancelResult(null);
                          }}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl transition"
                        >
                          Cancel Booking
                        </button>
                      </>
                    )}

                    {isCancelled && (
                      <div className="text-right">
                        <span className="text-xs text-red-600 font-semibold block">Booking Cancelled</span>
                        <span className="text-[11px] text-gray-400 block">Refund processed to source</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Modal */}
        {cancellingBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  Cancel Reservation
                </h3>
                <button
                  onClick={() => setCancellingBooking(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {!cancelResult ? (
                <>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
                    <p className="font-bold">Cancellation & Refund Policy:</p>
                    <ul className="list-disc pl-4 space-y-1 text-amber-800">
                      <li>More than 24 hours prior: <strong>100% refund</strong></li>
                      <li>12 to 24 hours prior: <strong>50% refund</strong></li>
                      <li>Less than 12 hours prior: <strong>0% non-refundable</strong></li>
                      <li>Security deposits are always refunded 100%.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Reason for Cancellation</label>
                    <textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCancellingBooking(null)}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                    >
                      Keep Reservation
                    </button>
                    <button
                      onClick={handleCancelBooking}
                      disabled={cancelLoading}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Cancellation Confirmed</h4>
                  <p className="text-xs text-gray-600">
                    Policy applied: <strong>{cancelResult.refundPercent}% refund</strong>.<br />
                    Amount Refunded:{' '}
                    <strong>₹{(Number(cancelResult.refundAmountPaise) / 100).toLocaleString('en-IN')}</strong>
                  </p>
                  <button
                    onClick={() => setCancellingBooking(null)}
                    className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
