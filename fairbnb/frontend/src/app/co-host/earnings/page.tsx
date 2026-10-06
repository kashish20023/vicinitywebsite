'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building,
  Calendar,
  Percent,
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

export default function CoHostEarningsPage() {
  const [data, setData] = useState<RecipientEntitlementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<RecipientEntitlementsResponse>('/payouts/me/entitlements');
      // Filter for co-host allocations or show all recipient allocations
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch co-host earnings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-rose-600" /> Earnings & Commission Tracker
          </span>
        }
        subtitle="Track your verified split share, payouts, and pending earnings across managed properties."
        breadcrumbs={[
          { label: 'Co-Host Workspace', href: '/co-host/bookings' },
          { label: 'Financials' },
        ]}
        badge="Co-Host Financials"
        actions={
          <button
            onClick={fetchEntitlements}
            className="flex items-center gap-2 px-3.5 py-1.5 text-button font-medium text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Paid Out"
          value={formatPaise(data?.summary?.paidPaise)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="emerald"
          loading={isLoading}
          trend={{ value: 'Direct transfers completed', isPositive: true }}
        />

        <StatCard
          title="Payable Commission"
          value={formatPaise(data?.summary?.payablePaise)}
          icon={<Percent className="w-4 h-4" />}
          variant="rose"
          loading={isLoading}
          subtitle="Eligible for transfer execution"
        />

        <StatCard
          title="Pending / Held"
          value={formatPaise(data?.summary?.heldPaise)}
          icon={<Clock className="w-4 h-4" />}
          variant="amber"
          loading={isLoading}
          subtitle="Releases after guest check-out"
        />
      </div>

      {/* Bookings Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-semibold text-neutral-900 text-h4">Managed Bookings & Split Commissions</h2>
          <span className="text-caption text-neutral-400 font-tabular">
            {data?.entitlements?.length || 0} records
          </span>
        </div>

        <DataTable
          columns={[
            {
              key: 'property',
              header: 'Property & Dates',
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
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (item: any) => (
                <span className="font-medium text-caption px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                  {item.recipientRole}
                </span>
              ),
            },
            {
              key: 'gross',
              header: 'Gross Share',
              cellClassName: 'font-tabular',
              render: (item: any) => formatPaise(item.grossPaise),
            },
            {
              key: 'deductions',
              header: 'Deductions',
              cellClassName: 'text-rose-600 font-medium font-tabular',
              render: (item: any) =>
                Number(item.refundDeductionPaise || 0) > 0
                  ? `-${formatPaise(item.refundDeductionPaise)}`
                  : '₹0.00',
            },
            {
              key: 'net',
              header: 'Net Commission',
              cellClassName: 'font-semibold font-tabular text-neutral-900 text-body',
              render: (item: any) => formatPaise(item.netEntitledPaise),
            },
            {
              key: 'status',
              header: 'Payout Status',
              render: (item: any) => (
                <div className="flex flex-col gap-1 items-start">
                  <StatusBadge status={item.status} showDot={true} />
                  {item.transfers?.[0]?.isSimulated && (
                    <span className="inline-flex items-center text-overline font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                      SIMULATED
                    </span>
                  )}
                </div>
              ),
            },
          ]}
          data={data?.entitlements || []}
          rowKey={(item: any) => item.allocationId}
          loading={isLoading}
          loadingMessage="Loading commission ledger..."
          emptyTitle="No Co-Host Commissions"
          emptySubtitle="No co-host commission records found yet."
        />
      </div>
    </div>
  );
}
