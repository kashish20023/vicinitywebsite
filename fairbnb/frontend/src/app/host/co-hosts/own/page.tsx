'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import {
  UserCheck,
  Building2,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Mail,
  MapPin,
  Loader2,
  Calendar,
  ClipboardList,
  MessageSquare,
  Users,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface CoHostListingItem {
  relationshipId: string;
  permissionLevel: string;
  permissions: string[];
  payoutRule?: {
    percentage?: number;
    fixedAmount?: number;
  } | null;
  hostUser?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  property: {
    id: string;
    title: string;
    city: string;
    locality?: string;
    coverImage?: string;
    images?: string[];
    basePrice?: number;
  };
}

const PERMISSION_LABELS: Record<string, string> = {
  VIEW_PROPERTY: 'View Property',
  EDIT_LISTING: 'Edit Listing',
  VIEW_CALENDAR: 'View Calendar',
  MANAGE_CALENDAR: 'Manage Calendar',
  VIEW_BOOKINGS: 'View Bookings',
  MANAGE_BOOKINGS: 'Manage Bookings',
  CANCEL_BOOKINGS: 'Cancel Bookings',
  VIEW_GUESTS: 'View Guests',
  MESSAGE_GUESTS: 'Guest Messaging',
  VIEW_PRICING: 'View Pricing',
  MANAGE_PRICING: 'Manage Pricing',
  MANAGE_MAINTENANCE: 'Maintenance',
  MANAGE_CLEANING: 'Housekeeping',
  VIEW_REVIEWS: 'View Reviews',
  RESPOND_TO_REVIEWS: 'Respond to Reviews',
  MANAGE_COUPONS: 'Manage Coupons',
  VIEW_COHOSTS: 'View Co-hosts',
  MANAGE_COHOSTS: 'Manage Co-hosts',
  VIEW_EARNINGS: 'View Earnings',
  VIEW_PAYOUTS: 'View Payouts',
  MANAGE_PAYOUT_SETTINGS: 'Payout Settings',
};

export default function OwnCoHostsPage() {
  const { isAuthenticated } = useAuth();
  const [coHostingListings, setCoHostingListings] = useState<CoHostListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any>('/co-host/me/properties');
      // Backend returns either array directly or { items: [...] }
      const items = Array.isArray(data) ? data : data?.items || [];
      setCoHostingListings(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load co-hosted properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProperties();
    }
  }, [isAuthenticated]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-16 space-y-8">
      {/* 1. TOP HEADER WITH BRAND BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 pt-1">
            <span className="px-3.5 py-1 rounded-full text-overline font-semibold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/80 inline-flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-600" />
              Own's Co-host (Delegated Workspace)
            </span>
          </div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight pt-1">
            Listings I Am Co-Hosting
          </h1>
          <p className="text-body-sm text-neutral-500 font-normal">
            Properties owned by primary hosts where you have been delegated co-hosting management responsibilities.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Link
            href="/host/invites"
            className="px-4 py-2.5 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-800 font-medium text-button rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-neutral-600" />
            <span>Invite Co-hosts</span>
          </Link>
          {/* <Link
            href="/co-host"
            className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white font-medium text-button rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <span>Open Co-Host Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link> */}
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-overline font-semibold uppercase tracking-wider">Properties I Co-Host</span>
            <Building2 className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-h2 font-bold font-tabular text-neutral-900 mt-1">
            {loading ? '...' : coHostingListings.length}
          </p>
          <span className="text-caption text-neutral-500 font-medium">Assigned by Primary Hosts</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-overline font-semibold uppercase tracking-wider">Active Delegations</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-h2 font-bold font-tabular text-emerald-700 mt-1">
            {loading ? '...' : coHostingListings.filter((i) => i.payoutRule).length} with Payout
          </p>
          <span className="text-caption text-neutral-500 font-medium">Configured profit/revenue shares</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-overline font-semibold uppercase tracking-wider">Co-Host Role</span>
            <ShieldCheck className="w-4 h-4 text-[#0e4962]" />
          </div>
          <p className="text-h3 font-bold text-neutral-900 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active Co-Host
          </p>
          <span className="text-caption text-neutral-500 font-medium">Verified by Fairbnb security guard</span>
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-3" />
          <p className="text-sm font-medium text-neutral-500">Loading your co-hosted properties...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-base">Unable to Access Co-Hosted Properties</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        </div>
      ) : coHostingListings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-600 mx-auto">
            <UserCheck className="w-8 h-8 text-neutral-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">No Co-Hosted Properties Yet</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              You haven't been assigned as a co-host for any external properties yet. When another host sends you an invitation and you accept it, their listing will appear here.
            </p>
          </div>
          {/* <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/host/invites"
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
            >
              Check Sent Invitations
            </Link>
          </div> */}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Active Delegations ({coHostingListings.length})</h3>
              <p className="text-body-sm text-neutral-500 font-medium">
                Manage calendars, bookings, messages, and co-hosts for properties you co-host.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coHostingListings.map((item) => {
              const coverImg =
                item.property.coverImage ||
                (item.property.images && item.property.images[0]) ||
                'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80';
              const canManageCalendar =
                item.permissions.includes('MANAGE_CALENDAR') || item.permissions.includes('VIEW_CALENDAR');
              const canManageBookings =
                item.permissions.includes('MANAGE_BOOKINGS') || item.permissions.includes('VIEW_BOOKINGS');
              const canMessageGuests = item.permissions.includes('MESSAGE_GUESTS');

              return (
                <div
                  key={item.relationshipId}
                  className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:border-neutral-300 transition group"
                >
                  <div>
                    {/* Cover Image & Primary Host Badge Overlay */}
                    <div className="relative h-44 w-full bg-neutral-900 overflow-hidden">
                      <img
                        src={coverImg}
                        alt={item.property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-md text-white text-overline font-semibold tracking-wider px-2.5 py-1 rounded-xl border border-white/20 uppercase">
                        ● CO-HOSTING
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 bg-neutral-900/85 backdrop-blur-md text-white p-2.5 rounded-2xl border border-white/10 flex items-center justify-between text-caption">
                        <div className="min-w-0">
                          <span className="text-overline font-semibold uppercase text-neutral-400 block tracking-wider">
                            PRIMARY HOST
                          </span>
                          <p className="font-semibold text-white text-caption truncate">
                            {item.hostUser?.name || 'Property Owner'}
                          </p>
                        </div>
                        {item.hostUser?.email && (
                          <a
                            href={`mailto:${item.hostUser.email}`}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
                            title="Contact Host"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Property Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h4 className="font-semibold text-neutral-900 text-body tracking-tight line-clamp-1">
                          {item.property.title}
                        </h4>
                        <p className="text-caption text-neutral-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span>
                            {item.property.locality ? `${item.property.locality}, ` : ''}
                            {item.property.city}
                          </span>
                        </p>
                      </div>

                      {/* Delegated Role & Earnings */}
                      <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100/80 space-y-2 text-caption">
                        <div className="flex items-center justify-between">
                          <span className="text-overline font-semibold uppercase text-rose-700 tracking-wider">
                            Delegated Access
                          </span>
                          <span className="text-caption font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-tabular">
                            {item.payoutRule?.percentage
                              ? `${item.payoutRule.percentage}% Payout`
                              : item.payoutRule?.fixedAmount
                                ? `₹${item.payoutRule.fixedAmount} / booking`
                                : 'Operations'}
                          </span>
                        </div>

                        <p className="font-semibold text-neutral-900 text-caption flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span>Level: {item.permissionLevel || 'CUSTOM'}</span>
                        </p>
                      </div>

                      {/* Permissions List */}
                      <div className="space-y-1 pt-1">
                        <span className="text-overline font-semibold text-neutral-500 uppercase tracking-wider block">
                          My Delegated Responsibilities ({item.permissions.length})
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.permissions.slice(0, 4).map((perm, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-lg text-caption font-medium"
                            >
                              ✓ {PERMISSION_LABELS[perm] || perm}
                            </span>
                          ))}
                          {item.permissions.length > 4 && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-lg text-caption font-medium">
                              +{item.permissions.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* QUICK ACTIONS BAR */}
                      <div className="pt-2 border-t border-neutral-100">
                        <span className="text-overline font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                          Quick Actions
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <Link
                            href={`/host/calendar?propertyId=${item.property.id}`}
                            className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${canManageCalendar
                              ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                              : 'opacity-40 pointer-events-none bg-neutral-50 text-neutral-400 border-neutral-100'
                              }`}
                            title="Manage Calendar"
                          >
                            <Calendar className="w-4 h-4 text-rose-500" />
                            <span className="text-[11px] font-semibold">Calendar</span>
                          </Link>

                          <Link
                            href={`/host/bookings?propertyId=${item.property.id}`}
                            className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${canManageBookings
                              ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                              : 'opacity-40 pointer-events-none bg-neutral-50 text-neutral-400 border-neutral-100'
                              }`}
                            title="View Bookings"
                          >
                            <ClipboardList className="w-4 h-4 text-blue-500" />
                            <span className="text-[11px] font-semibold">Bookings</span>
                          </Link>

                          <Link
                            href={`/host/messages`}
                            className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${canMessageGuests
                              ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                              : 'opacity-40 pointer-events-none bg-neutral-50 text-neutral-400 border-neutral-100'
                              }`}
                            title="Guest Messages"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                            <span className="text-[11px] font-semibold">Messages</span>
                          </Link>
                        </div>
                      </div>


                    </div>
                  </div>

                  {/* Footer Launcher Button */}
                  <div className="p-5 pt-0">
                    <Link
                      href={`/co-host`}
                      className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white text-button font-medium rounded-2xl transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                    >
                      <span>Open Co-Host Management</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
