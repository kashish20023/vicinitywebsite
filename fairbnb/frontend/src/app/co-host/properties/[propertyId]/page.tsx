'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { MapPin, Users, MessageSquare, Phone, Mail, Building2 } from 'lucide-react';
import { getAccessSentence, getPermissionGroups } from '@/lib/permissions/groupPermissions';

export default function CoHostOverviewPage() {
  const { propertyId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get<any>(`/co-host/properties/${propertyId}/dashboard`);
        setData(res);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propertyId]);

  if (loading) return <div className="p-8 text-neutral-400 font-medium">Loading workspace dashboard...</div>;
  if (!data) return <div className="p-8 text-rose-600 font-bold">Failed to load workspace dashboard data.</div>;

  const property = data.property;
  const grantedPermissions = data.grantedPermissions || [];
  const groups = getPermissionGroups(grantedPermissions);
  const sentence = getAccessSentence(grantedPermissions);
  const recentBookings: any[] = data.recentBookings || [];

  return (
    <div className="space-y-8 pb-12">
      {/* PROPERTY BANNER WITH PLAIN LANGUAGE ACCESS SENTENCE (RULE #3 & #6) */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-overline font-semibold uppercase tracking-widest rounded-full border border-amber-500/30">
              Co-Host Workspace
            </span>
          </div>
          <h1 className="text-h1 font-bold tracking-tight">{property.title}</h1>
          <p className="text-body text-neutral-300 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" /> {property.address}, {property.city}, {property.state}
          </p>
          {/* SINGLE LINE ACCESS SENTENCE */}
          <p className="text-body-sm text-amber-200 font-semibold pt-1">
            {sentence}
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
          <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400">Listing Status</span>
          <p className="text-h3 font-bold text-neutral-900">{property.verificationStatus}</p>
          <p className="text-caption text-neutral-500 font-medium">{property.category} ({property.propertyType})</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
          <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400">Nightly Rate</span>
          <p className="text-h3 font-bold font-tabular text-neutral-900">₹{property.basePrice?.toLocaleString('en-IN')}</p>
          <p className="text-caption text-neutral-500 font-medium">Base rate per night</p>
        </div>

        {groups.bookings && (
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400">Bookings Count</span>
            <p className="text-h3 font-bold font-tabular text-neutral-900">{data.totalBookingsCount ?? 0}</p>
            <p className="text-caption text-neutral-500 font-medium">Total property reservations</p>
          </div>
        )}

        {groups.operations && (
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400">Open Maintenance</span>
            <p className="text-h3 font-bold font-tabular text-amber-600">{data.pendingMaintenance?.length ?? 0}</p>
            <p className="text-caption text-neutral-500 font-medium">Pending work orders</p>
          </div>
        )}
      </div>

      {/* ENGAGED GUESTS & PROPERTY BOOKINGS SECTION (ONLY IF GUESTS OR BOOKINGS GROUP ACTIVE - RULE #2) */}
      {(groups.bookings || groups.guests) && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
            <div>
              <span className="text-overline font-semibold uppercase tracking-widest text-amber-600">
                Guest Management
              </span>
              <h3 className="text-h3 font-bold text-neutral-900 flex items-center gap-2 mt-0.5">
                <Users className="w-5 h-5 text-amber-600" /> Active Property Guests & Reservations
              </h3>
            </div>
            {groups.bookings && (
              <Link
                href={`/co-host/properties/${propertyId}/bookings`}
                className="text-button font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                View All Property Reservations →
              </Link>
            )}
          </div>

          {recentBookings.length === 0 ? (
            <div className="p-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-center space-y-2">
              <Users className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-body font-semibold text-neutral-900">No active guest reservations on file</p>
              <p className="text-caption text-neutral-500">
                When guests book this property, their details will display here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentBookings.map((b) => {
                const guest = b.guest;
                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold overflow-hidden border border-amber-200">
                          {guest?.avatarUrl ? (
                            <img src={guest.avatarUrl} alt={guest.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-body font-bold">
                              {guest?.name ? guest.name.charAt(0).toUpperCase() : 'G'}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900 text-body-sm">{guest?.name || 'Guest User'}</h4>
                          <p className="text-caption text-neutral-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-neutral-400" /> {guest?.email || 'N/A'}
                          </p>
                          {guest?.phone && (
                            <p className="text-caption text-neutral-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {guest.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-caption font-medium border border-emerald-200">
                        {b.status}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-neutral-200/80 grid grid-cols-2 gap-2 text-body-sm">
                      <div>
                        <span className="text-overline text-neutral-400 font-medium block">Check-In</span>
                        <span className="font-semibold text-neutral-800 text-body-sm">
                          {new Date(b.checkIn).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-overline text-neutral-400 font-medium block">Check-Out</span>
                        <span className="font-semibold text-neutral-800 text-body-sm">
                          {new Date(b.checkOut).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-overline text-neutral-400 font-medium block">Guests</span>
                        <span className="font-semibold text-neutral-800 text-body-sm">{b.guests} Guests</span>
                      </div>
                      <div>
                        <span className="text-overline text-neutral-400 font-medium block">Total Amount</span>
                        <span className="font-semibold font-tabular text-neutral-900 text-body">₹{b.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {groups.guests && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Link
                          href={`/co-host/properties/${propertyId}/messages`}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-button font-medium rounded-xl transition flex items-center gap-1 border border-amber-200"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message Guest
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
