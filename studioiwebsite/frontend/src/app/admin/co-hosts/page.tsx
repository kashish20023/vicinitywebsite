'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { 
  Users, Building2, ShieldCheck, CheckCircle2, AlertTriangle, 
  Search, ExternalLink, MoreVertical, Ban, RefreshCw, Eye, 
  Percent, DollarSign, Calendar, MessageSquare, Wrench, Shield,
  Mail, Clock, Check, X, Sparkles, Filter
} from 'lucide-react';

interface CoHostRecord {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    role?: string;
    isBlocked?: boolean;
  };
  workspace: {
    id: string;
    name: string;
    city: string;
    address?: string;
    host?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  canManageListing: boolean;
  canViewFinances: boolean;
  canManageBookings: boolean;
  canManageCalendar: boolean;
  canManageMaintenance: boolean;
  canMessageGuests: boolean;
  splitPercentage?: number;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

interface PendingInvite {
  id: string;
  inviteeEmail: string;
  token: string;
  permissions: any;
  status: string;
  expiresAt: string;
  workspace?: {
    id: string;
    name: string;
    city: string;
    host?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

const MOCK_COHOSTS: CoHostRecord[] = [
  {
    id: 'ch-perm-01',
    user: {
      id: 'usr-cohost-01',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@studioi.com',
      phone: '+91 98290 88776',
      avatarUrl: '/avatars/avatar-rajesh.jpg',
      role: 'HOST',
    },
    workspace: {
      id: 'ws-lehariya-01',
      name: 'Studio i Flagship - Lehariya Hub',
      city: 'Jaipur',
      address: 'Plot 4, MI Road, C-Scheme',
      host: {
        id: 'host-01',
        name: 'Shyam Media Group',
        email: 'contact@shyammediagroup.com',
        phone: '+91 98290 12345',
      },
    },
    canManageListing: true,
    canViewFinances: false,
    canManageBookings: true,
    canManageCalendar: true,
    canManageMaintenance: true,
    canMessageGuests: true,
    splitPercentage: 15,
    status: 'ACTIVE',
    createdAt: '2026-01-15T10:30:00Z',
  },
  {
    id: 'ch-perm-02',
    user: {
      id: 'usr-cohost-02',
      name: 'Neha Gupta',
      email: 'neha.gupta@studioi.com',
      phone: '+91 94140 11223',
      avatarUrl: '/avatars/avatar-neha.jpg',
      role: 'HOST',
    },
    workspace: {
      id: 'ws-vaishali-02',
      name: 'Studio i Prestige - Vaishali Nagar',
      city: 'Jaipur',
      address: 'Gandhi Path West, Vaishali',
      host: {
        id: 'host-02',
        name: 'Priya Mehta',
        email: 'priya.mehta@studioi.com',
        phone: '+91 94140 98765',
      },
    },
    canManageListing: true,
    canViewFinances: true,
    canManageBookings: true,
    canManageCalendar: true,
    canManageMaintenance: true,
    canMessageGuests: true,
    splitPercentage: 20,
    status: 'ACTIVE',
    createdAt: '2026-02-01T14:15:00Z',
  },
  {
    id: 'ch-perm-03',
    user: {
      id: 'usr-cohost-03',
      name: 'Karan Patel',
      email: 'karan.patel@gmail.com',
      phone: '+91 99820 55441',
      role: 'USER',
    },
    workspace: {
      id: 'ws-tonk-03',
      name: 'Studio i Tech Park - Tonk Road',
      city: 'Jaipur',
      address: 'Tonk Road Commercial Arcade',
      host: {
        id: 'host-01',
        name: 'Shyam Media Group',
        email: 'contact@shyammediagroup.com',
        phone: '+91 98290 12345',
      },
    },
    canManageListing: false,
    canViewFinances: false,
    canManageBookings: true,
    canManageCalendar: true,
    canManageMaintenance: true,
    canMessageGuests: true,
    splitPercentage: 10,
    status: 'ACTIVE',
    createdAt: '2026-02-18T09:00:00Z',
  },
  {
    id: 'ch-perm-04',
    user: {
      id: 'usr-cohost-04',
      name: 'Amit Verma',
      email: 'amit.verma@operators.in',
      phone: '+91 97830 33221',
      avatarUrl: '/avatars/avatar-amit.jpg',
      role: 'HOST',
    },
    workspace: {
      id: 'ws-lehariya-01',
      name: 'Studio i Flagship - Lehariya Hub',
      city: 'Jaipur',
      address: 'Plot 4, MI Road, C-Scheme',
      host: {
        id: 'host-01',
        name: 'Shyam Media Group',
        email: 'contact@shyammediagroup.com',
        phone: '+91 98290 12345',
      },
    },
    canManageListing: true,
    canViewFinances: false,
    canManageBookings: false,
    canManageCalendar: false,
    canManageMaintenance: true,
    canMessageGuests: false,
    splitPercentage: 8,
    status: 'SUSPENDED',
    createdAt: '2026-03-01T16:45:00Z',
  },
];

const MOCK_PENDING_INVITATIONS: PendingInvite[] = [
  {
    id: 'inv-01',
    inviteeEmail: 'cohost.operator@gmail.com',
    token: 'b492a54fb2764c92a95c92842e47e812f8ad',
    permissions: {
      canManageListing: true,
      canManageBookings: true,
      canManageCalendar: true,
      canMessageGuests: true,
      canManageMaintenance: true,
      canViewFinances: false,
    },
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    workspace: {
      id: 'ws-lehariya-01',
      name: 'Studio i Flagship - Lehariya Hub',
      city: 'Jaipur',
      host: {
        id: 'host-01',
        name: 'Shyam Media Group',
        email: 'contact@shyammediagroup.com',
      },
    },
  },
  {
    id: 'inv-02',
    inviteeEmail: 'facility.manager.jpr@hotmail.com',
    token: '79efc440a18e47bf92348a14b9c1d0932e67',
    permissions: {
      canManageListing: false,
      canManageBookings: false,
      canManageCalendar: false,
      canMessageGuests: true,
      canManageMaintenance: true,
      canViewFinances: false,
    },
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    workspace: {
      id: 'ws-vaishali-02',
      name: 'Studio i Prestige - Vaishali Nagar',
      city: 'Jaipur',
      host: {
        id: 'host-02',
        name: 'Priya Mehta',
        email: 'priya.mehta@studioi.com',
      },
    },
  },
];

export default function AdminCoHostsPage() {
  const [cohosts, setCohosts] = useState<CoHostRecord[]>(MOCK_COHOSTS);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(MOCK_PENDING_INVITATIONS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCoHost, setSelectedCoHost] = useState<CoHostRecord | null>(null);

  const fetchCoHosts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any>('/admin/co-hosts');
      if (data && data.cohosts) {
        setCohosts(
          data.cohosts.map((ch: any) => ({
            ...ch,
            status: ch.user?.isBlocked ? 'SUSPENDED' : 'ACTIVE',
            splitPercentage: ch.splitPercentage || 15,
          }))
        );
      }
      if (data && data.pendingInvitations) {
        setPendingInvites(data.pendingInvitations);
      }
    } catch (err) {
      console.warn('Backend live co-host sync fallback to mock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoHosts();
  }, []);

  const toggleCoHostStatus = (id: string) => {
    setCohosts(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextStatus = c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const filteredCohosts = cohosts.filter(c => {
    if (activeTab === 'ACTIVE' && c.status !== 'ACTIVE') return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.user.name.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      c.workspace.name.toLowerCase().includes(q) ||
      c.workspace.host?.name.toLowerCase().includes(q)
    );
  });

  const filteredInvites = pendingInvites.filter(i => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      i.inviteeEmail.toLowerCase().includes(q) ||
      (i.workspace?.name && i.workspace.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              Co-Host Delegated RBAC
            </span>
            <span className="text-xs text-neutral-400 font-medium">Contextual Property Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Co-Host Network & Delegation Directory
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Audit platform property delegates, granular 18-permission contracts, operational scopes, primary host authorizations, and automated revenue splits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoHosts}
            className="p-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl transition cursor-pointer shadow-xs"
            title="Refresh Co-Hosts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search co-host, property, host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Co-Hosts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {cohosts.filter(c => c.status === 'ACTIVE').length} Delegates
          </div>
          <div className="text-[11px] font-semibold text-purple-600 mt-1">
            Across {new Set(cohosts.map(c => c.workspace.id)).size} Properties
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Invites</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {pendingInvites.length} Awaiting Acceptance
          </div>
          <div className="text-[11px] font-semibold text-neutral-500 mt-1">
            7-day cryptographic tokens
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Split Agreement</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {(cohosts.reduce((acc, c) => acc + (c.splitPercentage || 15), 0) / (cohosts.length || 1)).toFixed(1)}% Share
          </div>
          <div className="text-[11px] font-semibold text-neutral-500 mt-1">
            Direct host settlement split
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Security Architecture</span>
            <div className="w-8 h-8 rounded-xl bg-[#edf4f7] text-[#0e4962] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900">Scoped RBAC</div>
          <div className="text-[11px] font-semibold text-[#0e4962] mt-1">
            Property-level isolation
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          All Delegations ({cohosts.length})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Active Co-Hosts ({cohosts.filter(c => c.status === 'ACTIVE').length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Pending Invitations ({pendingInvites.length})
        </button>
      </div>

      {/* Main Content: Co-Hosts Table or Pending Invites */}
      {activeTab !== 'PENDING' ? (
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[10px] uppercase font-extrabold text-neutral-400 border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-6">Co-Host Name & Contact</th>
                  <th className="py-3.5 px-4">Assigned Workspace</th>
                  <th className="py-3.5 px-4">Primary Host (Owner)</th>
                  <th className="py-3.5 px-4">Delegated Capabilities</th>
                  <th className="py-3.5 px-4">Split Agreement</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCohosts.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>{c.user.name}</span>
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-extrabold rounded-md">
                              CO-HOST
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400">{c.user.email}</div>
                          {c.user.phone && <div className="text-[10px] text-neutral-400">{c.user.phone}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-neutral-900">{c.workspace.name}</div>
                      <div className="text-[11px] text-neutral-400">{c.workspace.city} • {c.workspace.address}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-neutral-800">{c.workspace.host?.name || 'Primary Host'}</div>
                      <div className="text-[11px] text-neutral-400">{c.workspace.host?.email}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.canManageListing && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[9px] font-bold">
                            Listings
                          </span>
                        )}
                        {c.canManageBookings && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[9px] font-bold">
                            Bookings
                          </span>
                        )}
                        {c.canManageCalendar && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[9px] font-bold">
                            Calendar
                          </span>
                        )}
                        {c.canMessageGuests && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-bold">
                            Messages
                          </span>
                        )}
                        {c.canManageMaintenance && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[9px] font-bold">
                            Maintenance
                          </span>
                        )}
                        {c.canViewFinances ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[9px] font-bold">
                            Finances
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-400 rounded-md text-[9px] font-semibold line-through">
                            Finances
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                        {c.splitPercentage}% Split
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCoHost(c)}
                        className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-600" /> Inspect
                      </button>
                      <button
                        onClick={() => toggleCoHostStatus(c.id)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                          c.status === 'ACTIVE'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Pending Invitations View */
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[10px] uppercase font-extrabold text-neutral-400 border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-6">Invitee Email</th>
                  <th className="py-3.5 px-4">Target Workspace</th>
                  <th className="py-3.5 px-4">Primary Host</th>
                  <th className="py-3.5 px-4">Invited Permissions</th>
                  <th className="py-3.5 px-4">Expires In</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Invite Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredInvites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-amber-50/20 transition">
                    <td className="py-4 px-6 font-bold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-500" />
                        <span>{inv.inviteeEmail}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-neutral-800">
                      {inv.workspace?.name || 'Workspace'}
                    </td>

                    <td className="py-4 px-4 text-neutral-600">
                      {inv.workspace?.host?.name || 'Primary Host'}
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-[11px] text-neutral-500">
                        {Object.entries(inv.permissions || {})
                          .filter(([_, val]) => !!val)
                          .map(([key]) => key.replace('can', ''))
                          .join(', ')}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-neutral-500 font-mono text-[11px]">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-mono text-[10px] text-neutral-400">
                      {inv.token.substring(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Permissions Modal */}
      {selectedCoHost && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900">Co-Host Delegation Details</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{selectedCoHost.user.name} • {selectedCoHost.workspace.name}</p>
              </div>
              <button
                onClick={() => setSelectedCoHost(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Primary Host</span>
                  <div className="font-bold text-neutral-900 mt-0.5">{selectedCoHost.workspace.host?.name}</div>
                  <div className="text-[11px] text-neutral-500">{selectedCoHost.workspace.host?.email}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Compensation Split</span>
                  <div className="font-bold text-emerald-700 mt-0.5">{selectedCoHost.splitPercentage}% of Gross Payout</div>
                  <div className="text-[11px] text-neutral-500">Automated Ledger Allocation</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400">Granted Capability Matrix</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${selectedCoHost.canManageListing ? 'bg-purple-50/60 border-purple-200 text-purple-900' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Manage Listing & Photos</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${selectedCoHost.canManageBookings ? 'bg-purple-50/60 border-purple-200 text-purple-900' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Manage Reservations</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${selectedCoHost.canManageCalendar ? 'bg-purple-50/60 border-purple-200 text-purple-900' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Calendar & Availability</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${selectedCoHost.canMessageGuests ? 'bg-purple-50/60 border-purple-200 text-purple-900' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Guest Messaging</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${selectedCoHost.canManageMaintenance ? 'bg-purple-50/60 border-purple-200 text-purple-900' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Wrench className="w-4 h-4 shrink-0" />
                    <span>Maintenance & Issues</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${selectedCoHost.canViewFinances ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>View Financial Payouts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setSelectedCoHost(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
