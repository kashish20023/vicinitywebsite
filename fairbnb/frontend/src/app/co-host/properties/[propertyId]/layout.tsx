'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { getPermissionGroups, getAccessSentence } from '@/lib/permissions/groupPermissions';

export default function CoHostPropertyWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { propertyId } = useParams();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspaceData() {
      if (!propertyId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<any>(`/co-host/properties/${propertyId}/dashboard`);
        setDashboardData(res);
      } catch (err: any) {
        setError(err.message || 'Access denied: Active co-host relationship required.');
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaceData();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-3" />
        <p className="text-sm font-semibold text-neutral-600">Loading workspace...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-900">Workspace Access Restricted</h2>
          <p className="text-xs text-neutral-500">{error || 'You do not have active co-host permissions for this property.'}</p>
          <Link
            href="/co-host"
            className="inline-block w-full py-2.5 bg-[#0e4962] text-white rounded-xl text-xs font-bold hover:bg-[#1a6585] transition"
          >
            Back to Co-Host Portal
          </Link>
        </div>
      </div>
    );
  }

  const grantedPermissions = dashboardData?.grantedPermissions || [];
  const groups = getPermissionGroups(grantedPermissions);
  const sentence = getAccessSentence(grantedPermissions);
  const prop = dashboardData?.property;
  const host = dashboardData?.hostUser;

  return (
    <div className="w-full space-y-6">
      {/* WORKSPACE SUB-NAVIGATION BAR */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/co-host/properties"
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-button font-medium rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            ← Properties
          </Link>
          <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
          <div>
            <h2 className="text-body font-semibold text-neutral-900 line-clamp-1">{prop?.title || 'Property Workspace'}</h2>
            <p className="text-caption text-neutral-500 font-normal">
              Host: <span className="font-semibold text-neutral-800">{host?.name || 'Owner'}</span> • {sentence}
            </p>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS - CONDITIONAL RENDER ONLY FOR ALLOWED GROUPS (RULE #2) */}
        <div className="flex items-center gap-1 overflow-x-auto text-button font-medium pb-1 sm:pb-0">
          <Link
            href={`/co-host/properties/${propertyId}`}
            className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition"
          >
            Overview
          </Link>

          {groups.calendar && (
            <Link
              href={`/co-host/properties/${propertyId}/calendar`}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition"
            >
              Calendar
            </Link>
          )}

          {groups.bookings && (
            <Link
              href={`/co-host/properties/${propertyId}/bookings`}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition"
            >
              Bookings
            </Link>
          )}

          {groups.guests && (
            <Link
              href={`/co-host/properties/${propertyId}/messages`}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition"
            >
              Messages
            </Link>
          )}

          {groups.operations && (
            <Link
              href={`/co-host/properties/${propertyId}/maintenance`}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 text-neutral-700 transition"
            >
              Tasks
            </Link>
          )}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
