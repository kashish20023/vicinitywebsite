'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import PropertyCard from '@/components/co-host/PropertyCard';
import {
  Building2,
  Calendar,
  DollarSign,
  Search,
  MessageSquare,
  Wrench,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  DashboardSkeleton,
  EmptyState,
} from '@/components/dashboard';
import { pageVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/motion';

interface ManagedPropertyItem {
  relationshipId: string;
  property?: {
    id: string;
    title: string;
    city: string;
    basePrice: number;
    bookings?: unknown[];
  };
  hostUser?: {
    id: string;
    name: string;
  };
}

export default function CoHostDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [properties, setProperties] = useState<ManagedPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const data = await api.get<ManagedPropertyItem[]>('/co-host/me/properties');
        if (!ignore) {
          const items = Array.isArray(data) ? data : ((data as unknown as { items: ManagedPropertyItem[] }).items || []);
          setProperties(items);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Error fetching co-host properties:', err);
          setLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      loadData();
    } else {
      queueMicrotask(() => {
        if (!ignore) setLoading(false);
      });
    }

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  // Aggregate stats across properties
  const totalProperties = properties.length;
  const allBookings = properties.flatMap((p) => p.property?.bookings || []);
  const activeBookingsCount = allBookings.length;
  const totalEarningsEst = properties.reduce((acc, p) => acc + (p.property?.basePrice || 0) * 10, 0);
  const avgCommissionRate = 15;
  const totalCommissionEst = Math.round((totalEarningsEst * avgCommissionRate) / 100);
  const hostIds = new Set(properties.map((p) => p.hostUser?.id).filter(Boolean));

  // Search filter
  const filteredProperties = properties.filter((item) => {
    const title = item.property?.title || '';
    const city = item.property?.city || '';
    const hostName = item.hostUser?.name || '';
    const query = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(query) ||
      city.toLowerCase().includes(query) ||
      hostName.toLowerCase().includes(query)
    );
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'Co-Host';

  // "Today" Unified Chronological Feed
  const todayFeedItems = [
    {
      id: '1',
      icon: Calendar,
      iconColor: 'bg-emerald-50 text-emerald-700',
      title: 'Guest Check-in: Alex Rivera at Sunset Villa',
      subtitle: 'Check-in scheduled for 2:00 PM • Host: Villa Stays',
      time: 'Today',
    },
    {
      id: '2',
      icon: MessageSquare,
      iconColor: 'bg-blue-50 text-blue-700',
      title: 'New Guest Inquiry for City Apartment',
      subtitle: '"Can we arrange early check-in for tomorrow?"',
      time: '2h ago',
    },
    {
      id: '3',
      icon: Wrench,
      iconColor: 'bg-amber-50 text-amber-700',
      title: 'AC Inspection Scheduled at Mountain View Cottage',
      subtitle: 'Technician assigned by Host Owner',
      time: '5h ago',
    },
    {
      id: '4',
      icon: TrendingUp,
      iconColor: 'bg-[#0e4962]/10 text-[#0e4962]',
      title: 'Commission credited for booking #BK-8902',
      subtitle: '₹3,200 credited to co-host balance',
      time: '1d ago',
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-8 max-w-7xl mx-auto pb-20"
    >
      {/* 1. PAGE HEADER */}
      <PageHeader
        workspace="CO-HOST WORKSPACE"
        title={`Good morning, ${firstName} ☀️`}
        description="Here is the live operational feed and overview across your managed partner properties today."
        actions={
          <Link
            href="/co-host/properties"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Manage Properties</span>
          </Link>
        }
      />

      {/* 2. STATS OVERVIEW */}
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Properties Managed"
            value={totalProperties}
            icon={Building2}
            href="/co-host/properties"
            description={`Partnering across ${hostIds.size || 1} host owners`}
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Active Bookings"
            value={activeBookingsCount}
            icon={Calendar}
            href="/co-host/bookings"
            trend={{ value: '12%', direction: 'up', label: 'guest arrivals' }}
            description="Reservations this week"
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Est. Commission Earned"
            value={`₹${totalCommissionEst.toLocaleString('en-IN')}`}
            icon={DollarSign}
            href="/co-host/earnings"
            status="15% avg"
            statusVariant="success"
            description="Estimated monthly payout"
          />
        </motion.div>
      </motion.div>

      {/* 3. TWO-COLUMN LAYOUT: TODAY FEED (1/3) + MANAGED PROPERTIES (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* LEFT: TODAY FEED */}
        <div className="space-y-3.5 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-h4 font-semibold text-neutral-900 tracking-tight">Today&apos;s Feed</h3>
              <p className="text-caption text-neutral-500">Live operational events</p>
            </div>
            <span className="text-overline font-semibold uppercase tracking-wider text-[#0e4962] bg-[#0e4962]/10 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>

          <div className="space-y-2.5">
            {todayFeedItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-neutral-50/70 rounded-xl border border-neutral-100 flex items-start gap-3 text-caption hover:bg-neutral-100/70 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl ${item.iconColor} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 truncate text-caption">{item.title}</p>
                    <p className="text-caption text-neutral-500 line-clamp-1">{item.subtitle}</p>
                    <span className="text-caption text-neutral-400 block pt-0.5">{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: MANAGED PROPERTIES */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-h4 font-semibold text-neutral-900 tracking-tight">Assigned Properties</h3>
              <p className="text-caption text-neutral-500">Properties under your co-hosting delegation.</p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties or hosts..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-200/80 rounded-xl text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-[#0e4962] focus:ring-1 focus:ring-[#0e4962] transition-colors shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <DashboardSkeleton.List count={3} />
            </div>
          ) : filteredProperties.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No managed properties found"
              description={
                searchQuery
                  ? `No properties match the query "${searchQuery}".`
                  : 'You do not have any properties assigned for co-hosting yet.'
              }
              primaryAction={
                searchQuery
                  ? {
                    label: 'Clear Search',
                    onClick: () => setSearchQuery(''),
                  }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProperties.map((item) => (
                <PropertyCard key={item.relationshipId} relationship={item as never} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
