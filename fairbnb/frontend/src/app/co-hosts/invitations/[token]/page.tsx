'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Building2, UserCheck, Shield, DollarSign, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function InvitationLandingPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvitation() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<any>(`/co-hosts/invitations/${token}`);
        setInvitation(data);
      } catch (err: any) {
        setError(err.message || 'Invitation token is invalid or expired.');
      } finally {
        setLoading(false);
      }
    }
    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      alert('Please log in or register an account to accept this co-host invitation.');
      router.push(`/login?redirect=/co-hosts/invitations/${token}`);
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/co-hosts/invitations/${token}/accept`);
      alert('🎉 Invitation Accepted Successfully! Welcome to your Co-Host Workspace.');
      router.push('/co-host');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;
    setActionLoading(true);
    try {
      await api.post(`/co-hosts/invitations/${token}/decline`);
      alert('Invitation declined.');
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className="text-sm font-semibold text-neutral-600">Retrieving invitation details...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-900">Invitation Unavailable</h2>
          <p className="text-xs text-neutral-500">{error || 'Invalid or expired invitation token.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-[#0e4962] text-white rounded-xl text-xs font-bold hover:bg-[#1a6585] transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const property = invitation.property;
  const inviter = invitation.invitedBy;
  const payoutConfig = invitation.payoutConfig;

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden my-8">
        {/* PROPERTY HERO HEADER */}
        <div className="h-48 bg-neutral-900 relative overflow-hidden flex items-end p-6 text-white">
          {property?.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 to-neutral-900" />
          )}
          <div className="relative z-10 space-y-1">
            <span className="px-3 py-1 bg-amber-500 text-black text-overline font-semibold uppercase tracking-wider rounded-full">
              Co-Host Invitation
            </span>
            <h1 className="text-h2 font-bold tracking-tight">{property?.title}</h1>
            <p className="text-caption font-normal text-neutral-200">{property?.city}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* INVITER PROFILE */}
          <div className="flex items-center gap-3.5 p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-body">
              {inviter?.name ? inviter.name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <p className="text-caption text-neutral-500 font-normal">Invited by</p>
              <p className="text-body-sm font-semibold text-neutral-900">{inviter?.name}</p>
              <p className="text-caption text-neutral-500">{inviter?.email}</p>
            </div>
          </div>

          {/* PERMISSION LEVEL PACKAGE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600" /> Permission Level Package
              </span>
              <span className="px-2.5 py-0.5 bg-neutral-100 font-mono text-overline font-semibold uppercase tracking-wider rounded-lg text-neutral-800">
                {invitation.permissionLevel}
              </span>
            </div>
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-caption space-y-2">
              <p className="text-neutral-600 font-medium">
                Granted {invitation.requestedPermissions?.length || 0} permissions across property management modules:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {invitation.requestedPermissions?.map((perm: string) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-overline font-semibold font-mono"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* PAYOUT ARRANGEMENT */}
          {payoutConfig && (
            <div className="space-y-2">
              <span className="text-caption font-semibold text-neutral-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Proposed Earnings Split
              </span>
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-caption text-emerald-900 space-y-1 font-semibold">
                <p>Type: {payoutConfig.type}</p>
                {payoutConfig.percentage && <p>Revenue Share: {payoutConfig.percentage}% per booking</p>}
                {payoutConfig.fixedAmount && <p>Fixed Compensation: ₹{payoutConfig.fixedAmount} per booking</p>}
              </div>
            </div>
          )}

          {/* TARGET EMAIL NOTICE */}
          {invitation.email && (
            <div className="p-3 bg-neutral-100 rounded-xl text-caption text-neutral-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>This invitation is designated for <strong>{invitation.email}</strong>.</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
            <button
              onClick={handleDecline}
              disabled={actionLoading}
              className="flex-1 py-3 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4 text-neutral-400" /> Decline
            </button>

            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> {actionLoading ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
