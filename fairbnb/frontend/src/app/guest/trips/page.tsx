'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  Wifi,
  Key,
  Shield,
  FileText,
  Loader2,
  Compass,
  ArrowRight,
  Sparkles,
  Home,
  Star,
  MessageSquare,
} from 'lucide-react';

interface BookingItem {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  tripCategory: 'UPCOMING' | 'PAST' | 'CANCELLED';
  createdAt: string;
  review?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
  property: {
    id: string;
    title: string;
    locality?: string;
    city: string;
    state: string;
    country: string;
    address?: string;
    images: string[];
    host?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    };
  };
}

export default function GuestTripsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [locationRating, setLocationRating] = useState<number>(5);
  const [valueRating, setValueRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>('/bookings/my-trips');
      const list: BookingItem[] = Array.isArray(data)
        ? data
        : data?.trips
        ? [
            ...(data.trips.upcoming || []).map((t: any) => ({ ...t, tripCategory: 'UPCOMING' })),
            ...(data.trips.completed || []).map((t: any) => ({ ...t, tripCategory: 'PAST' })),
            ...(data.trips.cancelled || []).map((t: any) => ({ ...t, tripCategory: 'CANCELLED' })),
          ]
        : [];
      setBookings(list);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/guest/trips');
      return;
    }
    if (isAuthenticated) {
      fetchTrips();
    }
  }, [isAuthenticated, authLoading]);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${selectedBooking.id}/cancel`, {
        reason: cancelReason || 'Cancelled by guest',
      });
      setCancelModalOpen(false);
      setSelectedBooking(null);
      await fetchTrips();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    if (!reviewComment.trim()) {
      alert('Please enter your review feedback');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: selectedBooking.id,
        rating,
        cleanlinessRating,
        accuracyRating,
        locationRating,
        valueRating,
        comment: reviewComment.trim(),
      });
      setReviewModalOpen(false);
      setReviewComment('');
      setSelectedBooking(null);
      await fetchTrips();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    if (activeTab === 'PAST') return b.status !== 'CANCELLED' && b.tripCategory === 'PAST';
    return b.status !== 'CANCELLED' && b.tripCategory === 'UPCOMING';
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <AirbnbHeader />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h1 font-bold text-gray-900 tracking-tight">Trips</h1>
            <p className="text-body-sm text-gray-500 mt-1">Manage your reservations, check-in guides, and itineraries.</p>
          </div>

          <Link
            href="/"
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-button font-medium rounded-2xl transition shadow-sm cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Explore More Stays</span>
          </Link>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'UPCOMING'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming Stays</span>
          </button>

          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'PAST'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Past Trips</span>
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'CANCELLED'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Cancelled</span>
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="py-24 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-semibold">Loading your reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <Home className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No trips booked... yet!</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Time to dust off your bags and start planning your next vacation across India's top villas and getaways.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm transition shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Start Searching</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const inDate = new Date(booking.checkIn);
              const outDate = new Date(booking.checkOut);
              const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition grid grid-cols-1 md:grid-cols-12"
                >
                  {/* IMAGE & STATUS */}
                  <div className="md:col-span-4 relative bg-gray-100 min-h-[220px]">
                    <img
                      src={booking.property.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'}
                      alt={booking.property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-3 py-1 rounded-full text-overline font-semibold shadow-md tracking-wider uppercase ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-emerald-500 text-white'
                            : booking.status === 'PENDING'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        {booking.status === 'CONFIRMED'
                          ? 'Confirmed Stay'
                          : booking.status === 'PENDING'
                          ? 'Awaiting Host Approval'
                          : 'Cancelled'}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-overline font-semibold uppercase tracking-wider text-gray-500">
                            {booking.property.city}, {booking.property.country}
                          </p>
                          <Link
                            href={`/properties/${booking.property.id}`}
                            className="text-h4 font-semibold text-gray-900 hover:underline mt-0.5 block leading-tight"
                          >
                            {booking.property.title}
                          </Link>
                        </div>
                        <div className="text-right">
                          <span className="text-body-lg font-bold font-tabular text-gray-900">
                            ₹{booking.totalAmount?.toLocaleString('en-IN')}
                          </span>
                          <p className="text-caption text-emerald-600 font-semibold">Paid in full</p>
                        </div>
                      </div>

                      {/* DATES & GUEST ROW */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                        <div>
                          <p className="text-gray-500 font-medium">Check-in</p>
                          <p className="font-bold text-gray-900 mt-0.5">
                            {inDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Checkout</p>
                          <p className="font-bold text-gray-900 mt-0.5">
                            {outDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-gray-500 font-medium">Reservation</p>
                          <p className="font-bold text-gray-900 mt-0.5">
                            {nights} nights • {booking.guests} guests
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <span>Host: {booking.property.host?.name || 'FairBnB Host'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {booking.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setCheckinModalOpen(true);
                            }}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Check-in Guide</span>
                          </button>
                        )}

                        {/* REVIEW BUTTON */}
                        {booking.status === 'CONFIRMED' && (
                          booking.review ? (
                            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                              {booking.review.rating} ★ Reviewed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setReviewModalOpen(true);
                              }}
                              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>Write Review</span>
                            </button>
                          )
                        )}

                        <Link
                          href={`/properties/${booking.property.id}`}
                          className="px-4 py-2 border border-gray-300 hover:border-gray-900 text-gray-800 text-xs font-bold rounded-xl transition"
                        >
                          View Listing
                        </Link>

                        {booking.status !== 'CANCELLED' && booking.tripCategory === 'UPCOMING' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setCancelModalOpen(true);
                            }}
                            className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                          >
                            Cancel Stay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CHECK-IN INSTRUCTIONS MODAL */}
      {checkinModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Check-in Guide</h3>
                <p className="text-xs text-gray-500">{selectedBooking.property.title}</p>
              </div>
              <button
                onClick={() => setCheckinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                <p className="text-overline font-semibold uppercase tracking-wider text-gray-500">Property Address</p>
                <p className="font-semibold text-gray-900">{selectedBooking.property.address || `${selectedBooking.property.city}, ${selectedBooking.property.state}, ${selectedBooking.property.country}`}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                <p className="text-overline font-semibold uppercase tracking-wider text-gray-500">Key & Access Details</p>
                <p className="font-semibold text-gray-800">Smart Lock Code: <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-300 font-semibold font-tabular">2948#</span></p>
                <p className="text-gray-500 text-caption">Self check-in anytime after 3:00 PM.</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                <p className="text-overline font-semibold uppercase tracking-wider text-gray-500">High-Speed Wi-Fi</p>
                <p className="font-semibold text-gray-800">Network: <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-300 font-semibold">FairBnB-Guest-5G</span></p>
                <p className="font-semibold text-gray-800">Password: <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-300 font-semibold">oceanbreeze2026</span></p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <p className="text-overline font-semibold uppercase tracking-wider text-emerald-800">Host Contact</p>
                <p className="font-semibold text-emerald-900">{selectedBooking.property.host?.name || 'Property Host'}</p>
                <p className="text-caption font-tabular text-emerald-700">{selectedBooking.property.host?.phone || '+91 98765 43210'}</p>
              </div>
            </div>

            <button
              onClick={() => setCheckinModalOpen(false)}
              className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl text-xs hover:bg-black transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* LEAVE REVIEW MODAL */}
      {reviewModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">How was your stay?</h3>
                <p className="text-xs text-gray-500">{selectedBooking.property.title}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* OVERALL RATING */}
              <div className="text-center space-y-2 py-2">
                <p className="text-overline font-semibold uppercase text-gray-500 tracking-wider">Overall Rating</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORY RATINGS */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Cleanliness</label>
                  <select
                    value={cleanlinessRating}
                    onChange={(e) => setCleanlinessRating(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Accuracy</label>
                  <select
                    value={accuracyRating}
                    onChange={(e) => setAccuracyRating(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Location</label>
                  <select
                    value={locationRating}
                    onChange={(e) => setLocationRating(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Value</label>
                  <select
                    value={valueRating}
                    onChange={(e) => setValueRating(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* REVIEW COMMENT */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">Your Review</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience, host communication, and property highlights..."
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL STAY MODAL */}
      {cancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900">Cancel Reservation?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to cancel your stay at <strong>{selectedBooking.property.title}</strong>? Your refund will be processed in accordance with the host's cancellation policy.
            </p>

            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AirbnbFooter />
    </div>
  );
}
