'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Building2, CheckCircle2, XCircle, Shield, Calendar, Users, ArrowRight } from 'lucide-react';

export default function CoHostWorkspacesPage() {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await apiRequest('/co-host/me/workspaces');
        setDelegations(data);
      } catch (err) {
        console.error('Failed to load co-host workspaces', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaces();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-5xl">
        <div className="h-28 bg-white rounded-3xl border border-neutral-200" />
        <div className="h-64 bg-white rounded-3xl border border-neutral-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl text-neutral-900">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Delegated Operations</span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 mt-1">
          Assigned Coworking Workspaces
        </h1>
        <p className="text-xs text-neutral-500 mt-2">
          You have been granted operational permissions to manage customer bookings, view schedules, and inspect facilities for the spaces below.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {delegations.map((del) => {
          const ws = del.workspace;
          return (
            <div
              key={del.id}
              className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-neutral-900">{ws.name}</h2>
                    <span className="px-2.5 py-0.5 bg-[#edf4f7] text-[#0e4962] border border-[#adcada] text-[10px] font-bold rounded-full uppercase">
                      {ws.city} Flagship
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{ws.address}</p>
                </div>

                <div className="text-xs text-neutral-500">
                  <span className="text-[10px] text-neutral-400 uppercase block">Workspace Owner</span>
                  <span className="font-semibold text-neutral-900">{ws.host?.name || 'Studio i Host'}</span>
                </div>
              </div>

              {/* Granted Permissions Matrix */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">
                  Your Specific Granted Capabilities
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center gap-2">
                    {del.canManageBookings ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />}
                    <span className={del.canManageBookings ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>Manage Bookings</span>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center gap-2">
                    {del.canManageCalendar ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />}
                    <span className={del.canManageCalendar ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>View Calendar</span>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center gap-2">
                    {del.canManageMaintenance ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />}
                    <span className={del.canManageMaintenance ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>Maintenance Issues</span>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center gap-2">
                    {del.canMessageGuests ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />}
                    <span className={del.canMessageGuests ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>Message Members</span>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center gap-2">
                    {del.canManageListing ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />}
                    <span className={del.canManageListing ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>Edit Workspace</span>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center gap-2">
                    {del.canViewFinances ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />}
                    <span className={del.canViewFinances ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>Financial Oversight</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
