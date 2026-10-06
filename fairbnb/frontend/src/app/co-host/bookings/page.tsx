'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ClipboardList, Users, MessageSquare, Phone, Mail, Building2, Loader2 } from 'lucide-react';

export default function CoHostGlobalBookingsPage() {
  const { isAuthenticated } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const data = await api.get<any[]>('/co-host/me/properties');
        setProperties(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated]);

  const allBookings = properties.flatMap((p) =>
    (p.property?.bookings || []).map((b: any) => ({
      ...b,
      propertyTitle: p.property?.title,
      hostName: p.hostUser?.name || 'Host',
    }))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-overline font-semibold uppercase tracking-wider text-rose-600">
            Co-Host Management
          </span>
          <h1 className="text-h2 font-bold text-neutral-900 tracking-tight flex items-center gap-2 mt-0.5">
            <ClipboardList className="w-6 h-6 text-rose-600" /> Bookings Across All Managed Properties
          </h1>
          <p className="text-body-sm text-neutral-500 mt-1">
            Engaged guest reservations across all host properties you co-host.
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-rose-50 text-rose-700 text-caption font-semibold rounded-full border border-rose-200 w-fit font-tabular">
          Total Reservations: {allBookings.length}
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
                  <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center text-rose-700 font-bold overflow-hidden border border-rose-200 flex-shrink-0">
                    {guest?.avatarUrl
                      ? <img src={guest.avatarUrl} alt={guest.name} className="w-full h-full object-cover" />
                      : <span className="text-caption font-bold">{guest?.name ? guest.name.charAt(0).toUpperCase() : 'G'}</span>}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-body-sm">{guest?.name || 'Guest User'}</p>
                    <p className="text-caption text-neutral-500 flex items-center gap-1"><Mail className="w-3 h-3 text-neutral-400" /> {guest?.email || 'N/A'}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: 'property',
            header: 'Property & Owner',
            render: (b) => (
              <div>
                <p className="font-semibold text-neutral-900 text-body-sm">{b.propertyTitle}</p>
                <p className="text-caption text-neutral-500">Host: {b.hostName}</p>
              </div>
            ),
          },
          {
            key: 'dates',
            header: 'Stay Dates',
            cellClassName: 'text-neutral-700 font-medium font-tabular',
            render: (b) => `${new Date(b.checkIn).toLocaleDateString()} — ${new Date(b.checkOut).toLocaleDateString()}`,
          },
          {
            key: 'guests',
            header: 'Guests',
            cellClassName: 'font-medium text-neutral-800',
            render: (b) => `${b.guests || 1} Guests`,
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
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-caption font-semibold border border-emerald-200">
                {b.status}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            alignRight: true,
            render: (b) => (
              <Link href="/co-host/messages" className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-button font-medium rounded-xl transition inline-flex items-center gap-1.5 border border-rose-200">
                <MessageSquare className="w-3.5 h-3.5" /> Message Guest
              </Link>
            ),
          },
        ] as Column<any>[]}
        data={allBookings}
        rowKey={(b) => b.id}
        loading={loading}
        loadingMessage="Loading bookings across properties..."
        emptyIcon={<Users className="w-12 h-12 text-neutral-300 mx-auto" />}
        emptyTitle="No Active Bookings"
        emptySubtitle="When guests book any of your co-hosted properties, their contact profiles, stay dates, and check-in status will automatically display here."
      />
    </div>
  );
}
