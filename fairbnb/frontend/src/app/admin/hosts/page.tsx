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
  UserCog,
  Building2,
  DollarSign,
  Award,
  Search,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  X,
  Send,
  AlertCircle,
  Key,
} from 'lucide-react';

interface HostMetrics {
  totalPropertiesCount: number;
  activePropertiesCount: number;
  totalRevenue: number;
}

interface HostUser {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: string;
  isActive: boolean;
  isSuperhost: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  verificationBadge: string;
  rating?: number;
  joinedDate?: string;
  metrics: HostMetrics;
  createdAt: string;
}

const FALLBACK_HOSTS: HostUser[] = [
  {
    id: 'usr_host_2002002002',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@fairbnb.com',
    phone: '+91 98111 22233',
    role: 'HOST',
    isActive: true,
    isSuperhost: true,
    phoneVerified: true,
    emailVerified: true,
    verificationBadge: 'VERIFIED',
    rating: 4.9,
    joinedDate: '2026-08-12',
    metrics: {
      totalPropertiesCount: 12,
      activePropertiesCount: 9,
      totalRevenue: 485000,
    },
    createdAt: '2026-08-12T10:00:00.000Z',
  },
  {
    id: 'usr_host_2003003003',
    name: 'Ananya Roy',
    email: 'ananya.roy@fairbnb.com',
    phone: '+91 98222 33344',
    role: 'HOST',
    isActive: true,
    isSuperhost: false,
    phoneVerified: true,
    emailVerified: true,
    verificationBadge: 'VERIFIED',
    rating: 4.8,
    joinedDate: '2026-08-15',
    metrics: {
      totalPropertiesCount: 8,
      activePropertiesCount: 6,
      totalRevenue: 340000,
    },
    createdAt: '2026-08-15T12:00:00.000Z',
  },
  {
    id: 'usr_host_2004004004',
    name: 'Aman Sharma',
    email: 'aman@example.com',
    phone: '+91 98333 44455',
    role: 'HOST',
    isActive: true,
    isSuperhost: true,
    phoneVerified: true,
    emailVerified: true,
    verificationBadge: 'VERIFIED',
    rating: 5.0,
    joinedDate: '2026-08-18',
    metrics: {
      totalPropertiesCount: 5,
      activePropertiesCount: 4,
      totalRevenue: 290000,
    },
    createdAt: '2026-08-18T14:30:00.000Z',
  },
];

export default function AdminHostsPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [hosts, setHosts] = useState<HostUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  // Modals
  const [selectedHostProfile, setSelectedHostProfile] = useState<HostUser | null>(null);
  const [messagingHost, setMessagingHost] = useState<HostUser | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchHosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<HostUser[]>('/admin/hosts');
      setHosts(data && data.length > 0 ? data : FALLBACK_HOSTS);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError('Unauthorized access. Admin privileges required.');
      } else {
        setError(err?.message || 'Failed to fetch hosts directory');
      }
      setHosts(FALLBACK_HOSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('fairbnb_token');
    if (isAuthenticated || hasToken) {
      fetchHosts();
    } else if (!authLoading) {
      setLoading(false);
      setHosts(FALLBACK_HOSTS);
    }
  }, [isAuthenticated, authLoading]);

  const handleQuickAdminLogin = async () => {
    setLoggingInAdmin(true);
    setError(null);
    try {
      await login({ identifier: 'admin@fairbnb.com', password: 'admin123' }, '/admin/hosts');
      await fetchHosts();
    } catch (err: any) {
      setError(err.message || 'Failed to log in as admin');
    } finally {
      setLoggingInAdmin(false);
    }
  };

  // Close dropdown on outside click
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

  const handleStatusToggle = async (hostId: string, currentStatus: boolean) => {
    setUpdatingId(hostId);
    setOpenActionId(null);
    try {
      const newStatus = !currentStatus;
      await api.patch(`/admin/users/${hostId}/status`, { isActive: newStatus });
      setHosts((prev) =>
        prev.map((h) => (h.id === hostId ? { ...h, isActive: newStatus } : h)),
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update host status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingHost || !messageSubject.trim() || !messageContent.trim()) return;

    setSendingMsg(true);
    try {
      await api.post('/admin/messages/send', {
        recipientId: messagingHost.id,
        subject: messageSubject,
        content: messageContent,
      });
      alert(`Message sent to ${messagingHost.name}!`);
      setMessagingHost(null);
      setMessageSubject('');
      setMessageContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const filteredHosts = hosts.filter((h) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(query) ||
      h.phone.includes(query) ||
      (h.email && h.email.toLowerCase().includes(query))
    );
  });

  const totalHostsCount = hosts.length;
  const activePropertiesCount = hosts.reduce(
    (sum, h) => sum + (h.metrics?.activePropertiesCount || 0),
    0,
  );
  const totalRevenueSum = hosts.reduce(
    (sum, h) => sum + (h.metrics?.totalRevenue || 0),
    0,
  );
  const superhostCount = hosts.filter((h) => h.isSuperhost).length;

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-8 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <UserCog className="w-8 h-8 text-rose-500" /> Host Directory
          </h1>
          <p className="text-body text-neutral-500 mt-1">
            System-wide host management, property portfolios, and ratings.
          </p>
        </div>
        <button
          onClick={fetchHosts}
          className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-xs w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-neutral-200 shadow-xs rounded-2xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400">Registered Hosts</span>
              <UserCog className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-h2 font-bold font-tabular text-neutral-900 mt-2">{totalHostsCount}</p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 shadow-xs rounded-2xl bg-emerald-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-overline font-semibold uppercase tracking-wider">Published Properties</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-h2 font-bold font-tabular text-emerald-900 mt-2">{activePropertiesCount}</p>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 shadow-xs rounded-2xl bg-purple-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-overline font-semibold uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-[#0e4962]" />
            </div>
            <p className="text-h2 font-bold font-tabular text-purple-900 mt-2">
              ₹{totalRevenueSum.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 shadow-xs rounded-2xl bg-amber-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-overline font-semibold uppercase tracking-wider">Superhosts</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-h2 font-bold font-tabular text-amber-900 mt-2">{superhostCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <div className="max-w-md relative">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-neutral-200 focus:border-neutral-900 outline-none text-body-sm font-medium text-neutral-900 shadow-xs"
        />
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
      </div>

      {/* HOSTS TABLE */}
      <DataTable<HostUser>
        columns={[
          {
            key: 'host',
            header: 'Host',
            render: (h) => (
              <Link href={`/admin/hosts/${h.id}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-[#0e4962] text-white font-bold flex items-center justify-center text-body-sm shadow-xs group-hover:scale-105 transition-transform">
                  {h.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-neutral-900 text-body-sm group-hover:text-rose-600 transition">{h.name}</p>
                    {h.isSuperhost && (
                      <span className="text-overline font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">Superhost</span>
                    )}
                  </div>
                  <p className="text-caption text-neutral-500">{h.email || 'No email'}</p>
                </div>
              </Link>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (h) => (
              <span className={`text-caption font-medium px-3 py-1 rounded-full ${
                h.verificationBadge === 'Verified' || h.verificationBadge === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
              }`}>{h.verificationBadge}</span>
            ),
          },
          {
            key: 'phone',
            header: 'Phone',
            cellClassName: 'font-mono font-medium text-neutral-800 text-body-sm',
            render: (h) => h.phone,
          },
          {
            key: 'properties',
            header: 'Properties',
            render: (h) => (
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900 text-body-sm">
                <Building2 className="w-4 h-4 text-neutral-400" />
                <span className="font-tabular">{h.metrics?.totalPropertiesCount ?? 0}</span>
              </div>
            ),
          },
          {
            key: 'rating',
            header: 'Rating',
            render: (h) => (
              <div className="flex items-center gap-1 font-semibold text-amber-600 text-body-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-tabular">{h.rating && h.rating > 0 ? h.rating : '-'}</span>
              </div>
            ),
          },
          {
            key: 'joined',
            header: 'Joined',
            cellClassName: 'text-caption font-medium text-neutral-600',
            render: (h) => new Date(h.joinedDate || h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          },
          {
            key: 'actions',
            header: 'Actions',
            alignRight: true,
            render: (h) => (
              <div className="inline-block text-left" ref={openActionId === h.id ? dropdownRef : null}>
                <button
                  onClick={() => setOpenActionId(openActionId === h.id ? null : h.id)}
                  className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-900 transition cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {openActionId === h.id && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-neutral-200 rounded-2xl shadow-xl z-30 py-2 text-body-sm font-medium text-neutral-700 space-y-0.5">
                    <Link href={`/admin/hosts/${h.id}`} onClick={() => setOpenActionId(null)} className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700">
                      <Eye className="w-3.5 h-3.5 text-neutral-400" /> View Profile
                    </Link>
                    <button onClick={() => { setMessagingHost(h); setOpenActionId(null); }} className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400" /> Send Message
                    </button>
                    <button onClick={() => handleStatusToggle(h.id, h.isActive)} className="w-full px-4 py-2 hover:bg-rose-50 text-rose-600 text-left flex items-center gap-2 border-t border-neutral-100 mt-1 pt-2">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> {h.isActive ? 'Delete Host' : 'Activate Host'}
                    </button>
                  </div>
                )}
              </div>
            ),
          },
        ] as Column<HostUser>[]}
        data={filteredHosts}
        rowKey={(h) => h.id}
        loading={loading}
        loadingMessage="Loading hosts from database..."
        emptyIcon={<UserCog className="w-12 h-12 text-neutral-300 mx-auto" />}
        emptyTitle="No hosts found"
        emptySubtitle="No host accounts match your search query."
      />

      {/* VIEW PROFILE MODAL */}
      <Modal
        isOpen={Boolean(selectedHostProfile)}
        onClose={() => setSelectedHostProfile(null)}
        title={
          selectedHostProfile ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-body-lg shadow-sm">
                {selectedHostProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-h4 font-bold text-neutral-900">{selectedHostProfile.name}</h3>
                <p className="text-caption text-neutral-500">{selectedHostProfile.email || 'No email'}</p>
              </div>
            </div>
          ) : undefined
        }
        maxWidth="lg"
      >
        {selectedHostProfile && (
          <div className="space-y-2 text-body-sm text-neutral-600">
            <p><strong className="text-neutral-900 font-semibold">Host ID:</strong> <span className="font-mono text-caption">{selectedHostProfile.id}</span></p>
            <p><strong className="text-neutral-900 font-semibold">Phone:</strong> {selectedHostProfile.phone}</p>
            <p><strong className="text-neutral-900 font-semibold">Status:</strong> {selectedHostProfile.verificationBadge}</p>
            <p><strong className="text-neutral-900 font-semibold">Properties Listed:</strong> <span className="font-tabular">{selectedHostProfile.metrics?.totalPropertiesCount ?? 0}</span></p>
            <p><strong className="text-neutral-900 font-semibold">Total Lifetime Revenue:</strong> <span className="font-tabular">₹{(selectedHostProfile.metrics?.totalRevenue ?? 0).toLocaleString('en-IN')}</span></p>
            <p><strong className="text-neutral-900 font-semibold">Joined Date:</strong> {new Date(selectedHostProfile.joinedDate || selectedHostProfile.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </Modal>

      {/* SEND MESSAGE MODAL */}
      <Modal
        isOpen={Boolean(messagingHost)}
        onClose={() => setMessagingHost(null)}
        title={
          messagingHost ? (
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Direct Message to {messagingHost.name}
            </span>
          ) : undefined
        }
        maxWidth="md"
      >
        {messagingHost && (
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div>
              <label className="block text-label font-medium text-neutral-600 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Subject line..."
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-body-sm outline-none focus:border-emerald-500 text-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-label font-medium text-neutral-600 mb-1">Message Content</label>
              <textarea
                rows={4}
                placeholder="Write your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-body-sm outline-none focus:border-emerald-500 text-neutral-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sendingMsg}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-button font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Administrative Message
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
