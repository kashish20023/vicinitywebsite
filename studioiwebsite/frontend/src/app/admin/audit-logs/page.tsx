'use client';

import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Terminal, Lock, CheckCircle2 } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  adminUser: string;
  actionType: 'PROPERTY_APPROVE' | 'USER_BLOCK' | 'SETTLEMENT_EXECUTE' | 'PERMISSION_GRANT' | 'REFUND_ISSUE';
  ipAddress: string;
  affectedEntityId: string;
  details: string;
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-88101',
    timestamp: '2026-09-23 14:10:22',
    adminUser: 'admin@studioi.com (Studio I Admin)',
    actionType: 'SETTLEMENT_EXECUTE',
    ipAddress: '103.24.182.11',
    affectedEntityId: 'SET-9041',
    details: 'Executed payout settlement transfer of ₹18,742.50 to primary host Shyam Media Group.',
  },
  {
    id: 'LOG-88102',
    timestamp: '2026-09-23 13:45:00',
    adminUser: 'admin@studioi.com (Studio I Admin)',
    actionType: 'PROPERTY_APPROVE',
    ipAddress: '103.24.182.11',
    affectedEntityId: 'PROP-104',
    details: 'Approved new workspace listing Lehariya KGK Realty Cabin 402 into PUBLISHED state.',
  },
  {
    id: 'LOG-88103',
    timestamp: '2026-09-23 11:30:15',
    adminUser: 'security@studioi.com (Security Desk)',
    actionType: 'PERMISSION_GRANT',
    ipAddress: '49.36.190.54',
    affectedEntityId: 'usr-cohost-09',
    details: 'Granted 18-permission matrix package to secondary co-host Rajesh Sharma.',
  },
  {
    id: 'LOG-88104',
    timestamp: '2026-09-22 18:20:44',
    adminUser: 'admin@studioi.com (Studio I Admin)',
    actionType: 'USER_BLOCK',
    ipAddress: '103.24.182.11',
    affectedEntityId: 'usr-spammer-88',
    details: 'Blocked suspicious guest account due to unverified ID documents and flag.',
  },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => 
    l.adminUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.affectedEntityId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2.5 py-1 rounded-full border border-[#adcada]">
            Security & System Audit
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Platform Security Audit Logs
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Immutable audit trail recording administrative decisions, financial disbursements, and RBAC permission changes.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search action or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0e4962]"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-extrabold text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Admin Operator</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-6">Action Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-[#edf4f7]/20 transition">
                  <td className="py-4 px-6 text-neutral-500 whitespace-nowrap">{l.timestamp}</td>
                  <td className="py-4 px-4 font-bold text-neutral-900">{l.adminUser}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 bg-neutral-900 text-white font-sans text-[10px] font-bold rounded-md">
                      {l.actionType}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-[#0e4962]">{l.affectedEntityId}</td>
                  <td className="py-4 px-4 text-neutral-500">{l.ipAddress}</td>
                  <td className="py-4 px-6 font-sans text-neutral-700 leading-relaxed max-w-sm">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
