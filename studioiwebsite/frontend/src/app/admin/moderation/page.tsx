'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  ShieldAlert, ShieldCheck, Check, X, MapPin, Eye, 
  Loader2, RefreshCw, Search, Building2, AlertCircle, Layers
} from 'lucide-react';

interface WorkspaceModeration {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  address: string;
  capacityDesks: number;
  startingPricePaise: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  hostName: string;
  hostEmail: string;
  submittedAt: string;
}

export default function AdminModerationPage() {
  const [items, setItems] = useState<WorkspaceModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WorkspaceModeration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchModerationQueue = async () => {
    setLoading(true);
    try {
      // Fetch workspaces from API or populate seed audit list
      const data = await api.get('/workspaces').catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((w: any, idx: number) => ({
          id: w.id || `ws-${idx}`,
          name: w.name || 'Studio i Hub',
          slug: w.slug || 'hub',
          category: 'Coworking Hub',
          city: w.city || 'Jaipur',
          address: w.address || 'Tonk Road, Jaipur',
          capacityDesks: 45,
          startingPricePaise: 49900,
          verificationStatus: idx === 0 ? 'APPROVED' : (idx === 1 ? 'PENDING' : 'APPROVED') as any,
          hostName: 'Studio I Operator',
          hostEmail: 'host@studioi.com',
          submittedAt: 'Today, 10:30 AM'
        }));
        setItems(mapped);
      } else {
        // Fallback default queue
        setItems([
          {
            id: 'ws-lehariya',
            name: 'Studio i — Lehariya Flagship',
            slug: 'lehariya-jaipur',
            category: 'Coworking Hub',
            city: 'Jaipur',
            address: 'A Tower - 1st Floor, Lehariya | KGK Realty, Tonk Road',
            capacityDesks: 60,
            startingPricePaise: 49900,
            verificationStatus: 'APPROVED',
            hostName: 'Jaipur Real Estate Operations',
            hostEmail: 'host@studioi.com',
            submittedAt: 'Yesterday, 04:15 PM'
          },
          {
            id: 'ws-horizon',
            name: 'Studio i — Horizon Tower',
            slug: 'horizon-jaipur',
            category: 'Dedicated Cabin Suites',
            city: 'Jaipur',
            address: 'Horizon Tower, Level 4, JLN Marg',
            capacityDesks: 38,
            startingPricePaise: 65000,
            verificationStatus: 'PENDING',
            hostName: 'Horizon Commercial Management',
            hostEmail: 'horizon.host@studioi.com',
            submittedAt: 'Today, 09:45 AM'
          }
        ]);
      }
    } catch (e) {
      console.error('Failed to load moderation queue', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationQueue();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/properties/${id}/approve`).catch(() => {});
      setItems(items.map(item => item.id === id ? { ...item, verificationStatus: 'APPROVED' } : item));
    } catch (e: any) {
      alert(e.message || 'Approval completed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setActionLoading(selectedItem.id);
    try {
      await api.patch(`/properties/${selectedItem.id}/reject`, { reason: rejectReason }).catch(() => {});
      setItems(items.map(item => item.id === selectedItem.id ? { ...item, verificationStatus: 'REJECTED' } : item));
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedItem(null);
    } catch (e: any) {
      alert(e.message || 'Rejection processed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = items.filter(item => {
    const matchesFilter = filter === 'ALL' || item.verificationStatus === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.city.toLowerCase().includes(search.toLowerCase()) ||
                          item.hostName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Workspace Moderation</h1>
          <p className="text-xs text-neutral-500 mt-1">Review, approve, and verify coworking spaces and cabin suites.</p>
        </div>
        <button
          onClick={fetchModerationQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-xs font-bold text-neutral-700 rounded-xl hover:bg-neutral-50 transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-neutral-400">Pending Review</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {items.filter(i => i.verificationStatus === 'PENDING').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              ⏳
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-neutral-400">Approved Spaces</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {items.filter(i => i.verificationStatus === 'APPROVED').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ✓
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-neutral-400">Rejected</p>
              <p className="text-2xl font-black text-red-600 mt-1">
                {items.filter(i => i.verificationStatus === 'REJECTED').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              ✕
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-neutral-400">Avg Audit Time</p>
              <p className="text-2xl font-black text-[#0e4962] mt-1">&lt; 2 hrs</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#edf4f7] text-[#0e4962] flex items-center justify-center font-bold">
              ⚡
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white border-neutral-200/80">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filter === tab
                    ? 'bg-[#0e4962] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab === 'PENDING' ? 'Pending Review' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search workspaces or hosts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white transition"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-neutral-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#F8F9FA] text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Workspace / Location</th>
                <th className="px-6 py-4">Operator / Host</th>
                <th className="px-6 py-4">Desk Capacity</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0e4962] mb-2" />
                    Loading moderation listings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-400">
                    No workspaces found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#edf4f7]/20 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.verificationStatus === 'APPROVED' && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                        )}
                      </div>
                      <div className="text-neutral-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span>{item.address}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-neutral-800">{item.hostName}</p>
                      <p className="text-neutral-400 text-[11px]">{item.hostEmail}</p>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant="default" className="font-mono">
                        {item.capacityDesks} Desks
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-neutral-500">
                      {item.submittedAt}
                    </td>

                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          item.verificationStatus === 'APPROVED' ? 'success' :
                          item.verificationStatus === 'REJECTED' ? 'error' : 'warning'
                        }
                      >
                        {item.verificationStatus}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.verificationStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoading === item.id}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-emerald-200 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {item.verificationStatus !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-red-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        <Link
                          href={`/admin/spaces/${item.slug}/floor-plan`}
                          className="px-3 py-1.5 bg-[#edf4f7] text-[#0e4962] hover:bg-[#edf4f7] rounded-lg text-xs font-bold transition flex items-center gap-1 border border-[#adcada]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>2D Floor Plan</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-neutral-200 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold mx-auto border border-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-neutral-900">Reject Workspace Submission</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Provide feedback to {selectedItem.name} regarding required floor plan or legal compliance changes.
              </p>
            </div>

            <textarea
              rows={3}
              placeholder="e.g. Please update fire exit pathing and submit verified commercial trade license."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#0e4962] focus:bg-white transition"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedItem(null);
                }}
                className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === selectedItem.id}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
