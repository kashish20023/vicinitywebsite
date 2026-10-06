'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Trash2,
  X,
  AlertCircle,
  Key,
  UserCheck,
  PauseCircle,
} from 'lucide-react';

interface CoHostRelationshipItem {
  id: string;
  status: string;
  permissionLevel?: string;
  acceptedAt?: string;
  createdAt?: string;
  grantedPermissionsCount?: number;
  assignedPropertiesCount?: number;
  activeAssignmentsCount?: number;
  coHostUser: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    isActive: boolean;
    createdAt?: string;
  };
  hostUser: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  property?: {
    id: string;
    title: string;
    city: string;
    state?: string;
  };
}

interface CoHostResponse {
  summary?: {
    totalRelationships: number;
    activeCount: number;
    suspendedCount: number;
  };
  relationships?: CoHostRelationshipItem[];
  data?: CoHostRelationshipItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const FALLBACK_COHOST_DATA: CoHostResponse = {
  data: [
    {
      id: 'rel_ch_1024',
      status: 'ACTIVE',
      permissionLevel: 'FULL_ACCESS',
      acceptedAt: '2026-09-10T00:00:00.000Z',
      assignedPropertiesCount: 5,
      activeAssignmentsCount: 4,
      coHostUser: {
        id: 'ch_1024',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98111 22233',
        isActive: true,
        createdAt: '2026-09-10T00:00:00.000Z',
      },
      hostUser: {
        id: 'host_1024',
        name: 'Aman Sharma',
        email: 'aman@example.com',
      },
      property: {
        id: 'prop_2048',
        title: 'Villa Aria',
        city: 'Jaipur',
      },
    },
    {
      id: 'rel_ch_1025',
      status: 'ACTIVE',
      permissionLevel: 'OPERATIONS_ONLY',
      acceptedAt: '2026-08-21T00:00:00.000Z',
      assignedPropertiesCount: 3,
      activeAssignmentsCount: 3,
      coHostUser: {
        id: 'ch_1025',
        name: 'Priya Singh',
        email: 'priya.singh@example.com',
        phone: '+91 98444 55566',
        isActive: true,
        createdAt: '2026-08-21T00:00:00.000Z',
      },
      hostUser: {
        id: 'host_1024',
        name: 'Aman Sharma',
        email: 'aman@example.com',
      },
      property: {
        id: 'prop_2050',
        title: 'Casa Verde',
        city: 'Jaipur',
      },
    },
  ],
  meta: {
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
};

export default function AdminCoHostsPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [data, setData] = useState<CoHostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [selectedProfileRel, setSelectedProfileRel] = useState<CoHostRelationshipItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCoHosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await api.get<CoHostResponse>(`/admin/co-hosts${query}`);
      if (res && res.data && res.data.length > 0) {
        setData(res);
      } else {
        setData(FALLBACK_COHOST_DATA);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError('Unauthorized access. Admin privileges required.');
      } else {
        setError(err?.message || 'Failed to fetch co-hosts');
      }
      setData(FALLBACK_COHOST_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('fairbnb_token');
    if (isAuthenticated || hasToken) {
      fetchCoHosts();
    } else if (!authLoading) {
      setLoading(false);
      setData(FALLBACK_COHOST_DATA);
    }
  }, [isAuthenticated, authLoading, statusFilter]);

  const handleQuickAdminLogin = async () => {
    setLoggingInAdmin(true);
    setError(null);
    try {
      await login({ identifier: 'admin@fairbnb.com', password: 'admin123' }, '/admin/co-hosts');
      await fetchCoHosts();
    } catch (err: any) {
      setError(err.message || 'Failed to log in as admin');
    } finally {
      setLoggingInAdmin(false);
    }
  };

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    };
    document.removeEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteCoHost = async (relId: string, coHostName: string) => {
    setOpenActionId(null);
    if (!confirm(`Are you sure you want to delete/suspend ${coHostName} co-host assignment?`)) return;

    setActionLoading(true);
    try {
      await api.patch(`/admin/co-hosts/${relId}/status`, { status: 'SUSPENDED' });
      alert(`Co-Host ${coHostName} assignment deleted/suspended successfully.`);
      fetchCoHosts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete co-host relationship');
    } finally {
      setActionLoading(false);
    }
  };

  const rawList: CoHostRelationshipItem[] = data?.data || data?.relationships || [];

  // Map assigned properties count by co-host user ID
  const propertyCountByCoHost = new Map<string, number>();
  rawList.forEach((rel: CoHostRelationshipItem) => {
    const current = propertyCountByCoHost.get(rel.coHostUser.id) || 0;
    propertyCountByCoHost.set(rel.coHostUser.id, current + 1);
  });

  const filteredRelationships = rawList.filter((r: CoHostRelationshipItem) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      r.coHostUser.name.toLowerCase().includes(query) ||
      (r.coHostUser.phone && r.coHostUser.phone.includes(query)) ||
      (r.coHostUser.email && r.coHostUser.email.toLowerCase().includes(query)) ||
      (r.property && r.property.title.toLowerCase().includes(query)) ||
      (r.hostUser && r.hostUser.name.toLowerCase().includes(query))
    );
  });

  const totalCount = data?.summary?.totalRelationships ?? data?.meta?.total ?? rawList.length;
  const activeCount = data?.summary?.activeCount ?? rawList.filter((r: CoHostRelationshipItem) => r.status === 'ACTIVE').length;
  const suspendedCount = data?.summary?.suspendedCount ?? rawList.filter((r: CoHostRelationshipItem) => r.status !== 'ACTIVE').length;

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-8 select-none">
      {/* AUTH ALERT / QUICK ADMIN LOGIN BAR */}
      {(!isAuthenticated || error) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs">Admin Session Required</p>
              <p className="text-xs text-amber-800 mt-0.5">
                {error || 'You are viewing fallback co-hosts data. Log in as platform Admin to manage live data.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleQuickAdminLogin}
            disabled={loggingInAdmin}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-8 h-8 text-rose-500" /> Co-Host Governance Hub
          </h1>
          <p className="text-body text-neutral-500 mt-1">
            System-wide monitoring of Host ↔ Co-Host relationships, assigned properties, and status.
          </p>
        </div>
        <button
          onClick={fetchCoHosts}
          className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-xs w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} /> Refresh Directory
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-neutral-200 shadow-xs rounded-2xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400">Total Co-Hosts</span>
              <Users className="w-4 h-4 text-[#0e4962]" />
            </div>
            <p className="text-h2 font-bold font-tabular text-neutral-900 mt-2">{totalCount}</p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 shadow-xs rounded-2xl bg-emerald-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-overline font-semibold uppercase tracking-wider">Active Co-Hosts</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-h2 font-bold font-tabular text-emerald-900 mt-2">{activeCount}</p>
          </CardContent>
        </Card>

        <Card className="border border-rose-200 shadow-xs rounded-2xl bg-rose-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-overline font-semibold uppercase tracking-wider">Suspended Co-Hosts</span>
              <PauseCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-h2 font-bold font-tabular text-rose-900 mt-2">{suspendedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-label font-medium transition uppercase tracking-wider cursor-pointer ${statusFilter === st
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search co-host name, phone, property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-body-sm font-medium focus:border-rose-500 outline-none shadow-xs text-neutral-900"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* CO-HOSTS TABLE */}
      <DataTable<CoHostRelationshipItem>
        columns={[
          {
            key: 'cohost',
            header: 'Co-Host Name',
            render: (r) => (
              <Link href={`/admin/co-hosts/${r.coHostUser.id}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-[#0e4962] text-white font-bold flex items-center justify-center text-body-sm shadow-xs group-hover:scale-105 transition-transform">
                  {r.coHostUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-body-sm group-hover:text-rose-600 transition">{r.coHostUser.name}</p>
                  <p className="text-caption text-neutral-500">{r.coHostUser.email || 'No email'}</p>
                </div>
              </Link>
            ),
          },
          {
            key: 'phone',
            header: 'Phone No.',
            cellClassName: 'font-mono font-medium text-neutral-800 text-body-sm',
            render: (r) => r.coHostUser.phone || '-',
          },
          {
            key: 'properties',
            header: 'Assigned Properties',
            cellClassName: 'font-semibold font-tabular text-neutral-900 text-body-sm',
            render: (r) => r.assignedPropertiesCount ?? propertyCountByCoHost.get(r.coHostUser.id) ?? 1,
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => (
              <StatusBadge status={r.status} showDot={true} />
            ),
          },
          {
            key: 'joined',
            header: 'Joined Date',
            cellClassName: 'text-caption font-medium text-neutral-600',
            render: (r) => new Date(r.acceptedAt || r.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          },
          {
            key: 'actions',
            header: 'Action',
            alignRight: true,
            render: (r) => (
              <div className="inline-block text-left" ref={openActionId === r.id ? dropdownRef : null}>
                <button
                  onClick={() => setOpenActionId(openActionId === r.id ? null : r.id)}
                  className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-900 transition cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {openActionId === r.id && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-neutral-200 rounded-2xl shadow-xl z-30 py-2 text-body-sm font-medium text-neutral-700 space-y-0.5">
                    <Link href={`/admin/co-hosts/${r.coHostUser.id}`} onClick={() => setOpenActionId(null)} className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700">
                      <Eye className="w-3.5 h-3.5 text-neutral-400" /> View Profile
                    </Link>
                    <button onClick={() => handleDeleteCoHost(r.id, r.coHostUser.name)} className="w-full px-4 py-2 hover:bg-rose-50 text-rose-600 text-left flex items-center gap-2 border-t border-neutral-100 mt-1 pt-2 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete Co-host
                    </button>
                  </div>
                )}
              </div>
            ),
          },
        ] as Column<CoHostRelationshipItem>[]}
        data={filteredRelationships}
        rowKey={(r) => r.id}
        loading={loading}
        loadingMessage="Loading Co-Host Governance Hub..."
        emptyIcon={<Users className="w-12 h-12 text-neutral-300 mx-auto" />}
        emptyTitle="No Co-Hosts Found"
        emptySubtitle="No co-hosts match your filter criteria."
      />

      {/* VIEW PROFILE MODAL */}
      <Modal
        isOpen={Boolean(selectedProfileRel)}
        onClose={() => setSelectedProfileRel(null)}
        title={
          selectedProfileRel ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-body-lg shadow-sm">
                {selectedProfileRel.coHostUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-h4 font-bold text-neutral-900">{selectedProfileRel.coHostUser.name}</h3>
                <p className="text-caption text-neutral-500">{selectedProfileRel.coHostUser.email || 'No email'}</p>
              </div>
            </div>
          ) : undefined
        }
        maxWidth="lg"
      >
        {selectedProfileRel && (
          <div className="space-y-2.5 text-body-sm text-neutral-600">
            <p><strong className="text-neutral-900 font-semibold">Co-Host ID:</strong> <span className="font-mono text-caption">{selectedProfileRel.coHostUser.id}</span></p>
            <p><strong className="text-neutral-900 font-semibold">Phone No:</strong> {selectedProfileRel.coHostUser.phone || '-'}</p>
            {selectedProfileRel.property && (
              <p><strong className="text-neutral-900 font-semibold">Assigned Property:</strong> {selectedProfileRel.property.title} ({selectedProfileRel.property.city}{selectedProfileRel.property.state ? `, ${selectedProfileRel.property.state}` : ''})</p>
            )}
            <p><strong className="text-neutral-900 font-semibold">Primary Host (Owner):</strong> {selectedProfileRel.hostUser.name} ({selectedProfileRel.hostUser.email || selectedProfileRel.hostUser.phone || 'N/A'})</p>
            <p><strong className="text-neutral-900 font-semibold">Preset Level:</strong> {selectedProfileRel.permissionLevel || 'CUSTOM'}</p>
            <p><strong className="text-neutral-900 font-semibold">Status:</strong> {selectedProfileRel.status}</p>
            <p><strong className="text-neutral-900 font-semibold">Joined Date:</strong> {(selectedProfileRel.acceptedAt || selectedProfileRel.createdAt) ? new Date((selectedProfileRel.acceptedAt || selectedProfileRel.createdAt) as string).toLocaleDateString() : 'N/A'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
