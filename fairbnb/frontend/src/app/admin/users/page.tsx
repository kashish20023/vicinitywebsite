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
  Ban,
  CheckCircle2,
  XCircle,
  X,
  Send,
  UserCheck,
  AlertCircle,
  Key,
  Star,
} from 'lucide-react';

interface GuestMetrics {
  completedTripsCount: number;
  totalBookingsCount: number;
  totalSpent: number;
}

interface ManagedUser {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: string;
  isActive: boolean;
  isBlocked?: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  verificationBadge?: string;
  rating?: number;
  joinedDate?: string;
  lastStayDate?: string | null;
  metrics?: GuestMetrics;
  createdAt: string;
}

const FALLBACK_GUEST_USERS: ManagedUser[] = [
  {
    id: 'usr_guest_3004004004',
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    phone: '+91 98444 55566',
    role: 'USER',
    isActive: true,
    isBlocked: false,
    phoneVerified: true,
    emailVerified: true,
    verificationBadge: 'Verified',
    rating: 4.9,
    joinedDate: '2026-08-01',
    metrics: {
      completedTripsCount: 4,
      totalBookingsCount: 5,
      totalSpent: 42500,
    },
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'usr_guest_3005005005',
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '+91 98555 66677',
    role: 'USER',
    isActive: true,
    isBlocked: false,
    phoneVerified: true,
    emailVerified: true,
    verificationBadge: 'Verified',
    rating: 4.7,
    joinedDate: '2026-08-05',
    metrics: {
      completedTripsCount: 2,
      totalBookingsCount: 3,
      totalSpent: 18900,
    },
    createdAt: '2026-08-05T12:00:00.000Z',
  },
  {
    id: 'usr_guest_3006006006',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@example.com',
    phone: '+91 98666 77788',
    role: 'USER',
    isActive: true,
    isBlocked: false,
    phoneVerified: true,
    emailVerified: false,
    verificationBadge: 'Unverified',
    rating: 5.0,
    joinedDate: '2026-08-10',
    metrics: {
      completedTripsCount: 6,
      totalBookingsCount: 7,
      totalSpent: 89000,
    },
    createdAt: '2026-08-10T14:20:00.000Z',
  },
];

export default function AdminUsersPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  // Modals
  const [selectedUserProfile, setSelectedUserProfile] = useState<ManagedUser | null>(null);
  const [messagingUser, setMessagingUser] = useState<ManagedUser | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any>('/admin/guests');
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.users)
          ? (data as any).users
          : Array.isArray((data as any)?.guests)
            ? (data as any).guests
            : Array.isArray((data as any)?.data)
              ? (data as any).data
              : [];
      setUsers(list);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError('Unauthorized access. Admin privileges required.');
      } else {
        setError(err?.message || 'Failed to fetch guest directory');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('fairbnb_token');
    if (isAuthenticated || hasToken) {
      fetchUsers();
    } else if (!authLoading) {
      setLoading(false);
      setUsers([]);
    }
  }, [isAuthenticated, authLoading]);

  const handleQuickAdminLogin = async () => {
    setLoggingInAdmin(true);
    setError(null);
    try {
      await login({ identifier: 'admin@fairbnb.com', password: 'Password123!' }, '/admin/users');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to log in as admin');
    } finally {
      setLoggingInAdmin(false);
    }
  };

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

  const handleStatusToggle = async (userId: string, currentIsActive: boolean) => {
    setUpdatingId(userId);
    setOpenActionId(null);
    try {
      const isBlocked = currentIsActive;
      await api.patch(`/admin/guests/${userId}/block`, {
        isBlocked,
        reason: isBlocked ? 'Blocked by Admin' : undefined,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !isBlocked, isBlocked } : u)),
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update guest status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveVerify = async (userId: string) => {
    setUpdatingId(userId);
    setOpenActionId(null);
    try {
      await api.put(`/admin/users/${userId}/verify`, {
        status: 'VERIFIED',
        feedbackNote: 'Verified by Admin',
      });
      alert('Guest identity verified!');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to verify user');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingUser || !messageSubject.trim() || !messageContent.trim()) return;

    setSendingMsg(true);
    try {
      await api.post('/admin/messages/send', {
        recipientId: messagingUser.id,
        subject: messageSubject,
        content: messageContent,
      });
      alert(`Message sent to ${messagingUser.name}!`);
      setMessagingUser(null);
      setMessageSubject('');
      setMessageContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const nameStr = (u?.name || '').toLowerCase();
    const phoneStr = u?.phone || '';
    const emailStr = (u?.email || '').toLowerCase();
    return (
      nameStr.includes(query) ||
      phoneStr.includes(query) ||
      emailStr.includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-8 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 sm:text-h1 font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-rose-500" /> Guest Directory
          </h1>
          <p className="text-neutral-500 mt-1 text-body-sm">
            System-wide directory of registered guests, trip metrics, spendings, and account governance.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-semibold transition flex items-center gap-1.5 shadow-xs w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} /> Refresh
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="max-w-md relative">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-neutral-200 focus:border-neutral-900 outline-none text-body-sm font-normal text-neutral-900 shadow-xs"
        />
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
      </div>

      {/* GUEST TABLE */}
      <DataTable<ManagedUser>
        columns={[
          {
            key: 'guest',
            header: 'Guest',
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0e4962] text-white font-semibold flex items-center justify-center text-body shadow-xs">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900 text-body-sm">{u.name}</p>
                    <span className={`text-overline font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      u.verificationBadge === 'Verified' || u.verificationBadge === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}>{u.verificationBadge}</span>
                  </div>
                  <p className="text-caption text-neutral-500 font-normal">{u.email || 'No email'}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (u) => (
              <span className={`text-overline font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                u.isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {u.isActive ? '👤 Active' : '🚫 Blocked'}
              </span>
            ),
          },
          {
            key: 'phone',
            header: 'Phone',
            cellClassName: 'font-mono font-medium text-neutral-800 text-caption',
            render: (u) => u.phone || '-',
          },
          {
            key: 'bookings',
            header: 'Bookings',
            cellClassName: 'font-semibold font-tabular text-neutral-900 text-body-sm',
            render: (u) => u.metrics?.totalBookingsCount ?? 0,
          },
          {
            key: 'totalSpent',
            header: 'Total Spent',
            cellClassName: 'font-semibold font-tabular text-neutral-900 text-body-sm',
            render: (u) => `₹${(u.metrics?.totalSpent ?? 0).toLocaleString('en-IN')}`,
          },
          {
            key: 'rating',
            header: 'Rating',
            render: (u) => (
              <div className="flex items-center gap-1 font-semibold font-tabular text-neutral-700 text-caption">
                <Star className="w-4 h-4 text-neutral-400" />
                <span>{u.rating && u.rating > 0 ? u.rating : '0'}</span>
              </div>
            ),
          },
          {
            key: 'lastStay',
            header: 'Last Stay',
            cellClassName: 'text-caption font-normal text-neutral-600',
            render: (u) => u.lastStayDate
              ? new Date(u.lastStayDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : '-',
          },
          {
            key: 'actions',
            header: 'Actions',
            alignRight: true,
            render: (u) => (
              <div className="inline-block text-left" ref={openActionId === u.id ? dropdownRef : null}>
                <button
                  onClick={() => setOpenActionId(openActionId === u.id ? null : u.id)}
                  className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-900 transition cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {openActionId === u.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-2xl shadow-xl z-30 py-2 text-xs font-semibold text-neutral-700 space-y-0.5">
                    <button onClick={() => { setSelectedUserProfile(u); setOpenActionId(null); }} className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700">
                      <Eye className="w-3.5 h-3.5 text-neutral-400" /> View Profile
                    </button>
                    <button onClick={() => { setMessagingUser(u); setOpenActionId(null); }} className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400" /> Send Message
                    </button>
                    <button onClick={() => handleApproveVerify(u.id)} className="w-full px-4 py-2 hover:bg-neutral-50 text-blue-600 text-left flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Approve (Verify)
                    </button>
                    <button onClick={() => handleStatusToggle(u.id, u.isActive)} className="w-full px-4 py-2 hover:bg-rose-50 text-rose-600 text-left flex items-center gap-2 border-t border-neutral-100 mt-1 pt-2">
                      <Ban className="w-3.5 h-3.5 text-rose-600" /> {u.isActive ? 'Block Guest' : 'Unblock Guest'}
                    </button>
                  </div>
                )}
              </div>
            ),
          },
        ] as Column<ManagedUser>[]}
        data={filteredUsers}
        rowKey={(u) => u.id}
        loading={loading}
        loadingMessage="Loading guests from database..."
        emptyIcon={<Users className="w-12 h-12 text-neutral-300 mx-auto" />}
        emptyTitle="No guests found"
        emptySubtitle="No guest accounts match your search query."
      />

      {/* VIEW PROFILE MODAL */}
      <Modal
        isOpen={Boolean(selectedUserProfile)}
        onClose={() => setSelectedUserProfile(null)}
        title={
          selectedUserProfile ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-body-lg shadow-sm">
                {selectedUserProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{selectedUserProfile.name}</h3>
                <p className="text-xs text-neutral-500">{selectedUserProfile.email || 'No email'}</p>
              </div>
            </div>
          ) : undefined
        }
        maxWidth="lg"
      >
        {selectedUserProfile && (
          <div className="space-y-2 text-xs text-neutral-600">
            <p><strong className="text-neutral-900">Guest ID:</strong> <span className="font-mono">{selectedUserProfile.id}</span></p>
            <p><strong className="text-neutral-900">Phone:</strong> {selectedUserProfile.phone || '-'}</p>
            <p><strong className="text-neutral-900">Verification Status:</strong> {selectedUserProfile.verificationBadge}</p>
            <p><strong className="text-neutral-900">Total Bookings:</strong> {selectedUserProfile.metrics?.totalBookingsCount ?? 0}</p>
            <p><strong className="text-neutral-900">Total Spent:</strong> ₹{(selectedUserProfile.metrics?.totalSpent ?? 0).toLocaleString('en-IN')}</p>
            <p><strong className="text-neutral-900">Registered Date:</strong> {new Date(selectedUserProfile.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </Modal>

      {/* SEND MESSAGE MODAL */}
      <Modal
        isOpen={Boolean(messagingUser)}
        onClose={() => setMessagingUser(null)}
        title={
          messagingUser ? (
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Direct Message to {messagingUser.name}
            </span>
          ) : undefined
        }
        maxWidth="md"
      >
        {messagingUser && (
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Subject line..."
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs outline-none focus:border-emerald-500 text-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Message Content</label>
              <textarea
                rows={4}
                placeholder="Write your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs outline-none focus:border-emerald-500 text-neutral-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sendingMsg}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
