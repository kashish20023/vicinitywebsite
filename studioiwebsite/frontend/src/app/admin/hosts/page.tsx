'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, ShieldCheck, CheckCircle2, AlertTriangle, 
  Search, ExternalLink, MoreVertical, Ban, RefreshCw, Eye, Users
} from 'lucide-react';

interface Host {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
  totalProperties: number;
  totalEarningsRupees: number;
  coHostCount: number;
  joinedDate: string;
}

const MOCK_HOSTS: Host[] = [
  {
    id: 'host-01',
    name: 'Shyam Media Group',
    email: 'contact@shyammediagroup.com',
    phone: '+91 98290 12345',
    isVerified: true,
    status: 'ACTIVE',
    totalProperties: 3,
    totalEarningsRupees: 485000,
    coHostCount: 4,
    joinedDate: '2025-01-10',
  },
  {
    id: 'host-02',
    name: 'Priya Mehta',
    email: 'priya.mehta@studioi.com',
    phone: '+91 94140 98765',
    isVerified: true,
    status: 'ACTIVE',
    totalProperties: 2,
    totalEarningsRupees: 192000,
    coHostCount: 2,
    joinedDate: '2025-06-18',
  },
  {
    id: 'host-03',
    name: 'Suresh Kumar',
    email: 'suresh.k@gmail.com',
    phone: '+91 99820 44332',
    isVerified: false,
    status: 'SUSPENDED',
    totalProperties: 1,
    totalEarningsRupees: 45000,
    coHostCount: 1,
    joinedDate: '2026-02-01',
  },
];

export default function AdminHostsPage() {
  const [hosts, setHosts] = useState<Host[]>(MOCK_HOSTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHosts = hosts.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setHosts(prev => prev.map(h => {
      if (h.id === id) {
        const nextStatus = h.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        return { ...h, status: nextStatus };
      }
      return h;
    }));
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2.5 py-1 rounded-full border border-[#adcada]">
            Platform Host Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Host Governance Directory
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage primary property owners, verify identity credentials, audit revenue payouts, and manage account statuses.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search host name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0e4962]"
          />
        </div>
      </div>

      {/* Hosts Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-extrabold text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-6">Host Name & Contact</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Properties</th>
                <th className="py-3.5 px-4">Co-Host Team</th>
                <th className="py-3.5 px-4">Total Revenue</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredHosts.map((h) => (
                <tr key={h.id} className="hover:bg-[#edf4f7]/20 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-neutral-900">{h.name}</div>
                    <div className="text-[11px] text-neutral-400">{h.email} • {h.phone}</div>
                  </td>
                  <td className="py-4 px-4">
                    {h.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> KYC Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                        <AlertTriangle className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-black text-neutral-900">{h.totalProperties} Active Units</td>
                  <td className="py-4 px-4 font-semibold text-neutral-700">
                    <Link
                      href="/admin/co-hosts"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 transition text-[11px]"
                      title="Inspect Co-Host team"
                    >
                      <Users className="w-3 h-3 text-purple-600" />
                      <span>{h.coHostCount} Co-Hosts</span>
                    </Link>
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-700">₹{h.totalEarningsRupees.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      h.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Link
                      href={`/admin/hosts/${h.id}`}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0e4962]" /> View Details
                    </Link>
                    <button
                      onClick={() => toggleStatus(h.id)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        h.status === 'ACTIVE' ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {h.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
