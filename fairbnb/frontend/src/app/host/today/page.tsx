'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  ClipboardList,
  MessageSquare,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  DashboardSkeleton,
  EmptyState,
} from '@/components/dashboard';
import { Badge } from '@/components/ui/Badge';
import { pageVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/motion';

interface HostProperty {
  id: string;
  title: string;
  category: string;
  city: string;
  basePrice: number;
  status: string;
  verificationStatus: string;
  images: string[];
}

export default function HostTodayPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadHostData() {
      try {
        const data = await api.get<HostProperty[]>('/properties/my-properties');
        if (!ignore) {
          setProperties(data || []);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Error fetching host portfolio:', err);
          setLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      loadHostData();
    } else if (!authLoading) {
      queueMicrotask(() => {
        if (!ignore) setLoading(false);
      });
    }

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, authLoading]);

  const approvedListings = properties.filter((p) => p.verificationStatus === 'APPROVED');
  const pendingListings = properties.filter(
    (p) => p.verificationStatus === 'PENDING' || p.verificationStatus === 'PENDING_APPROVAL',
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-20"
    >
      {/* 1. PAGE HEADER */}
      <PageHeader
        workspace="HOSTING OVERVIEW"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Host'}`}
        description="Here's what's happening with your hosting portfolio, upcoming reservations, and property statuses today."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/host/calendar"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>Calendar</span>
            </Link>

            <Link
              href="/host/listings/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Listing</span>
            </Link>
          </div>
        }
      />

      {/* 2. STATS OVERVIEW */}
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Total Portfolio"
            value={properties.length}
            icon={Building2}
            href="/host/listings"
            description="All active and draft listings"
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Active & Live"
            value={approvedListings.length}
            icon={CheckCircle2}
            status="Live"
            statusVariant="success"
            href="/host/listings"
            description="Bookable by guests now"
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Pending Review"
            value={pendingListings.length}
            icon={Clock}
            status={pendingListings.length > 0 ? 'Action Req' : 'Clear'}
            statusVariant={pendingListings.length > 0 ? 'warning' : 'default'}
            href="/host/listings"
            description="Awaiting admin verification"
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Host Status"
            value="Verified"
            icon={Sparkles}
            status="Active"
            statusVariant="success"
            description="Identity & contact confirmed"
          />
        </motion.div>
      </motion.div>

      {/* 3. QUICK ACTIONS BAR */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 shadow-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Quick Operations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/host/listings/new"
            className="p-3.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#0e4962]/10 text-[#0e4962] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-neutral-900 truncate">Add Listing</p>
              <p className="text-caption text-neutral-500 truncate">Create a new space</p>
            </div>
          </Link>

          <Link
            href="/host/bookings"
            className="p-3.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-neutral-900 truncate">Manage Bookings</p>
              <p className="text-caption text-neutral-500 truncate">Guest reservations</p>
            </div>
          </Link>

          <Link
            href="/host/calendar"
            className="p-3.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-neutral-900 truncate">Calendar Sync</p>
              <p className="text-caption text-neutral-500 truncate">Availability & rates</p>
            </div>
          </Link>

          <Link
            href="/host/messages"
            className="p-3.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-neutral-900 truncate">Guest Inbox</p>
              <p className="text-caption text-neutral-500 truncate">Inquiries & chats</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. RECENT PROPERTIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h4 font-semibold text-neutral-900">Your Properties</h2>
            <p className="text-caption text-neutral-500">Recently listed properties and current operational status.</p>
          </div>
          <Link
            href="/host/listings"
            className="text-button font-medium text-[#0e4962] hover:underline flex items-center gap-1"
          >
            View all ({properties.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardSkeleton.List count={2} />
            <DashboardSkeleton.List count={2} />
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties listed yet"
            description="Ready to start earning? List your villa, apartment, or vacation home on FairBnB today."
            primaryAction={{
              label: 'Start Listing Wizard',
              href: '/host/listings/new',
              icon: Plus,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.slice(0, 4).map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs hover:shadow-sm transition-shadow flex gap-4 items-center"
              >
                <div className="w-20 h-20 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                  <img
                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400'}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-overline font-semibold uppercase tracking-wider text-neutral-500">
                      {prop.category}
                    </span>
                    <Badge
                      variant={
                        prop.verificationStatus === 'APPROVED'
                          ? 'success'
                          : prop.verificationStatus === 'REJECTED'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {prop.verificationStatus}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-neutral-900 text-body-sm truncate mt-1">
                    {prop.title}
                  </h3>
                  <p className="text-caption text-neutral-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#0e4962]" />
                    <span>{prop.city}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="font-semibold text-neutral-900 font-tabular">
                      ₹{prop.basePrice?.toLocaleString('en-IN')}/night
                    </span>
                  </p>
                </div>
                <Link
                  href={`/host/properties/${prop.id}`}
                  className="px-3 py-1.5 text-button font-medium text-[#0e4962] bg-[#0e4962]/10 hover:bg-[#0e4962]/15 rounded-lg transition-colors shrink-0"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
