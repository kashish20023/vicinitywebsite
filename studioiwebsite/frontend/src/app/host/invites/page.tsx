'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, Clock, Trash2, ArrowRight } from 'lucide-react';

interface SentInvite {
  id: string;
  invitedEmail: string;
  propertyTitle: string;
  presetPackage: string;
  splitSummary: string;
  expiresInDays: number;
  tokenLink: string;
}

const MOCK_INVITES: SentInvite[] = [
  {
    id: 'inv-801',
    invitedEmail: 'cohost.operator@gmail.com',
    propertyTitle: 'Lehariya KGK Realty — Executive Coworking Floor',
    presetPackage: 'OPERATIONS',
    splitSummary: '15% Revenue Split',
    expiresInDays: 5,
    tokenLink: 'http://localhost:3000/co-host/invite?token=studioi_tok_8841029',
  }
];

export default function HostSentInvitesPage() {
  const [invites, setInvites] = useState<SentInvite[]>(MOCK_INVITES);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeInvite = (id: string) => {
    setInvites(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Invitation Tokens</span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
          Sent Co-Host Invitations & Tokens
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Track pending co-host invitations sent to property managers, concierges, and cleaning coordinators.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Invited Email</th>
                <th className="py-3.5 px-4">Property</th>
                <th className="py-3.5 px-4">Permission Package</th>
                <th className="py-3.5 px-4">Split</th>
                <th className="py-3.5 px-4">Expires In</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invites.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#edf4f7]/20 transition">
                  <td className="py-4 px-4 font-bold text-neutral-900">{inv.invitedEmail}</td>
                  <td className="py-4 px-4">{inv.propertyTitle}</td>
                  <td className="py-4 px-4 font-mono font-bold text-purple-600">{inv.presetPackage}</td>
                  <td className="py-4 px-4 font-bold text-[#0e4962]">{inv.splitSummary}</td>
                  <td className="py-4 px-4 text-amber-600 font-semibold">{inv.expiresInDays} days left</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => copyLink(inv.id, inv.tokenLink)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0e4962]" />}
                      {copiedId === inv.id ? 'Copied!' : 'Copy Invite Link'}
                    </button>
                    <button
                      onClick={() => revokeInvite(inv.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Revoke
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
