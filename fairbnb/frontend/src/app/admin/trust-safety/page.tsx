'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  User,
  Building2,
  Activity,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface CaseItem {
  id: string;
  status: string;
  priority: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  propertyId?: string;
  attemptId: string;
  maskedSnippet: string;
  reasons: string[];
  version: number;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfileView {
  userId: string;
  email: string | null;
  globalRole: string;
  isActive: boolean;
  propertiesOwned: Array<{ propertyId: string; title: string; role: string }>;
  coHostAssignments: Array<{ propertyId: string; title: string; role: string; status: string; permissionLevel?: string }>;
  stats: {
    totalAttempts: number;
    confirmedBreaches: number;
    dismissedCases: number;
    appealedCases: number;
  };
  provenanceNotice: string;
  events: any[];
}

interface PropertyView {
  propertyId: string;
  title: string;
  status: string;
  owner: { userId: string; email?: string | null };
  coHosts: Array<{ userId: string; status: string; permissionLevel?: string }>;
  relatedCases: any[];
  provenanceNotice: string;
  events: any[];
}

export default function TrustSafetyAdminPage() {
  const [activeTab, setActiveTab] = useState<'cases' | 'user' | 'property' | 'timeline'>('cases');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [reviewReason, setReviewReason] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [revealEvidence, setRevealEvidence] = useState<boolean>(false);
  const [revealedContent, setRevealedContent] = useState<string | null>(null);
  const [auditActionId, setAuditActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // User investigation state
  const [searchUserId, setSearchUserId] = useState<string>('usr_host_2002002002');
  const [userProfile, setUserProfile] = useState<UserProfileView | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(false);

  // Property investigation state
  const [searchPropertyId, setSearchPropertyId] = useState<string>('prop_goa_villa_001');
  const [propertyView, setPropertyView] = useState<PropertyView | null>(null);
  const [propLoading, setPropLoading] = useState<boolean>(false);

  // Timeline state
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('access_token');
    }
    return null;
  };

  const fetchCases = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = getAuthToken();
      const url = statusFilter === 'ALL'
        ? 'http://localhost:5000/trust-safety/admin/cases'
        : `http://localhost:5000/trust-safety/admin/cases?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch cases (HTTP ${res.status})`);
      const data = await res.json();
      setCases(data.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading cases');
    } finally {
      setLoading(false);
    }
  };

  
  const handleAuditedReveal = async () => {
    if (!selectedCase) return;
    if (revealEvidence) {
      setRevealEvidence(false);
      setRevealedContent(null);
      return;
    }
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:5000/trust-safety/admin/cases/${selectedCase.id}/reveal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Failed to reveal evidence (HTTP ${res.status})`);
      const data = await res.json();
      setRevealedContent(data.revealedContent);
      setAuditActionId(data.auditActionId);
      setRevealEvidence(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error auditing reveal');
    }
  };

  const handleReviewCase = async (newStatus: string) => {
    if (!selectedCase) return;
    if (!reviewReason.trim()) {
      setErrorMsg('A review reason is mandatory to submit a casework decision.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = getAuthToken();
      const res = await fetch(
        `http://localhost:5000/trust-safety/admin/cases/${selectedCase.id}/review?version=${selectedCase.version}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: reviewReason,
            newStatus,
            notes: reviewNotes,
          }),
        },
      );

      if (res.status === 409) {
        throw new Error('Concurrency Conflict: Another reviewer has already modified this case. Please refresh.');
      }
      if (!res.ok) {
        throw new Error(`Review action failed (HTTP ${res.status})`);
      }

      setSuccessMsg(`Case ${selectedCase.id} updated to ${newStatus}`);
      setSelectedCase(null);
      setReviewReason('');
      setReviewNotes('');
      fetchCases();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleLookupUser = async (uid?: string) => {
    const idToSearch = uid || searchUserId;
    if (!idToSearch) return;
    setUserLoading(true);
    setErrorMsg(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:5000/trust-safety/admin/users/${idToSearch}/investigation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`User not found (HTTP ${res.status})`);
      const data = await res.json();
      setUserProfile(data);
      setActiveTab('user');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUserLoading(false);
    }
  };

  const handleLookupProperty = async (pid?: string) => {
    const idToSearch = pid || searchPropertyId;
    if (!idToSearch) return;
    setPropLoading(true);
    setErrorMsg(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:5000/trust-safety/admin/properties/${idToSearch}/investigation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Property not found (HTTP ${res.status})`);
      const data = await res.json();
      setPropertyView(data);
      setActiveTab('property');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setPropLoading(false);
    }
  };

  const handleFetchTimeline = async () => {
    setTimelineLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:5000/trust-safety/admin/timeline?limit=30', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch timeline');
      const data = await res.json();
      setTimelineEvents(data.events || []);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'timeline') {
      handleFetchTimeline();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Trust & Safety Casework</h1>
              <p className="text-sm text-gray-500">
                Fairbnb V2 Authoritative Anti-Circumvention, Investigation & Event Provenance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCases()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">{errorMsg}</div>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">{successMsg}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-medium">
        <button
          id="tab-cases" onClick={() => setActiveTab('cases')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'cases' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Case Queue ({cases.length})
        </button>

        <button
          id="tab-user" onClick={() => {
            setActiveTab('user');
            if (!userProfile) handleLookupUser();
          }}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'user' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          User Investigation
        </button>

        <button
          id="tab-property" onClick={() => {
            setActiveTab('property');
            if (!propertyView) handleLookupProperty();
          }}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'property' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Property Investigation
        </button>

        <button
          id="tab-timeline" onClick={() => setActiveTab('timeline')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'timeline' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Audit Timeline
        </button>
      </div>

      {/* TAB 1: CASEWORK QUEUE */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Filter:</span>
              {['ALL', 'OPEN', 'IN_REVIEW', 'CONFIRMED_POLICY_BREACH', 'DISMISSED', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    statusFilter === st
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Case ID / Priority</th>
                  <th className="px-4 py-3 text-left">Participants</th>
                  <th className="px-4 py-3 text-left">Masked Evidence Snippet</th>
                  <th className="px-4 py-3 text-left">Detected Reasons</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading cases...
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No cases found matching filter {statusFilter}.
                    </td>
                  </tr>
                ) : (
                  cases.map(item => (
                    <tr key={item.id} id={`row-case-${item.id}`} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{item.id}</div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[11px] font-semibold ${
                            item.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div
                          onClick={() => handleLookupUser(item.senderId)}
                          className="text-rose-600 hover:underline cursor-pointer font-medium"
                        >
                          Sender: {item.senderId}
                        </div>
                        <div className="text-xs text-gray-500">Recip: {item.recipientId}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-700 font-mono text-xs">
                        {item.maskedSnippet}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.reasons.map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-[11px] font-mono"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'CONFIRMED_POLICY_BREACH'
                              ? 'bg-rose-100 text-rose-800'
                              : item.status === 'DISMISSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'IN_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                        v{item.version}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setSelectedCase(item);
                            setRevealEvidence(false);
                            setReviewReason('');
                            setReviewNotes('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-black shadow-sm"
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW CASE MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Review Case: {selectedCase.id}</h3>
                <p className="text-xs text-gray-500 font-mono">Version {selectedCase.version} • Optimistic Concurrency Guarded</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Evidence Preview Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-500">Incident Evidence</span>
                <button
                  type="button"
                  id="btn-audited-reveal" onClick={handleAuditedReveal}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  {revealEvidence ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {revealEvidence ? 'Hide Evidence' : 'Audited Reveal'}
                </button>
              </div>

              <div className="font-mono text-sm bg-white border rounded p-3 text-gray-800">
                {revealEvidence && revealedContent ? revealedContent : '•••••••••••••••••••• [Protected PII - Click Reveal to Audit]'}
              </div>
              <p className="text-[11px] text-gray-400">
                Evidence access is logged in the server-authoritative audit log.
              {auditActionId && (
                <div id="audit-badge" className="mt-1 text-[11px] font-mono text-emerald-600 font-semibold">
                  Audited Unmasking Logged: {auditActionId}
                </div>
              )}
              </p>
            </div>

            {/* Decision Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Decision Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reviewReason}
                  onChange={e => setReviewReason(e.target.value)}
                  placeholder="e.g. Confirmed repeated direct telephone solicitation attempt"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Internal Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Additional context for compliance audit..."
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => handleReviewCase('CONFIRMED_POLICY_BREACH')}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700"
                >
                  Confirm Policy Breach
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewCase('DISMISSED')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                >
                  Dismiss (False Positive)
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewCase('IN_REVIEW')}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600"
                >
                  Mark In Review
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewCase('RESOLVED')}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800"
                >
                  Resolve Case
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="ml-auto px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER INVESTIGATION VIEW */}
      {activeTab === 'user' && (
        <div className="space-y-6">
          <div className="flex gap-3 max-w-xl">
            <input
              type="text"
              value={searchUserId}
              onChange={e => setSearchUserId(e.target.value)}
              placeholder="Enter User ID (e.g. usr_host_2002002002)"
              className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              id="btn-user-investigate" onClick={() => handleLookupUser()}
              className="px-4 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Investigate
            </button>
          </div>

          {userLoading ? (
            <div className="p-8 text-center text-gray-500">Loading user profile...</div>
          ) : userProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Account Card */}
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
                    {userProfile.userId.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{userProfile.userId}</h3>
                    <p className="text-xs text-gray-500">{userProfile.email || 'No email registered'}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1.5 pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Global Role:</span>
                    <span className="font-semibold text-gray-800">{userProfile.globalRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-semibold text-emerald-600">{userProfile.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                  {userProfile.provenanceNotice}
                </div>
              </div>

              {/* Moderation Metrics (Segregated) */}
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Segregated Casework Stats</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{userProfile.stats.totalAttempts}</div>
                    <div className="text-xs text-gray-500">Total Attempts</div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <div className="text-2xl font-bold text-rose-600">{userProfile.stats.confirmedBreaches}</div>
                    <div className="text-xs text-rose-700">Confirmed Breaches</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{userProfile.stats.dismissedCases}</div>
                    <div className="text-xs text-emerald-700">Dismissed Cases</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{userProfile.stats.appealedCases}</div>
                    <div className="text-xs text-blue-700">Appealed Cases</div>
                  </div>
                </div>
              </div>

              {/* Property Roles & Co-Host Card */}
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Property Role Resolution</h4>
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-gray-700">Owned Properties ({userProfile.propertiesOwned.length}):</div>
                  {userProfile.propertiesOwned.map(p => (
                    <div
                      key={p.propertyId}
                      onClick={() => handleLookupProperty(p.propertyId)}
                      className="p-2 bg-gray-50 rounded border flex items-center justify-between cursor-pointer hover:bg-gray-100"
                    >
                      <span className="font-medium truncate">{p.title}</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">OWNER</span>
                    </div>
                  ))}

                  <div className="font-semibold text-gray-700 pt-2">Co-Host Assignments ({userProfile.coHostAssignments.length}):</div>
                  {userProfile.coHostAssignments.length === 0 ? (
                    <div className="text-gray-400 italic">No co-host assignments</div>
                  ) : (
                    userProfile.coHostAssignments.map(c => (
                      <div
                        key={c.propertyId}
                        onClick={() => handleLookupProperty(c.propertyId)}
                        className="p-2 bg-gray-50 rounded border flex items-center justify-between cursor-pointer hover:bg-gray-100"
                      >
                        <span className="font-medium truncate">{c.title}</span>
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">CO-HOST ({c.status})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 3: PROPERTY INVESTIGATION VIEW */}
      {activeTab === 'property' && (
        <div className="space-y-6">
          <div className="flex gap-3 max-w-xl">
            <input
              type="text"
              value={searchPropertyId}
              onChange={e => setSearchPropertyId(e.target.value)}
              placeholder="Enter Property ID (e.g. prop_goa_villa_001)"
              className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              id="btn-property-investigate" onClick={() => handleLookupProperty()}
              className="px-4 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Investigate
            </button>
          </div>

          {propLoading ? (
            <div className="p-8 text-center text-gray-500">Loading property view...</div>
          ) : propertyView ? (
            <div className="space-y-6">
              <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{propertyView.title}</h3>
                  <p className="text-xs text-gray-500 font-mono">ID: {propertyView.propertyId} • Status: {propertyView.status}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Primary Owner</div>
                  <div
                    onClick={() => handleLookupUser(propertyView.owner.userId)}
                    className="text-sm font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    {propertyView.owner.userId}
                  </div>
                </div>
              </div>

              {/* Related Casework Scoped to this property */}
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">
                    Scoped Trust & Safety Cases ({propertyView.relatedCases.length})
                  </h4>
                  <span className="text-xs text-gray-400">Strictly isolated to this listing</span>
                </div>
                {propertyView.relatedCases.length === 0 ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
                    Clean History: Zero moderation incidents recorded for this property.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {propertyView.relatedCases.map((c: any) => (
                      <div key={c.id} className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-gray-900">{c.id}</span>
                          <span className="ml-2 text-gray-500">Sender: {c.senderId}</span>
                          <div className="font-mono text-gray-600 mt-1">{c.maskedSnippet}</div>
                        </div>
                        <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded font-semibold">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 4: AUDIT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Server-Authoritative Activity Timeline</h3>
              <p className="text-xs text-gray-500">Append-only immutable record of safety decisions and policy updates</p>
            </div>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              History unavailable before 2026-10-01T00:00:00.000Z
            </span>
          </div>

          {timelineLoading ? (
            <div className="p-8 text-center text-gray-500">Loading timeline...</div>
          ) : timelineEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No recent events logged.</div>
          ) : (
            <div className="space-y-3">
              {timelineEvents.map((evt, idx) => (
                <div key={evt.eventId || idx} className="p-3 bg-gray-50 rounded-lg border text-xs flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-900 text-white rounded font-mono text-[10px]">
                        {evt.eventType}
                      </span>
                      <span className="text-gray-500">Actor: {evt.actorId} ({evt.actorRole})</span>
                    </div>
                    <div className="text-gray-600 font-mono">
                      Target: {evt.targetEntity} • ID: {evt.targetId} • Corr: {evt.correlationId}
                    </div>
                  </div>
                  <div className="text-right text-gray-400">
                    {new Date(evt.occurredAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
