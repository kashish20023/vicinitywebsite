'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DollarSign, TrendingUp, CreditCard, RefreshCw, Loader2, ArrowUpRight, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CollectionsData {
  financialSummary: {
    totalCollectedVolume: number;
    totalPlatformServiceFees: number;
    totalPayoutsPending: number;
    totalPayoutsApproved: number;
    invoicesCount: number;
  };
  recentInvoices: any[];
}

interface RefundItem {
  id: string;
  amount: number;
  reason?: string | null;
  status: string;
  requestedAt: string;
  booking?: {
    id: string;
    totalAmount: number;
    guest?: { name: string; email?: string };
    property?: { title: string };
  };
}

export default function AdminFinancePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<CollectionsData | null>(null);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'refunds'>('overview');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [collRes, refRes] = await Promise.all([
        api.get<CollectionsData>('/admin/collections'),
        api.get<{ data: RefundItem[] }>('/admin/refunds'),
      ]);
      setData(collRes);
      setRefunds(refRes.data || []);
    } catch (err) {
      console.error('Error fetching finance collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFinanceData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const summary = data?.financialSummary;

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-8 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight">Platform Financial Governance</h1>
          <p className="text-body text-neutral-500 mt-1">
            Track gross booking collections, platform service fees, host payouts, and refunds.
          </p>
        </div>
        <button
          onClick={fetchFinanceData}
          className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-xs w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Financials
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-caption font-medium text-neutral-500">Calculating financial ledgers...</p>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Gross Booking Volume"
              value={`₹${(summary?.totalCollectedVolume ?? 0).toLocaleString('en-IN')}`}
              icon={<DollarSign className="w-4 h-4" />}
              variant="emerald"
              subtitle="Total payments collected"
            />

            <StatCard
              title="Platform Service Fees"
              value={`₹${(summary?.totalPlatformServiceFees ?? 0).toLocaleString('en-IN')}`}
              icon={<TrendingUp className="w-4 h-4" />}
              variant="purple"
              subtitle="Net platform earnings (10%)"
            />

            <StatCard
              title="Pending Payouts"
              value={`₹${(summary?.totalPayoutsPending ?? 0).toLocaleString('en-IN')}`}
              icon={<CreditCard className="w-4 h-4" />}
              variant="amber"
              subtitle="Awaiting release to hosts"
            />

            <StatCard
              title="Approved Payouts"
              value={`₹${(summary?.totalPayoutsApproved ?? 0).toLocaleString('en-IN')}`}
              icon={<CheckCircle2 className="w-4 h-4" />}
              variant="blue"
              subtitle="Disbursed to host accounts"
            />
          </div>

          {/* TAB BAR */}
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-label font-medium uppercase tracking-wider transition ${activeTab === 'overview'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
            >
              Recent Invoices ({data?.recentInvoices?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`px-4 py-2 rounded-xl text-label font-medium uppercase tracking-wider transition ${activeTab === 'refunds'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
            >
              Refund Requests ({refunds.length})
            </button>
          </div>

          {activeTab === 'overview' && (
            <DataTable<any>
              columns={[
                {
                  key: 'invoice',
                  header: 'Invoice #',
                  cellClassName: 'font-mono font-semibold text-neutral-900 text-body-sm',
                  render: (inv) => inv.invoiceNumber,
                },
                {
                  key: 'amount',
                  header: 'Total Amount',
                  cellClassName: 'font-semibold font-tabular text-neutral-900 text-body',
                  render: (inv) => `₹${inv.amount.toLocaleString('en-IN')}`,
                },
                {
                  key: 'fee',
                  header: 'Service Fee Share',
                  cellClassName: 'text-caption font-semibold font-tabular text-purple-700',
                  render: (inv) => `₹${(inv.booking?.serviceFee || inv.amount * 0.1).toLocaleString('en-IN')}`,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (inv) => (
                    <StatusBadge status={inv.status} showDot={true} />
                  ),
                },
                {
                  key: 'date',
                  header: 'Created Date',
                  cellClassName: 'text-caption text-neutral-500 font-medium',
                  render: (inv) => new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                },
              ] as Column<any>[]}
              data={data?.recentInvoices || []}
              rowKey={(inv) => inv.id}
              loading={false}
              emptyIcon={<Receipt className="w-12 h-12 text-neutral-300 mx-auto" />}
              emptyTitle="No Invoices Recorded Yet"
              emptySubtitle="Invoices are automatically generated when guest bookings complete."
            />
          )}

          {activeTab === 'refunds' && (
            <DataTable<RefundItem>
              columns={[
                {
                  key: 'id',
                  header: 'Refund ID',
                  cellClassName: 'font-mono font-semibold text-neutral-900 text-body-sm',
                  render: (ref) => `#${ref.id.slice(0, 8)}...`,
                },
                {
                  key: 'booking',
                  header: 'Booking',
                  render: (ref) => (
                    <>
                      <p className="font-semibold text-neutral-900 max-w-xs truncate text-body-sm">{ref.booking?.property?.title || 'Property'}</p>
                      <p className="text-caption text-neutral-400 font-mono">Guest: {ref.booking?.guest?.name || 'Guest'}</p>
                    </>
                  ),
                },
                {
                  key: 'amount',
                  header: 'Refund Amount',
                  cellClassName: 'font-semibold font-tabular text-rose-600 text-body',
                  render: (ref) => `₹${ref.amount.toLocaleString('en-IN')}`,
                },
                {
                  key: 'reason',
                  header: 'Reason',
                  cellClassName: 'text-caption text-neutral-600 max-w-xs truncate',
                  render: (ref) => ref.reason || 'Admin initiated',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (ref) => (
                    <StatusBadge status={ref.status} showDot={true} />
                  ),
                },
                {
                  key: 'date',
                  header: 'Requested At',
                  cellClassName: 'text-caption text-neutral-500',
                  render: (ref) => new Date(ref.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                },
              ] as Column<RefundItem>[]}
              data={refunds}
              rowKey={(ref) => ref.id}
              loading={false}
              emptyIcon={<CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />}
              emptyTitle="No Refund Claims"
              emptySubtitle="There are no pending or processed refund requests in the database."
            />
          )}
        </>
      )}
    </div>
  );
}
