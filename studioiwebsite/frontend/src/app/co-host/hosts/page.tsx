'use client';

import React from 'react';
import { Users, Mail, Phone, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function CoHostPrimaryHostsDirectoryPage() {
  const hosts = [
    {
      id: 'ph-1',
      name: 'Shyam Media Group',
      email: 'contact@shyammediagroup.com',
      phone: '+91 98290 12345',
      properties: ['Lehariya KGK Realty — Executive Coworking Floor'],
      splitAgreement: '15% Net Booking Revenue Split',
    },
    {
      id: 'ph-2',
      name: 'Priya Mehta',
      email: 'priya.mehta@studioi.com',
      phone: '+91 94140 98765',
      properties: ['Horizon Tower — Executive Private Cabins'],
      splitAgreement: '20% Net Booking Revenue Split',
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Team Relationships</span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
          Primary Property Hosts Directory
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Directory of primary workspace owners who have granted you operational co-hosting delegation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hosts.map((h) => (
          <div key={h.id} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-[#0e4962] to-[#1a6585] flex items-center justify-center font-black text-white text-lg shadow-xs">
                {h.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-black text-neutral-900">{h.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2 py-0.5 rounded-full border border-[#adcada]">
                  Primary Property Owner
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span>{h.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span>{h.phone}</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs space-y-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Co-Managed Workspaces</span>
              {h.properties.map((p) => (
                <div key={p} className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#0e4962]" /> {p}
                </div>
              ))}
              <div className="pt-2 border-t border-neutral-200 text-emerald-700 font-bold">
                Agreement: {h.splitAgreement}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
