'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ClipboardList, Users, MessageSquare, Phone, Mail, Calendar, ShieldAlert, Loader2 } from 'lucide-react';

export default function CoHostBookingsPage() {
  const { propertyId } = useParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await api.get<any[]>(`/co-host/properties/${propertyId}/bookings`);
        setBookings(res);
      } catch (err: any) {
        setError(err.message || 'Access denied: Requires VIEW_BOOKINGS permission.');
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-3" />
        <p className="text-sm font-medium text-neutral-500">Loading guest reservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-2 max-w-md mx-auto my-8">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <p className="font-bold text-rose-900 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-overline font-semibold uppercase tracking-wider text-amber-600">
            Property Reservations
          </span>
          <h2 className="text-h2 font-bold text-neutral-900 tracking-tight flex items-center gap-2 mt-0.5">
            <ClipboardList className="w-6 h-6 text-amber-600" /> Engaged Guests & Booking Directory
          </h2>
          <p className="text-body-sm text-neutral-500 mt-1">
            Viewing real-time reservations for property listing ID <code className="font-mono">{propertyId}</code>.
          </p>
        </div>

        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-caption font-semibold rounded-full border border-emerald-200 w-fit font-tabular">
          Access Granted: VIEW_BOOKINGS ({bookings.length} Bookings)
        </span>
      </div>

      <DataTable<any>
        className="rounded-3xl"
        columns={[
          {
            key: 'guest',
            header: 'Engaged Guest',
            render: (b) => {
              const guest = b.guest;
              return (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold overflow-hidden border border-amber-200 flex-shrink-0">
                    {guest?.avatarUrl
                      ? <img src={guest.avatarUrl} alt={guest.name} className="w-full h-full object-cover" />
                      : <span className="text-caption font-bold">{guest?.name ? guest.name.charAt(0).toUpperCase() : 'G'}</span>}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-body-sm">{guest?.name || 'Guest User'}</p>
                    <p className="text-caption text-neutral-500 flex items-center gap-1 font-medium"><Mail className="w-3 h-3 text-neutral-400" /> {guest?.email || 'N/A'}</p>
                    {guest?.phone && <p className="text-caption text-neutral-500 font-mono flex items-center gap-1"><Phone className="w-3 h-3" /> {guest.phone}</p>}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'dates',
            header: 'Stay Dates',
            render: (b) => (
              <div className="space-y-0.5">
                <p className="font-semibold text-neutral-900 font-tabular">{new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}</p>
                <p className="text-caption text-neutral-500 font-tabular">{b.nights || 1} Nights</p>
              </div>
            ),
          },
          {
            key: 'guests',
            header: 'Guests',
            cellClassName: 'font-medium text-neutral-800 text-caption font-tabular',
            render: (b) => `${b.guests} Guests`,
          },
          {
            key: 'amount',
            header: 'Total Amount',
            cellClassName: 'font-bold text-neutral-900 font-tabular text-body-sm',
            render: (b) => `₹${b.totalAmount?.toLocaleString('en-IN')}`,
          },
          {
            key: 'status',
            header: 'Status',
            render: (b) => (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-caption font-semibold border border-emerald-200">{b.status}</span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            alignRight: true,
            render: (b) => (
              <Link href={`/co-host/properties/${propertyId}/messages`} className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 border border-amber-200">
                <MessageSquare className="w-3.5 h-3.5" /> Message Guest
              </Link>
            ),
          },
        ] as Column<any>[]}
        data={bookings}
        rowKey={(b) => b.id}
        loading={false}
        emptyIcon={<Users className="w-12 h-12 text-neutral-300 mx-auto" />}
        emptyTitle="No Guest Reservations Yet"
        emptySubtitle="When guests confirm bookings for this property, their contact profiles, stay dates, and check-in details will display here."
      />
    </div>
  );
}
