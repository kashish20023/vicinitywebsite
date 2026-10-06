'use client';

import { ListingQualityWidget } from '@/features/ai/components/ListingQualityWidget';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  PauseCircle,
  XCircle,
  Plus,
  RefreshCw,
  MapPin,
  Bed,
  Bath,
  Users,
  Star,
  Eye,
  Trash2,
  UserCog,
  SwitchCamera,
  Sparkles,
} from 'lucide-react';
import {
  PageHeader,
  FilterToolbar,
  EmptyState,
  StatCard,
  DashboardSkeleton,
} from '@/components/dashboard';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { pageVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/motion';

interface PointOfContact {
  name?: string;
  phone?: string;
  email?: string;
}

interface HostPropertyItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  propertyType: string;
  city: string;
  state: string;
  country?: string;
  basePrice: number;
  status: string;
  verificationStatus: string;
  coverImage?: string | null;
  images: string[];
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  maxGuests?: number;
  rating?: number;
  reviewCount?: number;
  pointOfContact?: PointOfContact | null;
  host?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
}

export default function HostListingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [properties, setProperties] = useState<HostPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'INACTIVE' | 'REJECTED'>('ALL');
  const [selectedQualityProperty, setSelectedQualityProperty] = useState<HostPropertyItem | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'price_low' | 'price_high' | 'title'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchMyProperties = async () => {
    setLoading(true);
    try {
      const data = await api.get<HostPropertyItem[]>('/properties/my-properties');
      setProperties(data || []);
    } catch (err: unknown) {
      console.error('Failed to fetch host properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await api.get<HostPropertyItem[]>('/properties/my-properties');
        if (!ignore) {
          setProperties(data || []);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Failed to fetch host properties:', err);
          setLoading(false);
        }
      }
    }
    if (isAuthenticated) {
      load();
    } else if (!authLoading) {
      queueMicrotask(() => {
        if (!ignore) setLoading(false);
      });
    }
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, authLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete listing';
      alert(message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: string) => {
    const isCurrentlyActive = currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED' || currentStatus === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'PUBLISHED';
    try {
      await api.patch(`/properties/${id}`, { status: newStatus });
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus, verificationStatus: isCurrentlyActive ? p.verificationStatus : 'APPROVED' } : p)),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle property active status';
      alert(message);
    }
  };

  // Status Counts
  const totalCount = properties.length;
  const draftCount = properties.filter((p) => p.status === 'DRAFT').length;
  const pendingCount = properties.filter(
    (p) => p.verificationStatus === 'PENDING' || p.verificationStatus === 'PENDING_APPROVAL' || p.status === 'PENDING_APPROVAL',
  ).length;
  const activeCount = properties.filter(
    (p) => p.verificationStatus === 'APPROVED' || p.status === 'PUBLISHED' || p.status === 'ACTIVE',
  ).length;
  const inactiveCount = properties.filter(
    (p) => p.status === 'INACTIVE' || p.status === 'SUSPENDED' || p.status === 'UNPUBLISHED',
  ).length;
  const rejectedCount = properties.filter(
    (p) => p.verificationStatus === 'REJECTED' || p.status === 'REJECTED',
  ).length;

  // Filter & Sort
  const filteredProperties = properties
    .filter((p) => {
      const matchesFilter =
        activeFilter === 'ALL'
          ? true
          : activeFilter === 'DRAFT'
            ? p.status === 'DRAFT'
            : activeFilter === 'PENDING'
              ? p.verificationStatus === 'PENDING' || p.verificationStatus === 'PENDING_APPROVAL' || p.status === 'PENDING_APPROVAL'
              : activeFilter === 'APPROVED'
                ? p.verificationStatus === 'APPROVED' || p.status === 'PUBLISHED' || p.status === 'ACTIVE'
                : activeFilter === 'INACTIVE'
                  ? p.status === 'INACTIVE' || p.status === 'SUSPENDED' || p.status === 'UNPUBLISHED'
                  : p.verificationStatus === 'REJECTED' || p.status === 'REJECTED';

      const matchesSearch =
        search === '' ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase()) ||
        p.id?.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.basePrice - b.basePrice;
      if (sortBy === 'price_high') return b.basePrice - a.basePrice;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getStatusBadge = (p: HostPropertyItem) => {
    if (p.status === 'DRAFT') {
      return <Badge variant="default">Draft</Badge>;
    }
    if (p.verificationStatus === 'PENDING' || p.verificationStatus === 'PENDING_APPROVAL' || p.status === 'PENDING_APPROVAL') {
      return <Badge variant="warning">Pending Approval</Badge>;
    }
    if (p.verificationStatus === 'APPROVED' || p.status === 'PUBLISHED' || p.status === 'ACTIVE') {
      return <Badge variant="success">Live</Badge>;
    }
    if (p.status === 'INACTIVE' || p.status === 'SUSPENDED' || p.status === 'UNPUBLISHED') {
      return <Badge variant="default">Inactive</Badge>;
    }
    return <Badge variant="error">Rejected</Badge>;
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20"
    >
      {/* 1. PAGE HEADER */}
      <PageHeader
        workspace="HOSTING WORKSPACE"
        title="Listings"
        description="Manage your properties, review guest details, and track verification status."
        icon={Building2}
        actions={
          <>
            <button
              type="button"
              onClick={fetchMyProperties}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/host/listings/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </Link>
          </>
        }
      />

      {/* 2. STATS OVERVIEW HIERARCHY */}
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
      >
        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Total Properties"
            value={totalCount}
            icon={Building2}
            onClick={() => setActiveFilter('ALL')}
            className={activeFilter === 'ALL' ? 'ring-2 ring-[#0e4962] border-[#0e4962]' : ''}
          />
        
      {/* AI QUALITY & COPYWRITER MODAL */}
      {selectedQualityProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{selectedQualityProperty.title}</h2>
                <p className="text-xs text-neutral-500">Property ID: {selectedQualityProperty.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQualityProperty(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <ListingQualityWidget
              propertyId={selectedQualityProperty.id}
              onApplyDescription={(headline, summary) => {
                alert('Generated headline & description saved for review: ' + headline);
                setSelectedQualityProperty(null);
              }}
            />
          </div>
        </div>
      )}
    </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Live"
            value={activeCount}
            icon={CheckCircle2}
            status="Live"
            statusVariant="success"
            onClick={() => setActiveFilter('APPROVED')}
            className={activeFilter === 'APPROVED' ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={Clock}
            status="In Review"
            statusVariant="warning"
            onClick={() => setActiveFilter('PENDING')}
            className={activeFilter === 'PENDING' ? 'ring-2 ring-amber-500 border-amber-500' : ''}
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Drafts"
            value={draftCount}
            icon={Edit3}
            status="Draft"
            statusVariant="default"
            onClick={() => setActiveFilter('DRAFT')}
            className={activeFilter === 'DRAFT' ? 'ring-2 ring-neutral-500 border-neutral-500' : ''}
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Inactive"
            value={inactiveCount}
            icon={PauseCircle}
            status="Paused"
            statusVariant="default"
            onClick={() => setActiveFilter('INACTIVE')}
            className={activeFilter === 'INACTIVE' ? 'ring-2 ring-neutral-400 border-neutral-400' : ''}
          />
        </motion.div>

        <motion.div variants={staggerItemVariants}>
          <StatCard
            label="Rejected"
            value={rejectedCount}
            icon={XCircle}
            status="Action Req"
            statusVariant="error"
            onClick={() => setActiveFilter('REJECTED')}
            className={activeFilter === 'REJECTED' ? 'ring-2 ring-rose-500 border-rose-500' : ''}
          />
        </motion.div>
      </motion.div>

      {/* 3. TOOLBAR: Search, Filters, Sort & View Mode */}
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search properties by title, city, or ID..."
        filters={[
          { id: 'ALL', label: 'All', count: totalCount },
          { id: 'APPROVED', label: 'Live', count: activeCount },
          { id: 'PENDING', label: 'Pending', count: pendingCount },
          { id: 'DRAFT', label: 'Drafts', count: draftCount },
          { id: 'INACTIVE', label: 'Inactive', count: inactiveCount },
          { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
        ]}
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f as typeof activeFilter)}
        sortOptions={[
          { id: 'latest', label: 'Sort: Latest' },
          { id: 'price_low', label: 'Price: Low to High' },
          { id: 'price_high', label: 'Price: High to Low' },
          { id: 'title', label: 'Title: A to Z' },
        ]}
        activeSort={sortBy}
        onSortChange={(s) => setSortBy(s as typeof sortBy)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 4. CONTENT LIST / GRID */}
      {loading ? (
        <div className="space-y-4">
          <DashboardSkeleton.StatGrid count={4} />
          <DashboardSkeleton.List count={3} />
        </div>
      ) : filteredProperties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={activeFilter === 'ALL' ? 'No property listings found' : `No ${activeFilter.toLowerCase()} listings`}
          description={
            activeFilter === 'ALL'
              ? 'You have not created any listings yet. Start sharing your space with guests today.'
              : `There are currently no properties matching the "${activeFilter}" filter status.`
          }
          primaryAction={
            activeFilter === 'ALL'
              ? {
                label: 'Add Property Listing',
                href: '/host/listings/new',
                icon: Plus,
              }
              : {
                label: 'Reset Filters',
                onClick: () => {
                  setActiveFilter('ALL');
                  setSearch('');
                },
              }
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredProperties.map((p) => {
            const coverImg =
              p.coverImage ||
              p.images?.[0] ||
              'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80';

            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Property Image with Badge Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                    <img
                      src={coverImg}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 z-10">
                      {getStatusBadge(p)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm sm:text-base tracking-tight truncate group-hover:text-[#0e4962] transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#0e4962] shrink-0" />
                        <span className="truncate">
                          {p.city}, {p.state || p.country || 'India'}
                        </span>
                      </p>
                    </div>

                    {/* Amenities Row */}
                    <div className="flex items-center gap-3 text-xs text-neutral-600 pt-1 border-t border-neutral-100">
                      <div className="flex items-center gap-1 font-semibold">
                        <Bed className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{p.beds || p.bedrooms || 1} bds</span>
                      </div>
                      <span className="text-neutral-300">•</span>
                      <div className="flex items-center gap-1 font-semibold">
                        <Bath className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{p.bathrooms || 1} ba</span>
                      </div>
                      <span className="text-neutral-300">•</span>
                      <div className="flex items-center gap-1 font-semibold">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{p.maxGuests || 2} guests</span>
                      </div>
                    </div>

                    {/* Price & Rating */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{p.rating ?? 'New'}</span>
                        {p.reviewCount !== undefined && p.reviewCount > 0 && (
                          <span className="text-neutral-400 font-normal">
                            ({p.reviewCount})
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-semibold text-neutral-900 text-body font-tabular">
                          ₹{p.basePrice?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-caption text-neutral-500 font-normal"> / night</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3.5 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/host/properties/${p.id}/co-hosts`}
                      className="px-2.5 py-1.5 text-button font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200/80 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <UserCog className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Co-Hosts</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(p.id, p.status)}
                      title={p.status === 'PUBLISHED' ? 'Pause Listing' : 'Publish Listing'}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedQualityProperty(p)}
                      title="AI Quality Audit"
                      className="px-2.5 py-1.5 text-button font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>AI Audit</span>
                    </button>

                    <Link
                      href={`/host/properties/${p.id}`}
                      className="px-3 py-1.5 text-button font-medium text-[#0e4962] bg-[#0e4962]/10 hover:bg-[#0e4962]/15 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      title="Delete Listing"
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW TABLE */
        <DataTable
          columns={[
            {
              key: 'property',
              header: 'Property',
              render: (p: any) => {
                const coverImg =
                  p.coverImage ||
                  p.images?.[0] ||
                  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&q=80';
                return (
                  <div className="flex items-center gap-3">
                    <img
                      src={coverImg}
                      alt={p.title}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-200/80 shrink-0"
                    />
                    <div>
                      <Link
                        href={`/host/properties/${p.id}`}
                        className="font-semibold text-neutral-900 hover:text-[#0e4962] text-body-sm transition-colors"
                      >
                        {p.title}
                      </Link>
                      <p className="text-caption text-neutral-500">
                        {p.propertyType || p.category}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'location',
              header: 'Location',
              cellClassName: 'text-neutral-600 font-medium',
              render: (p: any) => `${p.city}, ${p.state || p.country || 'India'}`,
            },
            {
              key: 'price',
              header: 'Price',
              cellClassName: 'font-bold text-neutral-900 font-tabular text-body-sm',
              render: (p: any) => (
                <>
                  ₹{p.basePrice?.toLocaleString('en-IN')}
                  <span className="text-caption text-neutral-500 font-normal"> / night</span>
                </>
              ),
            },
            {
              key: 'capacity',
              header: 'Capacity',
              cellClassName: 'text-neutral-600',
              render: (p: any) => `${p.beds || 1} beds • ${p.maxGuests || 2} guests`,
            },
            {
              key: 'rating',
              header: 'Rating',
              render: (p: any) => (
                <span className="inline-flex items-center gap-1 font-semibold text-neutral-800 font-tabular">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {p.rating ? Number(p.rating).toFixed(1) : 'New'}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (p: any) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold border ${
                    p.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      p.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`}
                  />
                  {p.status}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              alignRight: true,
              render: (p: any) => (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQualityProperty(p)}
                    title="AI Quality Audit"
                    className="px-2 py-1 text-button font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>AI Audit</span>
                  </button>

                  <Link
                    href={`/host/properties/${p.id}`}
                    className="px-2.5 py-1 text-button font-medium text-[#0e4962] bg-[#0e4962]/10 hover:bg-[#0e4962]/15 rounded-lg transition-colors"
                  >
                    Manage
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    title="Delete"
                    className="p-1 text-neutral-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredProperties}
          rowKey={(p: any) => p.id}
          emptyTitle="No Listings Found"
          emptySubtitle="No listings match the current filters."
        />
      )}
    </motion.div>
  );
}
