'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import {
  DollarSign,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Send,
  X,
  Eye,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface SettlementListItem {
  id: string;
  bookingId: string;
  status: 'PENDING' | 'READY' | 'HELD' | 'PROCESSING' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'CANCELLED';
  currency: string;
  holdReasons: string[];
  currentRevisionNumber: number | null;
  grossPaise: string;
  hostNetPaise: string;
  coHostNetPaise: string;
  platformNetPaise: string;
  taxNetPaise: string;
  propertyTitle: string;
  guestName: string;
  bookingStatus: string;
  createdAt: string;
}

interface SettlementDetail {
  id: string;
  bookingId: string;
  status: string;
  currency: string;
  holdReasons: string[];
  currentRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    status: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    property?: {
      id: string;
      title: string;
      hostId: string;
      host?: { name: string; email: string };
    };
    guest?: { name: string; email: string; phone?: string };
    payments?: any[];
    refunds?: any[];
    financeSnapshot?: any;
  };
  revisions: Array<{
    id: string;
    revisionNumber: number;
    reason: string;
    totalGrossPaise: string;
    totalRefundedPaise: string;
    totalNetPaise: string;
    hostNetPaise: string;
    coHostNetPaise: string;
    platformNetPaise: string;
    taxNetPaise: string;
    isExecuted: boolean;
    createdAt: string;
    allocations: Array<{
      id: string;
      recipientRole: string;
      recipientUserId: string | null;
      allocationKey: string;
      grossPaise: string;
      refundDeductionPaise: string;
      netEntitledPaise: string;
      status: string;
      holdReasons: string[];
    }>;
  }>;
  transferIntents: Array<{
    id: string;
    allocationKey: string;
    recipientUserId: string | null;
    amountPaise: string;
    currency: string;
    operationReference: string;
    status: string;
    provider?: string;
    isSimulated?: boolean;
    providerTransferId: string | null;
    failureReason: string | null;
    createdAt: string;
    attempts: Array<{
      id: string;
      attemptNumber: number;
      status: string;
      providerReference: string | null;
      createdAt: string;
    }>;
  }>;
  adjustments?: any[];
  auditEvents?: any[];
}

function formatPaise(paiseStr: string | number | undefined): string {
  if (paiseStr === undefined || paiseStr === null) return '₹0.00';
  const num = Number(paiseStr) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'SETTLED':
    case 'COMPLETED':
    case 'PAID':
      return 'success';
    case 'READY':
    case 'ELIGIBLE':
    case 'APPROVED':
      return 'info';
    case 'HELD':
    case 'REVERSED':
      return 'warning';
    case 'PROCESSING':
    case 'PARTIALLY_SETTLED':
      return 'warning';
    case 'FAILED':
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
}

export default function AdminSettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<SettlementListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SettlementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Request sequence counter to prevent race conditions when switching inspections
  const detailRequestIdRef = useRef<number>(0);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({
    accommodationPaise: '',
    cleaningPaise: '',
    platformFeePaise: '',
    taxPaise: '',
    reason: '',
  });

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get<{ data?: any[]; settlements?: any[]; meta?: any }>(
        `/admin/settlements${query}`,
      );
      const rawItems = res.data || res.settlements || [];
      const items: SettlementListItem[] = rawItems.map((raw: any) => {
        const rev = raw.revisions?.[0];
        return {
          id: raw.id,
          bookingId: raw.bookingId,
          status: raw.status,
          currency: raw.currency || 'INR',
          holdReasons: raw.holdReasons || [],
          currentRevisionNumber: rev?.revisionNumber ?? raw.currentRevisionNumber ?? null,
          grossPaise: raw.grossPaise || rev?.totalGrossPaise || '0',
          hostNetPaise: raw.hostNetPaise || rev?.hostNetPaise || '0',
          coHostNetPaise: raw.coHostNetPaise || rev?.coHostNetPaise || '0',
          platformNetPaise: raw.platformNetPaise || rev?.platformNetPaise || '0',
          taxNetPaise: raw.taxNetPaise || rev?.taxNetPaise || '0',
          propertyTitle: raw.propertyTitle || raw.booking?.property?.title || 'Property',
          guestName: raw.guestName || raw.booking?.guest?.name || 'Guest',
          bookingStatus: raw.bookingStatus || raw.booking?.status || 'COMPLETED',
          createdAt: raw.createdAt,
        };
      });
      setSettlements(items);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settlements');
      setSettlements([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const loadDetail = useCallback(async (bookingId: string) => {
    const requestId = ++detailRequestIdRef.current;
    setSelectedBookingId(bookingId);
    setSelectedDetail(null); // Clear previous detail state immediately
    setDetailLoading(true);
    setDetailError(null);
    setActionMessage(null);

    try {
      const res = await api.get<SettlementDetail | { settlement: SettlementDetail }>(
        `/admin/settlements/${bookingId}`,
      );

      // Race condition guard: discard if a newer request was dispatched
      if (detailRequestIdRef.current !== requestId) {
        return;
      }

      // Defensively support both top-level settlement object (actual) and wrapped response
      const data: SettlementDetail = (res as any)?.settlement || res;

      if (!data || !data.id || !data.status) {
        setDetailError('Malformed settlement ledger data received from server.');
        setSelectedDetail(null);
      } else {
        setSelectedDetail(data);
      }
    } catch (err: any) {
      if (detailRequestIdRef.current !== requestId) {
        return;
      }
      setSelectedDetail(null);
      const status = err.statusCode || err.status;
      if (status === 404) {
        setDetailError('Settlement ledger not found for this booking.');
      } else if (status === 401 || status === 403) {
        setDetailError('Unauthorized: You do not have permission to inspect this settlement.');
      } else if (status >= 500) {
        setDetailError('Server error while loading settlement details. Please try again.');
      } else {
        setDetailError(err.message || 'Failed to load settlement details.');
      }
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, []);

  const handleRefresh = async (bookingId: string) => {
    setActionLoading('refresh');
    setActionMessage(null);
    try {
      await api.post(`/admin/settlements/${bookingId}/refresh`);
      setActionMessage({ type: 'success', text: 'Settlement refreshed and eligibility re-evaluated.' });
      await loadDetail(bookingId);
      await fetchSettlements();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Refresh failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAuthorize = async (bookingId: string, revisionNumber: number, revisionId?: string) => {
    setActionLoading('authorize');
    setActionMessage(null);
    try {
      await api.post(`/admin/settlements/${bookingId}/authorize`, { revisionNumber, revisionId });
      setActionMessage({ type: 'success', text: `Revision #${revisionNumber} authorized for execution.` });
      await loadDetail(bookingId);
      await fetchSettlements();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Authorization failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async (bookingId: string, revisionNumber: number) => {
    if (!confirm(`Execute transfers for Revision #${revisionNumber}? This will trigger recipient disbursements.`)) {
      return;
    }
    setActionLoading('execute');
    setActionMessage(null);
    try {
      const res = await api.post(`/admin/settlements/${bookingId}/execute`, { revisionNumber });
      setActionMessage({
        type: 'success',
        text: `Execution completed with status: ${res.overallStatus || 'DONE'}.`,
      });
      await loadDetail(bookingId);
      await fetchSettlements();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Execution failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReconcile = async (bookingId: string, transferIntentId: string) => {
    setActionLoading(`reconcile_${transferIntentId}`);
    setActionMessage(null);
    try {
      const res = await api.post(`/admin/settlements/${bookingId}/reconcile`, { transferIntentId });
      setActionMessage({
        type: 'success',
        text: `Transfer intent reconciled: Status is now ${res.status}.`,
      });
      await loadDetail(bookingId);
      await fetchSettlements();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Reconciliation failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    setActionLoading('refund');
    setActionMessage(null);

    const accom = Math.round(parseFloat(refundForm.accommodationPaise || '0') * 100);
    const clean = Math.round(parseFloat(refundForm.cleaningPaise || '0') * 100);
    const plat = Math.round(parseFloat(refundForm.platformFeePaise || '0') * 100);
    const tax = Math.round(parseFloat(refundForm.taxPaise || '0') * 100);

    try {
      await api.post(`/admin/settlements/${selectedBookingId}/refund`, {
        accommodationRefundPaise: accom.toString(),
        cleaningRefundPaise: clean.toString(),
        platformFeeRefundPaise: plat.toString(),
        taxRefundPaise: tax.toString(),
        reason: refundForm.reason || 'Admin component refund',
      });
      setIsRefundModalOpen(false);
      setRefundForm({ accommodationPaise: '', cleaningPaise: '', platformFeePaise: '', taxPaise: '', reason: '' });
      setActionMessage({ type: 'success', text: 'Component refund reserved and settlement refreshed.' });
      await loadDetail(selectedBookingId);
      await fetchSettlements();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Refund issue failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const closeDrawer = () => {
    detailRequestIdRef.current++; // Invalidate any in-flight detail request
    setSelectedBookingId(null);
    setSelectedDetail(null);
    setDetailError(null);
    setActionMessage(null);
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <span className="text-overline font-semibold uppercase tracking-widest text-rose-600">
            Financial Operations
          </span>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight flex items-center gap-2 mt-1">
            <DollarSign className="w-8 h-8 text-rose-600" /> Payout Settlements
          </h1>
          <p className="text-body text-neutral-500 mt-1">
            Deterministic split engine, eligibility state machine, and durable transfer execution.
          </p>
        </div>
        <button
          onClick={fetchSettlements}
          className="flex items-center gap-2 px-4 py-2 text-button font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-overline font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Status:
        </span>
        {['', 'READY', 'HELD', 'PROCESSING', 'SETTLED', 'PARTIALLY_SETTLED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-label font-medium uppercase transition ${statusFilter === st
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
          >
            {st || 'ALL'}
          </button>
        ))}
      </div>

      {/* Error banner with retry */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-red-700 text-body-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSettlements}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Action Message Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-body-sm font-semibold ${actionMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-red-50 border border-red-200 text-red-800'
            }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="ml-auto text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settlement Table */}
      {error ? (
        <Card className="shadow-none border border-neutral-200">
          <CardContent className="py-12 text-center">
            <div className="max-w-sm mx-auto space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="font-semibold text-neutral-900 text-body">Failed to load settlements</p>
              <p className="text-caption text-neutral-500">{error}</p>
              <button
                onClick={closeDrawer}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Request
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={[
            {
              key: 'bookingId',
              header: 'Booking ID',
              render: (item) => (
                <span className="font-mono text-caption font-semibold text-neutral-800">
                  {item.bookingId.slice(0, 12)}...
                </span>
              ),
            },
            {
              key: 'propertyGuest',
              header: 'Property & Guest',
              render: (item) => (
                <div>
                  <div className="font-semibold text-neutral-900 text-body-sm">{item.propertyTitle}</div>
                  <div className="text-caption text-neutral-500">Guest: {item.guestName}</div>
                </div>
              ),
            },
            {
              key: 'grossPaise',
              header: 'Gross Total',
              render: (item) => (
                <span className="font-semibold font-tabular text-neutral-900 text-body-sm">
                  {formatPaise(item.grossPaise)}
                </span>
              ),
            },
            {
              key: 'netAllocations',
              header: 'Net Allocations',
              render: (item) => (
                <div className="text-caption space-y-0.5">
                  <div>Host: <span className="font-semibold font-tabular">{formatPaise(item.hostNetPaise)}</span></div>
                  {Number(item.coHostNetPaise || 0) > 0 && (
                    <div className="text-rose-600">Co-Host: <span className="font-semibold font-tabular">{formatPaise(item.coHostNetPaise)}</span></div>
                  )}
                  <div className="text-neutral-400">Platform: <span className="font-tabular">{formatPaise(item.platformNetPaise)}</span></div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => (
                <StatusBadge status={item.status} showDot={true} />
              ),
            },
            {
              key: 'holdsRevisions',
              header: 'Holds / Revisions',
              render: (item) => (
                <div className="text-caption">
                  <div className="font-medium text-neutral-700">Rev #{item.currentRevisionNumber || 1}</div>
                  {item.holdReasons.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> {item.holdReasons.length} hold(s)
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              alignRight: true,
              render: (item) => (
                <button
                  onClick={() => loadDetail(item.bookingId)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-button font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Inspect
                </button>
              ),
            },
          ]}
          data={settlements}
          rowKey={(item) => item.id}
          loading={isLoading}
          loadingMessage="Loading settlement records..."
          emptyTitle="No settlements found"
          emptySubtitle="No settlements found matching the filter criteria."
        />
      )}

      {/* Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedBookingId)}
        onClose={() => {
          setSelectedBookingId(null);
          setSelectedDetail(null);
        }}
        title="Settlement Ledger & Execution"
        subtitle={selectedBookingId ? `Booking: ${selectedBookingId}` : undefined}
      >

        {/* Action Feedback Message */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-body-sm font-medium flex items-center gap-2 ${actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            {actionMessage.text}
          </div>
        )}

        {detailLoading ? (
          <div className="py-20 text-center text-neutral-400 text-caption">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-600" />
            Loading detailed settlement ledger...
          </div>
        ) : detailError ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3 my-8">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <div className="text-body-sm font-semibold text-red-900">{detailError}</div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => selectedBookingId && loadDetail(selectedBookingId)}
                className="px-4 py-2 text-button font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
              >
                Retry
              </button>
              <button
                onClick={closeDrawer}
                className="px-4 py-2 text-button font-medium text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : !selectedDetail ? (
          <div className="py-20 text-center text-neutral-400 text-caption space-y-3">
            <div>No settlement ledger details available for this booking.</div>
            <button
              onClick={closeDrawer}
              className="px-4 py-2 text-button font-medium text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status & Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <span className="text-overline font-semibold text-neutral-400 uppercase tracking-wider">Settlement</span>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(selectedDetail.status)}>
                    {selectedDetail.status}
                  </Badge>
                </div>
              </div>
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <span className="text-overline font-semibold text-neutral-400 uppercase tracking-wider">Booking Status</span>
                <div className="text-body-sm font-semibold text-neutral-800 mt-1">

                  {selectedDetail.booking?.status || 'N/A'}
                </div>
              </div>
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <span className="text-overline font-semibold text-neutral-400 uppercase tracking-wider">Current Revision</span>
                <div className="text-body-sm font-semibold text-neutral-800 mt-1">
                  Rev #{selectedDetail.revisions?.[0]?.revisionNumber || 1}
                </div>
              </div>
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <span className="text-overline font-semibold text-neutral-400 uppercase tracking-wider">Gross Amount</span>
                <div className="text-body-sm font-bold font-tabular text-neutral-900 mt-1">
                  ₹{selectedDetail.booking?.totalAmount ?? 0}
                </div>
              </div>
            </div>

            {/* Hold Reasons Alert */}
            {selectedDetail.holdReasons && selectedDetail.holdReasons.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="text-overline font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Active Settlement Holds
                </div>
                <ul className="text-caption text-amber-900 space-y-1 list-disc list-inside">
                  {selectedDetail.holdReasons.map((hr, idx) => (
                    <li key={idx} className="font-mono">{hr}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => handleRefresh(selectedDetail.bookingId)}
                disabled={actionLoading === 'refresh'}
                className="flex items-center gap-1.5 px-3 py-2 text-button font-medium text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                Refresh / Re-Evaluate
              </button>

              {selectedDetail.revisions?.[0] && !selectedDetail.revisions[0].isExecuted && ['READY', 'HELD'].includes(selectedDetail.status) && (
                <button
                  onClick={() =>
                    handleAuthorize(
                      selectedBookingId!,
                      selectedDetail.revisions[0].revisionNumber,
                      selectedDetail.revisions[0].id,
                    )
                  }
                  disabled={actionLoading === 'authorize'}
                  className="flex items-center gap-1.5 px-3 py-2 text-button font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authorize Rev #{selectedDetail.revisions[0].revisionNumber}
                </button>
              )}

              {['APPROVED', 'PARTIALLY_SETTLED'].includes(selectedDetail.status) && selectedDetail.revisions?.[0] && (
                <button
                  onClick={() =>
                    handleExecute(
                      selectedBookingId!,
                      selectedDetail.revisions[0].revisionNumber,
                    )
                  }
                  disabled={actionLoading === 'execute'}
                  className="flex items-center gap-1.5 px-3 py-2 text-button font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Execute Transfers
                </button>
              )}

              <button
                onClick={() => setIsRefundModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-button font-medium text-rose-700 bg-rose-50 rounded-xl hover:bg-rose-100 transition ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Issue Component Refund
              </button>
            </div>

            {/* Latest Revision Allocations Breakdown */}
            {selectedDetail.revisions?.[0] && (
              <div className="space-y-3">
                <h3 className="text-overline font-semibold uppercase tracking-wider text-neutral-400">
                  Revision #{selectedDetail.revisions[0].revisionNumber} Allocations
                </h3>
                <div className="border border-neutral-200 rounded-2xl overflow-hidden text-body-sm">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 text-neutral-500 text-overline font-semibold border-b border-neutral-200">
                      <tr>
                        <th className="py-2.5 px-3">Role / Key</th>
                        <th className="py-2.5 px-3">Gross</th>
                        <th className="py-2.5 px-3">Refund Deduction</th>
                        <th className="py-2.5 px-3">Net Entitled</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {(selectedDetail.revisions[0].allocations || []).map((alloc) => (
                        <tr key={alloc.id}>
                          <td className="py-2.5 px-3 font-mono font-medium text-caption">{alloc.allocationKey}</td>
                          <td className="py-2.5 px-3 font-tabular">{formatPaise(alloc.grossPaise)}</td>
                          <td className="py-2.5 px-3 font-tabular text-rose-600">
                            -{formatPaise(alloc.refundDeductionPaise)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold font-tabular text-neutral-900">
                            {formatPaise(alloc.netEntitledPaise)}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={getStatusBadgeVariant(alloc.status)}>
                              {alloc.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transfer Intents History */}
            <div className="space-y-3">
              <h3 className="text-overline font-semibold uppercase tracking-wider text-neutral-400">
                Recipient Transfer Intents ({(selectedDetail.transferIntents || []).length})
              </h3>
              {(!selectedDetail.transferIntents || selectedDetail.transferIntents.length === 0) ? (
                <div className="p-4 bg-neutral-50 rounded-xl text-caption text-neutral-500 text-center">
                  No transfer intents generated yet. Execute settlement when ready.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDetail.transferIntents.map((intent) => (
                    <div
                      key={intent.id}
                      className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-body-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-neutral-800 text-caption">{intent.allocationKey}</span>
                        <div className="flex items-center gap-1.5">
                          {((intent as any).isSimulated || intent.provider === 'MOCK_PROVIDER') && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-overline font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              SIMULATED
                            </span>
                          )}
                          <Badge variant={getStatusBadgeVariant(intent.status)}>{intent.status}</Badge>
                        </div>
                      </div>
                      {((intent as any).isSimulated || intent.provider === 'MOCK_PROVIDER') && (
                        <div className="p-1.5 bg-amber-50/80 border border-amber-200 rounded text-caption text-amber-900 font-medium">
                          ⚠️ Simulated Payout — No real money was disbursed through the banking network.
                        </div>
                      )}
                      <div className="flex items-center justify-between text-neutral-500 text-caption">
                        <span>Amount: <b className="text-neutral-900 font-tabular">{formatPaise(intent.amountPaise)}</b></span>
                        <span>Ref: <code className="text-neutral-700">{intent.operationReference}</code></span>
                      </div>
                      {intent.providerTransferId && (
                        <div className="text-caption text-emerald-700">
                          Provider Reference: <b>{intent.providerTransferId}</b>
                        </div>
                      )}
                      {intent.failureReason && (
                        <div className="text-caption text-rose-600 font-medium">
                          Failure: {intent.failureReason}
                        </div>
                      )}
                      {intent.status === 'UNKNOWN' && (
                        <button
                          onClick={() => handleReconcile(selectedDetail.bookingId, intent.id)}
                          disabled={actionLoading === `reconcile_${intent.id}`}
                          className="mt-2 text-caption font-semibold text-rose-600 underline hover:text-rose-800"
                        >
                          Reconcile With Cashfree Provider
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adjustments Section */}
            {selectedDetail.adjustments && selectedDetail.adjustments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-overline font-semibold uppercase tracking-wider text-neutral-400">
                  Post-Payout Adjustments
                </h3>
                <div className="space-y-2">
                  {selectedDetail.adjustments.map((adj: any) => (
                    <div key={adj.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-body-sm">
                      <div className="flex justify-between font-semibold text-amber-900">
                        <span>{adj.sourceEvent}</span>
                        <span className="font-tabular">Recovery: {formatPaise(adj.recoveryObligationPaise)}</span>
                      </div>
                      <div className="text-amber-800 mt-1 text-caption">Recipient: {adj.affectedRecipientRole} ({adj.status})</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Component Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Issue Itemized Refund"
        maxWidth="md"
      >
        <form onSubmit={handleIssueRefund} className="space-y-3 text-body-sm">
          <div>
            <label className="block text-label font-medium text-neutral-700 mb-1">Accommodation Refund (₹)</label>
            <input
              type="number"
              step="0.01"
              value={refundForm.accommodationPaise}
              onChange={(e) => setRefundForm({ ...refundForm, accommodationPaise: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-body-sm font-tabular focus:outline-rose-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-label font-medium text-neutral-700 mb-1">Cleaning Fee Refund (₹)</label>
            <input
              type="number"
              step="0.01"
              value={refundForm.cleaningPaise}
              onChange={(e) => setRefundForm({ ...refundForm, cleaningPaise: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-body-sm font-tabular focus:outline-rose-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-label font-medium text-neutral-700 mb-1">Platform Fee Refund (₹)</label>
            <input
              type="number"
              step="0.01"
              value={refundForm.platformFeePaise}
              onChange={(e) => setRefundForm({ ...refundForm, platformFeePaise: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-body-sm font-tabular focus:outline-rose-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-label font-medium text-neutral-700 mb-1">GST/Tax Refund (₹)</label>
            <input
              type="number"
              step="0.01"
              value={refundForm.taxPaise}
              onChange={(e) => setRefundForm({ ...refundForm, taxPaise: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-body-sm font-tabular focus:outline-rose-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-label font-medium text-neutral-700 mb-1">Reason / Notes</label>
            <input
              type="text"
              value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-body-sm focus:outline-rose-500"
              placeholder="e.g. Guest canceled early"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsRefundModalOpen(false)}
              className="w-1/2 py-2.5 text-button font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'refund'}
              className="w-1/2 py-2.5 text-button font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition cursor-pointer"
            >
              {actionLoading === 'refund' ? 'Reserving...' : 'Submit Refund'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
