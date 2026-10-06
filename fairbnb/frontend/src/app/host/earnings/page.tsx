'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  Building,
} from 'lucide-react';

interface RecipientEntitlementsResponse {
  summary: {
    totalNetEntitledPaise: string;
    paidPaise: string;
    payablePaise: string;
    processingPaise: string;
    heldPaise: string;
  };
  entitlements: Array<{
    allocationId: string;
    bookingId: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    bookingStatus: string;
    settlementStatus: string;
    recipientRole: string;
    grossPaise: string;
    refundDeductionPaise: string;
    netEntitledPaise: string;
    status: 'PENDING' | 'ELIGIBLE' | 'HELD' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'ADJUSTED';
    holdReasons: string[];
    transfers: Array<{
      id: string;
      status: string;
      providerTransferId: string | null;
      failureReason: string | null;
      isSimulated?: boolean;
    }>;
  }>;
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
    case 'PAID':
    case 'SETTLED':
      return 'success';
    case 'ELIGIBLE':
    case 'APPROVED':
      return 'info';
    case 'HELD':
    case 'PROCESSING':
      return 'warning';
    case 'FAILED':
      return 'error';
    default:
      return 'default';
  }
}

function getHoldExplanation(reason: string): string {
  switch (reason) {
    case 'BOOKING_NOT_COMPLETED':
      return 'Guest has not completed check-out yet. Funds will release after stay.';
    case 'ACTIVE_DISPUTE_HOLD':
      return 'Booking is under dispute review with support.';
    case 'IN_FLIGHT_REFUND_HOLD':
      return 'A refund request is currently being processed.';
    case 'SNAPSHOT_NEEDS_REVIEW':
      return 'Agreement terms are being verified by FairBnB operations.';
    case 'MOCK_PAYMENT_NOT_LIVE_ELIGIBLE':
      return 'Test transaction simulated in development environment.';
    default:
      return reason.replace(/_/g, ' ').toLowerCase();
  }
}

export default function HostEarningsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RecipientEntitlementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<RecipientEntitlementsResponse>('/payouts/me/entitlements');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch host earnings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <span className="text-overline font-semibold uppercase tracking-wider text-emerald-600">
            Host Financial Portal
          </span>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight flex items-center gap-2 mt-1">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Host Earnings & Payouts
          </h1>
          <p className="text-body-sm text-neutral-500 mt-1">
            Transparent breakdown of your booking earnings, scheduled disbursements, and holds.
          </p>
        </div>
        <button
          onClick={fetchEntitlements}
          className="flex items-center gap-2 px-4 py-2 text-button font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Paid Out"
          value={formatPaise(data?.summary?.paidPaise)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="emerald"
          loading={isLoading}
          subtitle="Confirmed transferred to your account"
        />

        <StatCard
          title="Payable / Ready"
          value={formatPaise(data?.summary?.payablePaise)}
          icon={<TrendingUp className="w-4 h-4" />}
          variant="blue"
          loading={isLoading}
          subtitle="Eligible for execution batch"
        />

        <StatCard
          title="In Processing"
          value={formatPaise(data?.summary?.processingPaise)}
          icon={<Clock className="w-4 h-4" />}
          variant="amber"
          loading={isLoading}
          subtitle="Disbursement initiated with banking network"
        />

        <StatCard
          title="Held / Under Review"
          value={formatPaise(data?.summary?.heldPaise)}
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="rose"
          loading={isLoading}
          subtitle="Active stay or dispute hold"
        />
      </div>

      {/* Bookings & Entitlements Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-semibold text-neutral-900 text-h4">Booking Entitlements Ledger</h2>
          <span className="text-caption text-neutral-500 font-medium font-tabular">
            {data?.entitlements?.length || 0} booking records
          </span>
        </div>

        <DataTable
          columns={[
            {
              key: 'booking',
              header: 'Booking & Dates',
              render: (item: any) => (
                <div>
                  <div className="font-semibold text-neutral-900 flex items-center gap-1.5 text-body-sm">
                    <Building className="w-3.5 h-3.5 text-neutral-400" />
                    {item.propertyTitle}
                  </div>
                  <div className="text-caption text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.checkIn).toLocaleDateString()} - {new Date(item.checkOut).toLocaleDateString()}
                  </div>
                  <div className="font-mono text-caption text-neutral-500 mt-0.5">
                    ID: {item.bookingId.slice(0, 14)}...
                  </div>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (item: any) => (
                <span className="text-caption font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                  {item.recipientRole}
                </span>
              ),
            },
            {
              key: 'gross',
              header: 'Gross Share',
              cellClassName: 'font-medium text-neutral-800 font-tabular',
              render: (item: any) => formatPaise(item.grossPaise),
            },
            {
              key: 'deductions',
              header: 'Deductions',
              cellClassName: 'text-caption font-medium text-rose-600 font-tabular',
              render: (item: any) =>
                Number(item.refundDeductionPaise || 0) > 0
                  ? `-${formatPaise(item.refundDeductionPaise)}`
                  : '₹0.00',
            },
            {
              key: 'net',
              header: 'Net Entitlement',
              cellClassName: 'font-bold text-neutral-900 text-body font-tabular',
              render: (item: any) => formatPaise(item.netEntitledPaise),
            },
            {
              key: 'status',
              header: 'Payout Status',
              render: (item: any) => (
                <StatusBadge status={item.status} showDot={true} />
              ),
            },
            {
              key: 'notes',
              header: 'Hold / Disbursement Notes',
              cellClassName: 'text-caption max-w-xs',
              render: (item: any) => (
                <>
                  {item.holdReasons && item.holdReasons.length > 0 ? (
                    <div className="space-y-1">
                      {item.holdReasons.map((hr: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1 text-amber-700 bg-amber-50 p-1.5 rounded-lg text-caption"
                        >
                          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span>{getHoldExplanation(hr)}</span>
                        </div>
                      ))}
                    </div>
                  ) : item.transfers && item.transfers.length > 0 ? (
                    <div className="space-y-1 text-caption">
                      <div className="text-emerald-700 flex items-center gap-1.5 font-medium">
                        {item.transfers[0].providerTransferId ? (
                          <span>Ref: {item.transfers[0].providerTransferId}</span>
                        ) : (
                          <span>Transfer {item.transfers[0].status}</span>
                        )}
                      </div>
                      {item.transfers[0].isSimulated && (
                        <div className="inline-flex items-center gap-1 text-overline font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          <span>SIMULATED PAYOUT</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-neutral-400">Scheduled upon check-out</span>
                  )}
                </>
              ),
            },
          ]}
          data={data?.entitlements || []}
          rowKey={(item: any) => item.allocationId}
          loading={isLoading}
          loadingMessage="Loading your earnings ledger..."
          emptyTitle="No Payout Entitlements"
          emptySubtitle="Earnings will appear as bookings are confirmed."
        />
      </div>
    </div>
  );
}
