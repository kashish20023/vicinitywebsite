'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Shield, RefreshCw, Loader2, Search, Clock, User, Eye, X, Activity, FileText } from 'lucide-react';

interface AuditLogItem {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  details?: any;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('limit', '50');
      if (actionFilter !== 'ALL') {
        queryParams.set('action', actionFilter);
      }

      const res = await api.get<AuditLogItem[]>(`/admin/audit-logs?${queryParams.toString()}`);
      setLogs(res || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, actionFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(query) ||
      l.entityType.toLowerCase().includes(query) ||
      (l.entityId && l.entityId.toLowerCase().includes(query)) ||
      (l.actorId && l.actorId.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-7xl mx-auto pb-16 p-4 sm:p-4 space-y-8 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 sm:text-h1 font-bold text-neutral-900 tracking-tight">System Audit & Compliance Log</h1>
          <p className="text-neutral-500 mt-1 text-body-sm">
            Immutable system event trail recording administrative, security, and governance activities.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-semibold transition flex items-center gap-1.5 shadow-xs w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Trail
        </button>
      </div>

      {/* SEARCH & ACTION FILTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'PROPERTY_APPROVE', 'PROPERTY_REJECT', 'USER_SUSPEND', 'COHOST_ACTIVE', 'COHOST_SUSPENDED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActionFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-overline font-semibold transition uppercase tracking-wider cursor-pointer ${actionFilter === filter
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search action, entity ID, or actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:border-neutral-900 outline-none text-body-sm font-normal"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <DataTable<AuditLogItem>
        className="rounded-3xl"
        columns={[
          {
            key: 'timestamp',
            header: 'Timestamp',
            cellClassName: 'text-caption font-mono text-neutral-500 font-tabular',
            render: (log) => new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          {
            key: 'actor',
            header: 'Actor',
            render: (log) => (
              <>
                <p className="font-semibold text-neutral-900 text-body-sm">{log.actorRole}</p>
                <p className="text-caption text-neutral-400 font-mono">ID: {log.actorId.slice(0, 10)}...</p>
              </>
            ),
          },
          {
            key: 'action',
            header: 'Action Event',
            render: (log) => (
              <StatusBadge status={log.action} size="sm" />
            ),
          },
          {
            key: 'entity',
            header: 'Target Entity',
            render: (log) => (
              <span className="text-caption">
                <span className="font-semibold text-neutral-800">{log.entityType}</span>
                {log.entityId && <span className="text-neutral-400 font-mono ml-1.5">({log.entityId.slice(0, 8)}...)</span>}
              </span>
            ),
          },
          {
            key: 'details',
            header: 'Details',
            alignRight: true,
            render: (log) => (
              <button
                onClick={() => setSelectedLog(log)}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl text-caption font-semibold transition inline-flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> View Event JSON
              </button>
            ),
          },
        ] as Column<AuditLogItem>[]}
        data={filteredLogs}
        rowKey={(log) => log.id}
        loading={loading}
        loadingMessage="Querying platform event ledger..."
        emptyIcon={<Activity className="w-12 h-12 text-neutral-300 mx-auto" />}
        emptyTitle="No Audit Events Logged"
        emptySubtitle="No system events match your active audit filter."
      />

      {/* JSON DETAILS MODAL */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.action || ''}
        description="Audit Event Record"
        maxWidth="max-w-lg"
      >
        {selectedLog && (
          <div className="p-4 bg-neutral-900 text-neutral-100 font-mono text-xs rounded-2xl overflow-x-auto max-h-80">
            <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
