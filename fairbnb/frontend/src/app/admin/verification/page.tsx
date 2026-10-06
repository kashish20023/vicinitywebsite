'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Eye, FileText, Phone, Mail, X } from 'lucide-react';

interface VerificationUser {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  kycStatus: string;
  kycDocumentUrl?: string | null;
  kycNote?: string | null;
  createdAt: string;
}

export default function AdminVerificationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.get<VerificationUser[]>('/admin/verifications/pending');
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchQueue();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const handleVerifyAction = async (userId: string, newStatus: 'VERIFIED' | 'REJECTED') => {
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${userId}/verify`, {
        status: newStatus,
        feedbackNote: feedbackNote || undefined,
      });

      alert(`User KYC verification updated to '${newStatus}'!`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUser(null);
      setFeedbackNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to update user verification');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-8 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 sm:text-h1 font-bold text-neutral-900 tracking-tight">Identity & KYC Verification Hub</h1>
          <p className="text-neutral-500 mt-1 text-body-sm">
            Review identity documents, phone/email verifications, and compliance credentials.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-semibold transition flex items-center gap-1.5 shadow-xs w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      <DataTable<VerificationUser>
        className="rounded-3xl"
        columns={[
          {
            key: 'user',
            header: 'User',
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-[#0e4962] text-white font-semibold flex items-center justify-center text-body shadow-xs">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-neutral-900 text-body-sm">{u.name}</p>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (u) => (
              <StatusBadge status={u.role} size="sm" />
            ),
          },
          {
            key: 'contact',
            header: 'Contact Verification',
            render: (u) => (
              <div className="text-caption space-y-1">
                <p className="flex items-center gap-1 font-mono text-neutral-600">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  {u.phone}
                  {u.phoneVerified
                    ? <span className="text-overline font-semibold text-emerald-600 ml-1">✓ Phone OK</span>
                    : <span className="text-overline font-semibold text-amber-600 ml-1">⏳ Unverified</span>}
                </p>
                {u.email && (
                  <p className="flex items-center gap-1 text-neutral-500 font-normal">
                    <Mail className="w-3 h-3" />
                    {u.email}
                    {u.emailVerified
                      ? <span className="text-overline font-semibold text-emerald-600 ml-1">✓ Email OK</span>
                      : <span className="text-overline font-semibold text-amber-600 ml-1">⏳ Unverified</span>}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'kyc',
            header: 'KYC Status',
            render: (u) => (
              <StatusBadge status={u.kycStatus || 'PENDING'} showDot size="sm" />
            ),
          },
          {
            key: 'submitted',
            header: 'Submitted Date',
            cellClassName: 'text-caption font-normal text-neutral-500 font-tabular',
            render: (u) => new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          },
          {
            key: 'actions',
            header: 'Actions',
            alignRight: true,
            render: (u) => (
              <button
                onClick={() => setSelectedUser(u)}
                className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-caption font-semibold transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            ),
          },
        ] as Column<VerificationUser>[]}
        data={users}
        rowKey={(u) => u.id}
        loading={loading}
        loadingMessage="Fetching verification queue..."
        emptyIcon={<ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />}
        emptyTitle="Queue is All Clear!"
        emptySubtitle="There are no pending identity documents or unverified user accounts awaiting review."
      />

      {/* REVIEW MODAL */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || ''}
        description="KYC Verification Review"
        maxWidth="max-w-lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-50 rounded-2xl space-y-2 text-xs">
              <p><strong className="text-neutral-900">User ID:</strong> <span className="font-mono text-neutral-600">{selectedUser.id}</span></p>
              <p><strong className="text-neutral-900">Phone:</strong> {selectedUser.phone}</p>
              <p><strong className="text-neutral-900">Email:</strong> {selectedUser.email || 'None'}</p>
              <p><strong className="text-neutral-900">Role:</strong> {selectedUser.role}</p>
              {selectedUser.kycDocumentUrl ? (
                <div className="pt-2">
                  <a
                    href={selectedUser.kycDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold transition"
                  >
                    <FileText className="w-4 h-4" /> View KYC Document File ↗
                  </a>
                </div>
              ) : (
                <p className="text-amber-700 font-semibold pt-1">⚠️ No external document file link attached.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Feedback / Verification Note</label>
              <textarea
                rows={3}
                placeholder="Optional feedback note to user..."
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => handleVerifyAction(selectedUser.id, 'REJECTED')}
                className="flex-1 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-xs transition border border-rose-200 disabled:opacity-50 cursor-pointer"
              >
                Reject Verification
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleVerifyAction(selectedUser.id, 'VERIFIED')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve & Verify
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
