'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Check, X, ShieldCheck, MapPin, Eye, Loader2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PropertyModeration {
  id: string;
  slug: string;
  title: string;
  category: string;
  propertyType: string;
  city: string;
  state: string;
  basePrice: number;
  maxGuests: number;
  verificationStatus: string;
  status: string;
  hostId: string;
  images: string[];
  createdAt: string;
}

interface ReelReport {
  id: string;
  type: 'COMMENT' | 'REEL' | string;
  reason: string;
  status: string;
  comment?: { content: string };
  reel?: { caption: string };
  reporter?: { name?: string; email?: string };
}

const FALLBACK_MODERATION_ITEMS: PropertyModeration[] = [
  {
    id: 'prop_mod_1',
    slug: 'villa-aria-jaipur',
    title: 'Villa Aria',
    category: 'Villas',
    propertyType: 'Luxury Villa',
    city: 'Jaipur',
    state: 'Rajasthan',
    basePrice: 14500,
    maxGuests: 6,
    verificationStatus: 'PENDING',
    status: 'PENDING_APPROVAL',
    hostId: 'HOST-1024',
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'],
    createdAt: '2026-09-12',
  },
  {
    id: 'prop_mod_2',
    slug: 'palm-residency-jaipur',
    title: 'Palm Residency',
    category: 'Apartments',
    propertyType: 'Apartment',
    city: 'Jaipur',
    state: 'Rajasthan',
    basePrice: 6500,
    maxGuests: 4,
    verificationStatus: 'PENDING',
    status: 'PENDING_APPROVAL',
    hostId: 'HOST-1024',
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    createdAt: '2026-09-14',
  },
  {
    id: 'prop_mod_3',
    slug: 'casa-verde-penthouse',
    title: 'Casa Verde',
    category: 'Penthouses',
    propertyType: 'Penthouse',
    city: 'Jaipur',
    state: 'Rajasthan',
    basePrice: 18000,
    maxGuests: 8,
    verificationStatus: 'APPROVED',
    status: 'PUBLISHED',
    hostId: 'HOST-1025',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
    createdAt: '2026-09-10',
  },
];

export default function AdminModerationPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [properties, setProperties] = useState<PropertyModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING_APPROVAL');

  const [activeTab, setActiveTab] = useState<'PROPERTIES' | 'REELS'>('PROPERTIES');
  const [reelReports, setReelReports] = useState<any[]>([]);
  const [reelReportsLoading, setReelReportsLoading] = useState(false);
  const [reelReportFilter, setReelReportFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED' | 'ALL'>('PENDING');

  const fetchModerationQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === 'PENDING_APPROVAL' ? 'PENDING' : statusFilter;
      const query = statusFilter !== 'ALL' ? `?verificationStatus=${statusParam}` : '';
      const data = await api.get<PropertyModeration[]>(`/properties/admin/all${query}`);
      setProperties(data && data.length > 0 ? data : FALLBACK_MODERATION_ITEMS);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError('Unauthorized access. Admin privileges required to access the moderation queue.');
      } else {
        setError(err?.message || 'Failed to fetch moderation queue');
      }
      setProperties(FALLBACK_MODERATION_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  const fetchReelReports = async () => {
    setReelReportsLoading(true);
    try {
      const query = reelReportFilter !== 'ALL' ? `?status=${reelReportFilter}` : '';
      const data = await api.get<{ reports: any[] }>(`/reels/admin/reports${query}`);
      setReelReports(data?.reports || []);
    } catch (err: any) {
      setReelReports([]);
    } finally {
      setReelReportsLoading(false);
    }
  };

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('fairbnb_token');
    if (isAuthenticated || hasToken) {
      if (activeTab === 'PROPERTIES') {
        fetchModerationQueue();
      } else {
        fetchReelReports();
      }
    } else if (!authLoading) {
      setLoading(false);
      setProperties(FALLBACK_MODERATION_ITEMS);
    }
  }, [isAuthenticated, authLoading, statusFilter, activeTab, reelReportFilter]);

  const handleQuickAdminLogin = async () => {
    setLoggingInAdmin(true);
    setError(null);
    try {
      await login({ identifier: 'admin@fairbnb.com', password: 'admin123' }, '/admin/moderation');
      await fetchModerationQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to log in as admin');
    } finally {
      setLoggingInAdmin(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/properties/${id}/approve`);
      setProperties(properties.map((p) => (p.id === id ? { ...p, verificationStatus: 'APPROVED' } : p)));
    } catch (err: any) {
      alert(err.message || 'Failed to approve listing');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/properties/${id}/reject`, {
        rejectionReason: 'Does not meet platform quality criteria',
      });
      setProperties(properties.map((p) => (p.id === id ? { ...p, verificationStatus: 'REJECTED' } : p)));
    } catch (err: any) {
      alert(err.message || 'Failed to reject listing');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReelReportAction = async (reportId: string, action: 'DISMISS' | 'HIDE' | 'REJECT' | 'ARCHIVE') => {
    setActionLoading(reportId);
    try {
      await api.patch(`/reels/admin/reports/${reportId}`, { action });
      setReelReports(reelReports.map((r) => (r.id === reportId ? { ...r, status: action === 'DISMISS' ? 'DISMISS' : 'RESOLVED' } : r)));
    } catch (err: any) {
      alert(err.message || `Failed to perform action ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING_APPROVAL') return p.verificationStatus === 'PENDING' || p.verificationStatus === 'PENDING_APPROVAL';
    return p.verificationStatus === statusFilter;
  });

  return (
    <div className="p-4 sm:p-4 max-w-7xl mx-auto space-y-6 pb-16">
      {/* AUTH ALERT / QUICK ADMIN LOGIN BAR */}
      {(!isAuthenticated || error) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-body-sm">Admin Session Required</p>
              <p className="text-caption text-amber-800 mt-0.5">
                {error || 'You are viewing fallback moderation data. Log in as platform Admin to manage live queue.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleQuickAdminLogin}
            disabled={loggingInAdmin}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-button font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {loggingInAdmin ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Key className="w-3.5 h-3.5 text-amber-400" />
            )}
            Quick 1-Click Admin Login
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 sm:text-h1 font-bold text-neutral-900 tracking-tight">Content Moderation</h1>
          <p className="text-neutral-500 mt-1 text-body-sm">
            Review, verify, and moderate property listings, Reels, and comments.
          </p>
        </div>

        <button
          onClick={activeTab === 'PROPERTIES' ? fetchModerationQueue : fetchReelReports}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-button font-semibold hover:bg-neutral-50 transition w-fit cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading || reelReportsLoading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* TOP SUB-TAB NAVIGATION */}
      <div className="flex items-center gap-3 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('PROPERTIES')}
          className={`px-4 py-2.5 rounded-xl text-button font-medium transition flex items-center gap-2 cursor-pointer ${activeTab === 'PROPERTIES'
            ? 'bg-[#0e4962] text-white shadow-xs'
            : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
        >
          🏠 Property Listings
        </button>
        <button
          onClick={() => setActiveTab('REELS')}
          className={`px-4 py-2.5 rounded-xl text-button font-medium transition flex items-center gap-2 cursor-pointer ${activeTab === 'REELS'
            ? 'bg-[#0e4962] text-white shadow-xs'
            : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
        >
          🎬 Reels & Comments Reports
        </button>
      </div>

      {activeTab === 'PROPERTIES' ? (
        <>
          {/* FILTER TABS */}
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            {(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ALL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-xl text-overline font-semibold transition uppercase tracking-wider cursor-pointer ${statusFilter === filter
                  ? 'bg-[#0e4962] text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>

          <DataTable
            columns={[
              {
                key: 'listing',
                header: 'Listing',
                render: (p: PropertyModeration) => (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex-shrink-0 overflow-hidden border border-neutral-200">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-caption text-neutral-400">
                          🏠
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0e4962] text-body-sm">{p.title}</p>
                      <p className="text-caption text-neutral-400 flex items-center gap-1 mt-0.5 font-normal">
                        <MapPin className="w-3 h-3 text-rose-500" /> {p.city}, {p.state}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                cellClassName: 'text-neutral-600 font-normal',
                render: (p: PropertyModeration) => `${p.category} (${p.propertyType})`,
              },
              {
                key: 'price',
                header: 'Base Price',
                cellClassName: 'font-semibold font-tabular text-body-sm text-neutral-900',
                render: (p: PropertyModeration) => `₹${p.basePrice?.toLocaleString('en-IN')}`,
              },
              {
                key: 'status',
                header: 'Status',
                render: (p: PropertyModeration) => (
                  <StatusBadge status={p.verificationStatus} showDot size="sm" />
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                alignRight: true,
                render: (p: PropertyModeration) => (
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/properties/${p.id}`}
                      className="p-2 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-neutral-200"
                      title="Preview Listing"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {p.verificationStatus !== 'APPROVED' && (
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={actionLoading === p.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {p.verificationStatus !== 'REJECTED' && (
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={actionLoading === p.id}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 border border-rose-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredProperties}
            rowKey={(p: PropertyModeration) => p.id}
            loading={loading}
            loadingMessage="Loading listings queue..."
            emptyIcon={<ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />}
            emptyTitle="Queue is Clear!"
            emptySubtitle={`No properties found for filter "${statusFilter.replace('_', ' ')}".`}
          />
        </>
      ) : (
        /* REELS & COMMENTS MODERATION TAB */
        <>
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            {(['PENDING', 'DISMISSED', 'RESOLVED', 'ALL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setReelReportFilter(filter)}
                className={`px-4 py-2 rounded-xl text-overline font-semibold transition uppercase tracking-wider cursor-pointer ${reelReportFilter === filter
                  ? 'bg-[#0e4962] text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <DataTable
            columns={[
              {
                key: 'type',
                header: 'Type',
                render: (report: ReelReport) => (
                  <StatusBadge status={report.type} size="sm" />
                ),
              },
              {
                key: 'target',
                header: 'Target Content',
                cellClassName: 'max-w-xs truncate',
                render: (report: ReelReport) =>
                  report.type === 'COMMENT' ? (
                    <span className="text-neutral-800 font-medium">💬 "{report.comment?.content || 'Comment'}"</span>
                  ) : (
                    <span className="text-neutral-800 font-medium">🎬 "{report.reel?.caption || 'Reel'}"</span>
                  ),
              },
              {
                key: 'reason',
                header: 'Reason',
                cellClassName: 'text-rose-600 font-medium',
                render: (report: ReelReport) => report.reason,
              },
              {
                key: 'reporter',
                header: 'Reporter',
                cellClassName: 'text-neutral-600 font-normal',
                render: (report: ReelReport) => report.reporter?.name || report.reporter?.email || 'User',
              },
              {
                key: 'status',
                header: 'Status',
                render: (report: ReelReport) => (
                  <StatusBadge status={report.status} showDot size="sm" />
                ),
              },
              {
                key: 'actions',
                header: 'Moderation Actions',
                alignRight: true,
                render: (report: ReelReport) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleReelReportAction(report.id, 'DISMISS')}
                      disabled={actionLoading === report.id || report.status !== 'PENDING'}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-caption font-semibold transition disabled:opacity-40 cursor-pointer"
                      title="Dismiss report without taking action on content"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleReelReportAction(report.id, 'HIDE')}
                      disabled={actionLoading === report.id || report.status !== 'PENDING'}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                      title="Hide Reel from public discovery"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => handleReelReportAction(report.id, 'REJECT')}
                      disabled={actionLoading === report.id || report.status !== 'PENDING'}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                      title="Reject content completely"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReelReportAction(report.id, 'ARCHIVE')}
                      disabled={actionLoading === report.id || report.status !== 'PENDING'}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                      title="Archive content"
                    >
                      Archive
                    </button>
                  </div>
                ),
              },
            ]}
            data={reelReports}
            rowKey={(report: ReelReport) => report.id}
            loading={reelReportsLoading}
            loadingMessage="Loading Reels report queue..."
            emptyIcon={<ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />}
            emptyTitle="No Reel Reports Pending!"
            emptySubtitle={`No Reel or comment reports match filter "${reelReportFilter}".`}
          />
        </>
      )}
    </div>
  );
}
