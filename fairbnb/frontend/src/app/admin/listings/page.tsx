'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  Check,
  X,
  RefreshCw,
  MapPin,
  Bed,
  Bath,
  Users,
  Star,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  Edit,
  Edit3,
  Bookmark,
  Home,
  PauseCircle,
  AlertCircle,
  Phone,
  MoreVertical,
} from 'lucide-react';

interface PointOfContact {
  name?: string;
  phone?: string;
  email?: string;
}

interface AdminListingItem {
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
  hostId: string;
  host?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    isSuperhost?: boolean;
  } | null;
  createdAt: string;
}

export default function AdminListingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [properties, setProperties] = useState<AdminListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'INACTIVE' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'price_low' | 'price_high' | 'title'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await api.get<AdminListingItem[]>('/properties/admin/all');
      setProperties(data || []);
    } catch (err) {
      console.error('Error loading admin listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchListings();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const handleApprove = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/properties/${id}/approve`);
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, verificationStatus: 'APPROVED', status: 'PUBLISHED' }
            : p,
        ),
      );
      setToastMessage({
        text: `"${title || 'Listing'}" has been approved and published Live!`,
        type: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        text: err.message || 'Failed to approve listing',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, title?: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/properties/${id}/reject`, {
        rejectionReason: 'Does not meet platform quality criteria',
      });
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, verificationStatus: 'REJECTED', status: 'REJECTED' }
            : p,
        ),
      );
      setToastMessage({
        text: `"${title || 'Listing'}" has been rejected.`,
        type: 'info',
      });
    } catch (err: any) {
      setToastMessage({
        text: err.message || 'Failed to reject listing',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
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
      setToastMessage({
        text: `Listing is now ${newStatus.toLowerCase()}.`,
        type: 'info',
      });
    } catch (err: any) {
      setToastMessage({
        text: err.message || 'Failed to toggle property active status',
        type: 'error',
      });
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
        p.host?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.id?.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.basePrice - b.basePrice;
      if (sortBy === 'price_high') return b.basePrice - a.basePrice;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-6">
      {/* 1. HEADER ROW */}
      <PageHeader
        title="Listings"
        subtitle="Manage all property listings, review details, and take action on pending approvals."
        actions={
          <>
            <button
              onClick={fetchListings}
              className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-2xl text-body-sm font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link
              href="/host/listings/new"
              className="bg-[#0e4962] hover:bg-[#093447] text-white font-semibold px-5 py-2.5 rounded-2xl text-button flex items-center gap-1.5 shadow-sm transition active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" /> Add Property
            </Link>
          </>
        }
      />

      {/* 2. TOP METRIC CARDS ROW (6 CLICKABLE CARDS GRID) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div onClick={() => setActiveFilter('DRAFT')} className="cursor-pointer">
          <StatCard
            label="Draft"
            value={draftCount}
            icon={Edit3}
            variant="amber"
            className={activeFilter === 'DRAFT' ? 'ring-2 ring-amber-500 shadow-md' : ''}
          />
        </div>
        <div onClick={() => setActiveFilter('PENDING')} className="cursor-pointer">
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={Clock}
            variant="blue"
            className={activeFilter === 'PENDING' ? 'ring-2 ring-blue-500 shadow-md' : ''}
          />
        </div>
        <div onClick={() => setActiveFilter('APPROVED')} className="cursor-pointer">
          <StatCard
            label="Live"
            value={activeCount}
            icon={CheckCircle2}
            variant="emerald"
            className={activeFilter === 'APPROVED' ? 'ring-2 ring-emerald-500 shadow-md' : ''}
          />
        </div>
        <div onClick={() => setActiveFilter('INACTIVE')} className="cursor-pointer">
          <StatCard
            label="Inactive"
            value={inactiveCount}
            icon={PauseCircle}
            variant="default"
            className={activeFilter === 'INACTIVE' ? 'ring-2 ring-neutral-500 shadow-md' : ''}
          />
        </div>
        <div onClick={() => setActiveFilter('REJECTED')} className="cursor-pointer">
          <StatCard
            label="Rejected"
            value={rejectedCount}
            icon={XCircle}
            variant="rose"
            className={activeFilter === 'REJECTED' ? 'ring-2 ring-rose-500 shadow-md' : ''}
          />
        </div>
        <div onClick={() => setActiveFilter('ALL')} className="cursor-pointer">
          <StatCard
            label="Total"
            value={totalCount}
            icon={Home}
            variant="default"
            className={activeFilter === 'ALL' ? 'ring-2 ring-[#0e4962] shadow-md' : ''}
          />
        </div>
      </div>

      {/* 3. FILTER PILLS & VIEW CONTROLS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Filter Pills */}
        <FilterTabs
          tabs={[
            { id: 'ALL', label: 'All', count: totalCount },
            { id: 'DRAFT', label: 'Draft', count: draftCount },
            { id: 'PENDING', label: 'Pending', count: pendingCount },
            { id: 'APPROVED', label: 'Live', count: activeCount },
            { id: 'INACTIVE', label: 'Inactive', count: inactiveCount },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
          ]}
          activeTab={activeFilter}
          onChange={setActiveFilter}
        />

        {/* Right Search, Sort & View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, location..."
            className="w-full sm:w-60"
          />

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-caption font-semibold text-neutral-700 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="latest">Sort by: Latest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="title">Title: A to Z</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-white p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-rose-500 text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-rose-500 text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. LISTINGS DISPLAY AREA */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-neutral-500">
          Showing {filteredProperties.length} of {totalCount} properties
        </p>

        {loading ? (
          <div className="py-24 text-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
            <p className="text-xs font-medium text-neutral-500">Loading listings catalog...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-3">
            <Building2 className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="font-bold text-neutral-800 text-body">No property listings found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              No properties match filter status <span className="font-bold text-neutral-700">{activeFilter}</span>.
            </p>
            {activeFilter !== 'ALL' && (
              <button
                onClick={() => setActiveFilter('ALL')}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                View All Listings
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW (4 COLUMNS EXACTLY MATCHING USER SCREENSHOT) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map((p) => {
              const isDraft = p.status === 'DRAFT';
              const isPending =
                p.verificationStatus === 'PENDING' ||
                p.verificationStatus === 'PENDING_APPROVAL' ||
                p.status === 'PENDING_APPROVAL';
              const isRejected =
                p.verificationStatus === 'REJECTED' ||
                p.status === 'REJECTED';
              const isApproved =
                p.verificationStatus === 'APPROVED' ||
                p.status === 'PUBLISHED' ||
                p.status === 'ACTIVE';
              const isInactive =
                p.status === 'INACTIVE' ||
                p.status === 'SUSPENDED' ||
                p.status === 'UNPUBLISHED';

              const coverImg =
                p.coverImage ||
                (p.images && p.images[0]) ||
                'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80';

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_14px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col justify-between group transition-all duration-200 hover:shadow-md"
                >
                  <div>
                    {/* TOP COVER IMAGE CONTAINER */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                      <img
                        src={coverImg}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* TOP-LEFT CIRCLE BOOKMARK BADGE */}
                      <div className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-neutral-900/50 backdrop-blur-xs text-white flex items-center justify-center shadow-xs">
                        <Bookmark className="w-4 h-4 text-white stroke-[2]" />
                      </div>

                      {/* TOP-RIGHT STATUS BADGE PILL */}
                      <div className="absolute top-3.5 right-3.5">
                        <StatusBadge
                          status={isDraft ? 'DRAFT' : isPending ? 'PENDING' : isRejected ? 'REJECTED' : isApproved ? 'ACTIVE' : isInactive ? 'INACTIVE' : 'REJECTED'}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* TITLE & LOCATION */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-h4 tracking-tight truncate">
                          {p.title}
                        </h3>
                        <p className="text-caption text-neutral-500 font-normal flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{p.city}, {p.state || p.country || 'India'}</span>
                        </p>
                        <p className="text-caption text-neutral-400 font-normal mt-0.5 truncate">
                          Host: <span className="font-semibold text-neutral-700">{p.host?.name || 'Demo Host'}</span>
                        </p>
                      </div>

                      {/* AMENITIES 3-COLUMN ROW (NO DIVIDERS) */}
                      <div className="flex items-center gap-5 text-xs text-neutral-700 font-semibold pt-1">
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4 text-neutral-400 stroke-[1.8]" />
                          <span>{p.beds || p.bedrooms || 2} Beds</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4 text-neutral-400 stroke-[1.8]" />
                          <span>{p.bathrooms || 2} Baths</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-neutral-400 stroke-[1.8]" />
                          <span>{p.maxGuests || 4} Guests</span>
                        </div>
                      </div>

                      {/* PRICE & RATING ROW */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-xs font-semibold text-neutral-900">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{p.rating ?? 0}</span>
                          <span className="text-neutral-400 font-normal">({p.reviewCount ?? 0})</span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-neutral-900 text-base sm:text-lg">
                            ₹{p.basePrice?.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-neutral-400 font-normal"> / night</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS ROW */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2.5">
                    {isPending ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          disabled={actionLoadingId === p.id}
                          onClick={() => handleApprove(p.id, p.title)}
                          className="flex-1 h-9 px-3.5 bg-[#008766] hover:bg-[#007457] text-white rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          )}
                          <span>Approve</span>
                        </button>
                        <button
                          disabled={actionLoadingId === p.id}
                          onClick={() => handleReject(p.id, p.title)}
                          className="flex-1 h-9 px-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 hover:border-rose-400 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <X className="w-4 h-4 stroke-[2.5] text-rose-500" />
                          )}
                          <span>Reject</span>
                        </button>
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="h-9 px-4 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                          <span>View</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end w-full">
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="h-9 px-5 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                          <span>View</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW TABLE MATCHING USER REFERENCE EXACTLY */
          <DataTable
            className="rounded-3xl"
            columns={[
              {
                key: 'property',
                header: 'Property',
                render: (p: any) => (
                  <div className="flex items-center gap-3">
                    <img
                      src={p.coverImage || p.images?.[0] || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&q=80'}
                      alt={p.title}
                      className="w-11 h-11 rounded-xl object-cover border border-neutral-200/80 flex-shrink-0"
                    />
                    <Link href={`/admin/properties/${p.id}`} className="hover:underline">
                      <p className="font-semibold text-neutral-900 text-body-sm max-w-xs truncate">{p.title}</p>
                    </Link>
                  </div>
                ),
              },
              {
                key: 'host',
                header: 'Host',
                cellClassName: 'font-normal text-neutral-700 text-body-sm',
                render: (p: any) => p.host?.name || 'Vicinity ORG',
              },
              {
                key: 'location',
                header: 'Location',
                cellClassName: 'text-body-sm font-normal text-neutral-600',
                render: (p: any) => `${p.city}, ${p.state || p.country || 'India'}`,
              },
              {
                key: 'details',
                header: 'Details',
                render: (p: any) => (
                  <div className="flex items-center gap-2.5 text-caption text-neutral-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-neutral-400" /> {p.beds || p.bedrooms || 2}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-neutral-400" /> {p.bathrooms || 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-neutral-400" /> {p.maxGuests || 6}
                    </span>
                  </div>
                ),
              },
              {
                key: 'price',
                header: 'Price',
                cellClassName: 'font-semibold font-tabular text-neutral-900 text-body-sm',
                render: (p: any) => `₹${p.basePrice?.toLocaleString('en-IN')}/night`,
              },
              {
                key: 'poc',
                header: 'POC',
                render: (p: any) => {
                  const pocName = p.pointOfContact?.name || p.host?.name || 'Vicinity ORG';
                  const pocPhone = p.pointOfContact?.phone || p.host?.phone || '917877979122';
                  return (
                    <div>
                      <p className="font-semibold text-neutral-900">{pocName}</p>
                      <p className="text-caption text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-400" /> {pocPhone}
                      </p>
                    </div>
                  );
                },
              },
              {
                key: 'rating',
                header: 'Rating',
                render: (p: any) => (
                  <div className="flex items-center gap-1 text-caption font-semibold font-tabular text-neutral-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{p.rating ?? 0}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (p: any) => {
                  const isApproved = p.verificationStatus === 'APPROVED' || p.status === 'PUBLISHED' || p.status === 'ACTIVE';
                  const statusStr = isApproved ? 'ACTIVE' : p.status === 'DRAFT' ? 'DRAFT' : p.verificationStatus === 'REJECTED' || p.status === 'REJECTED' ? 'REJECTED' : 'PENDING';
                  return <StatusBadge status={statusStr} showDot size="sm" />;
                },
              },
              {
                key: 'active',
                header: 'Active',
                render: (p: any) => {
                  const isApproved = p.verificationStatus === 'APPROVED' || p.status === 'PUBLISHED' || p.status === 'ACTIVE';
                  return (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p.id, p.status)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isApproved ? 'bg-amber-500' : 'bg-neutral-200'
                        }`}
                      title="Toggle active status"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isApproved ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Actions',
                alignRight: true,
                render: (p: any) => {
                  const isPending = p.verificationStatus === 'PENDING' || p.verificationStatus === 'PENDING_APPROVAL' || p.status === 'PENDING_APPROVAL';
                  return (
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <>
                          <button
                            disabled={actionLoadingId === p.id}
                            onClick={() => handleApprove(p.id, p.title)}
                            className="px-3 py-1 bg-[#008766] hover:bg-[#007457] text-white rounded-full text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === p.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            disabled={actionLoadingId === p.id}
                            onClick={() => handleReject(p.id, p.title)}
                            className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 hover:border-rose-400 rounded-full text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === p.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                            ) : (
                              <X className="w-3 h-3 text-rose-500" />
                            )}
                            Reject
                          </button>
                        </>
                      )}
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="px-3 py-1 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-full text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5 text-neutral-500" /> View
                      </Link>
                    </div>
                  );
                },
              },
            ]}
            data={filteredProperties}
            rowKey={(p: any) => p.id}
            emptyTitle="No Properties Found"
            emptySubtitle="No listings match the current filters."
          />
        )}
      </div>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold text-white ${
              toastMessage.type === 'success'
                ? 'bg-neutral-900 border-neutral-800'
                : toastMessage.type === 'error'
                ? 'bg-rose-600 border-rose-700'
                : 'bg-neutral-800 border-neutral-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
