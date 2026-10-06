'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  Mail,
  Clock,
  Shield,
  DollarSign,
  Trash2,
  Loader2,
  ArrowLeft,
  Building2,
  Plus,
  Copy,
  Check,
  Share2,
  X,
  AlertCircle,
  ExternalLink,
  UserCheck,
  Send,
} from 'lucide-react';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

interface PropertyOption {
  id: string;
  title: string;
  city?: string;
  coverImage?: string;
  isOwned: boolean;
}

function HostInvitesContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const queryPropertyId = searchParams.get('propertyId');

  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<PropertyOption[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [inviteMethod, setInviteMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('FULL_ACCESS');
  const [enablePayout, setEnablePayout] = useState(false);
  const [payoutType, setPayoutType] = useState<'PERCENTAGE' | 'FIXED_PER_BOOKING'>('PERCENTAGE');
  const [payoutValue, setPayoutValue] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success Link State
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoProvisionedPassword, setAutoProvisionedPassword] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any[]>('/co-hosts/me/invitations');
      setInvitations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  };

  const loadPropertiesForInvite = async () => {
    setLoadingProps(true);
    try {
      // Fetch owned properties only
      const owned = await api.get<any[]>('/properties/my-properties');
      const ownedList: PropertyOption[] = (Array.isArray(owned) ? owned : []).map((p) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        coverImage: p.coverImage || (p.images && p.images[0]),
        isOwned: true,
      }));

      setAvailableProperties(ownedList);

      if (queryPropertyId && ownedList.some((p) => p.id === queryPropertyId)) {
        setSelectedPropertyId(queryPropertyId);
      } else if (ownedList.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(ownedList[0].id);
      }
    } catch (err) {
      console.error('Failed to load properties for invite modal', err);
    } finally {
      setLoadingProps(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvitations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (queryPropertyId) {
      setIsModalOpen(true);
      loadPropertiesForInvite();
    }
  }, [queryPropertyId]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setGeneratedInviteLink(null);
    setAutoProvisionedPassword(null);
    setSubmitError(null);
    loadPropertiesForInvite();
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await api.delete(`/co-hosts/invitations/${invitationId}`);
      fetchInvitations();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke invitation');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      setSubmitError('Please select a property');
      return;
    }
    if (!contactValue.trim()) {
      setSubmitError(`Please enter a valid ${inviteMethod}`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: any = {
        permissionLevel,
      };

      if (inviteMethod === 'email') {
        payload.email = contactValue.trim();
      } else {
        payload.phone = contactValue.trim();
      }

      if (enablePayout) {
        payload.payoutConfig = {
          ruleType: payoutType,
          percentage: payoutType === 'PERCENTAGE' ? parseFloat(payoutValue) : undefined,
          fixedAmount: payoutType === 'FIXED_PER_BOOKING' ? parseFloat(payoutValue) : undefined,
          schedule: 'PER_BOOKING',
        };
      }

      const res = await api.post<any>(
        `/properties/${selectedPropertyId}/co-hosts/invite`,
        payload
      );

      const token = res.inviteToken;
      const shareUrl = `${window.location.origin}/co-hosts/invitations/${token}`;
      setGeneratedInviteLink(shareUrl);
      if (res.generatedPassword) {
        setAutoProvisionedPassword(res.generatedPassword);
      }

      fetchInvitations();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredInvitations = invitations.filter((inv) => {
    if (filterTab === 'ALL') return true;
    return inv.status === filterTab;
  });

  const pendingCount = invitations.filter((i) => i.status === 'PENDING').length;
  const acceptedCount = invitations.filter((i) => i.status === 'ACCEPTED').length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-16 space-y-8">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-xs">
        <div className="space-y-1.5">
          <Link
            href="/host/today"
            className="inline-flex items-center gap-1.5 text-button font-medium text-neutral-500 hover:text-neutral-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-3.5 py-1 rounded-full text-overline font-semibold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/80 inline-flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-rose-600" />
              Co-Host Invitations (Outgoing)
            </span>
          </div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight pt-1">
            Sent Co-Host Invitations
          </h1>
          <p className="text-body-sm text-neutral-500 font-normal">
            Invite co-hosts to manage your properties or properties where you hold co-host delegation permissions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Link
            href="/host/co-hosts/own"
            className="px-4 py-2.5 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-800 font-medium text-button rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4 text-neutral-600" />
            <span>Own's Co-host</span>
          </Link>

          <button
            onClick={handleOpenModal}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-button rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Invite New Co-Host</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-overline font-semibold uppercase tracking-wider">Total Sent</span>
            <Mail className="w-4 h-4 text-neutral-500" />
          </div>
          <p className="text-h2 font-bold font-tabular text-neutral-900 mt-1">
            {loading ? '...' : invitations.length}
          </p>
          <span className="text-caption text-neutral-500 font-medium">Lifetime invitations issued</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-overline font-semibold uppercase tracking-wider">Pending Acceptance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-h2 font-bold font-tabular text-amber-600 mt-1">
            {loading ? '...' : pendingCount}
          </p>
          <span className="text-caption text-neutral-500 font-medium">Awaiting invitee confirmation</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-overline font-semibold uppercase tracking-wider">Accepted & Active</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-h2 font-bold font-tabular text-emerald-700 mt-1">
            {loading ? '...' : acceptedCount}
          </p>
          <span className="text-caption text-neutral-500 font-medium">Active co-hosts managing listings</span>
        </div>
      </div>

      {/* 3. TABS FILTER */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-4 py-2 rounded-xl text-button font-medium transition ${
            filterTab === 'ALL'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          All ({invitations.length})
        </button>
        <button
          onClick={() => setFilterTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-button font-medium transition ${
            filterTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilterTab('ACCEPTED')}
          className={`px-4 py-2 rounded-xl text-button font-medium transition ${
            filterTab === 'ACCEPTED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Accepted ({acceptedCount})
        </button>
      </div>

      {/* 4. INVITATIONS CONTENT */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-3" />
          <p className="text-sm font-medium text-neutral-500">Loading invitations...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-base">Unable to Access Invitations</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-600 mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">No Invitations Found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              {filterTab === 'ALL'
                ? "You haven't sent any co-host invitations yet. Click 'Invite New Co-Host' to delegate management."
                : `No invitations with status '${filterTab}' found.`}
            </p>
          </div>
          {filterTab === 'ALL' && (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Co-Host Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInvitations.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md transition"
            >
              {/* Left Side: Property & Invitee Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 hidden sm:block">
                  {inv.property?.coverImage ? (
                    <img
                      src={inv.property.coverImage}
                      alt={inv.property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-neutral-400 m-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">
                    {inv.email || inv.phone || 'Invited User'}
                  </h4>
                  <Link
                    href={`/host/properties/${inv.propertyId}/co-hosts`}
                    className="text-sm font-semibold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <span>{inv.property?.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Sent {timeAgo(inv.createdAt)}
                  </p>
                </div>
              </div>

              {/* Middle: Status & Permissions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <Shield className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-700">{inv.permissionLevel}</span>
                </div>
                {inv.payoutConfig && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 rounded-xl border border-neutral-100">
                    <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-xs font-semibold text-neutral-700">
                      {inv.payoutConfig.percentage
                        ? `${inv.payoutConfig.percentage}% Payout`
                        : inv.payoutConfig.fixedAmount
                        ? `₹${inv.payoutConfig.fixedAmount} Payout`
                        : 'Payout Configured'}
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                {inv.status === 'PENDING' && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
                {inv.status === 'ACCEPTED' && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                    ✓ Accepted
                  </span>
                )}
                {inv.status === 'DECLINED' && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200">
                    ✗ Declined
                  </span>
                )}
                {inv.status === 'EXPIRED' && (
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-bold border border-neutral-200">
                    Expired
                  </span>
                )}
              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center justify-end gap-2">
                {inv.status === 'PENDING' && (
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. INVITE NEW CO-HOST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-h3 font-bold text-neutral-900">Invite Co-Host</h3>
                <p className="text-caption text-neutral-500">
                  Delegate property management responsibilities to a partner or team member.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Link Generated Successfully */}
            {generatedInviteLink ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Invitation Created Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Share this unique link with your co-host. The link is valid for 7 days.
                  </p>
                </div>

                {autoProvisionedPassword && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <span className="font-bold">New Account Created:</span> A temporary password was generated for this user: <code className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold">{autoProvisionedPassword}</code>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-caption font-semibold text-neutral-700">Shareable Invitation Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="w-full text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-700 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedInviteLink)}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hello! You have been invited to co-host on Fairbnb. Click the link to accept: ${generatedInviteLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-button font-medium transition flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setGeneratedInviteLink(null);
                    }}
                    className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-button font-medium transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Form */
              <form onSubmit={handleSendInvite} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* 1. Property Selector */}
                <div className="space-y-1.5">
                  <label className="text-caption font-semibold text-neutral-700">Select Property</label>
                  {loadingProps ? (
                    <div className="p-2.5 text-xs text-neutral-400 border border-neutral-200 rounded-xl bg-neutral-50 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading eligible properties...
                    </div>
                  ) : availableProperties.length === 0 ? (
                    <p className="text-xs text-rose-600">No properties available for co-host invitation.</p>
                  ) : (
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="w-full text-xs bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-800 focus:outline-hidden focus:border-neutral-900"
                    >
                      {availableProperties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} {p.city ? `(${p.city})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Contact Method */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-caption font-semibold text-neutral-700">Invitee Contact</label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setInviteMethod('email')}
                        className={`px-2 py-0.5 rounded-md font-medium transition ${
                          inviteMethod === 'email' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setInviteMethod('phone')}
                        className={`px-2 py-0.5 rounded-md font-medium transition ${
                          inviteMethod === 'phone' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        Phone
                      </button>
                    </div>
                  </div>

                  <input
                    type={inviteMethod === 'email' ? 'email' : 'tel'}
                    placeholder={inviteMethod === 'email' ? 'cohost@example.com' : '+91 98765 43210'}
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    required
                    className="w-full text-xs bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-800 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                {/* 3. Permission Level */}
                <div className="space-y-1.5">
                  <label className="text-caption font-semibold text-neutral-700">Delegated Permissions</label>
                  <select
                    value={permissionLevel}
                    onChange={(e) => setPermissionLevel(e.target.value)}
                    className="w-full text-xs bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-800 focus:outline-hidden focus:border-neutral-900"
                  >
                    <option value="FULL_ACCESS">Full Access (All features including pricing & sub-cohosts)</option>
                    <option value="CALENDAR_MESSAGING">Calendar & Messaging (Guest chat + Calendar sync)</option>
                    <option value="CALENDAR_ONLY">Calendar Only (Availability & block dates)</option>
                    <option value="OPERATIONS">Operations (Housekeeping, turnovers, maintenance)</option>
                  </select>
                </div>

                {/* 4. Optional Payout Config */}
                <div className="pt-2 border-t border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-semibold text-neutral-700">Share Earnings / Payout</span>
                    <input
                      type="checkbox"
                      checked={enablePayout}
                      onChange={(e) => setEnablePayout(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                  </div>

                  {enablePayout && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <select
                        value={payoutType}
                        onChange={(e: any) => setPayoutType(e.target.value)}
                        className="text-xs bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-800"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_PER_BOOKING">Fixed Amount (₹)</option>
                      </select>

                      <input
                        type="number"
                        min="1"
                        max={payoutType === 'PERCENTAGE' ? '100' : '50000'}
                        value={payoutValue}
                        onChange={(e) => setPayoutValue(e.target.value)}
                        placeholder={payoutType === 'PERCENTAGE' ? '10' : '1000'}
                        className="text-xs bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-800"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting || availableProperties.length === 0}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white rounded-xl text-button font-medium transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Invitation...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Co-Host Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HostInvitesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-7xl mx-auto flex items-center justify-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-3" />
        </div>
      }
    >
      <HostInvitesContent />
    </Suspense>
  );
}
