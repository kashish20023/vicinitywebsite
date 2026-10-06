'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { 
  Building, MapPin, Layers, Users, 
  ArrowRight, ExternalLink, Sparkles, CheckCircle2,
  Plus, Edit3
} from 'lucide-react';

export default function AdminSpacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpaces() {
      try {
        setLoading(true);
        const data = await apiRequest<any[]>('/workspaces');
        setWorkspaces(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch spaces');
      } finally {
        setLoading(false);
      }
    }
    loadSpaces();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Coworking Campuses & Floor Inventory
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage physical buildings, floor layouts, unit inventories, and pricing plans across Studio i locations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Campuses List */}
      <div className="space-y-6">
        {workspaces.map((ws) => {
          const floors = ws.buildings?.flatMap((b: any) => b.floors) || [];
          const firstFloor = floors[0];

          return (
            <div
              key={ws.id}
              className="bg-[#171717] rounded-3xl border border-neutral-800 p-6 sm:p-8 space-y-6 shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2.5 py-0.5 bg-[#0e4962]/20 text-[#0e4962] font-bold rounded-full">
                      {ws.city} Campus
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">ID: {ws.slug}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{ws.name}</h2>
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0e4962]" />
                    {ws.address}, {ws.city} - {ws.pincode}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/workspaces/${ws.slug}`}
                    target="_blank"
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>Public View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {firstFloor && (
                    <Link
                      href={`/admin/spaces/${firstFloor.id}/floor-plan`}
                      className="px-5 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      Launch 2D Floor Plan Editor
                    </Link>
                  )}
                </div>
              </div>

              {/* Floors and Units Summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Floors & Active Layouts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {floors.map((fl: any) => (
                    <div
                      key={fl.id}
                      className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">{fl.name}</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 font-bold text-[10px] rounded-full border border-emerald-800">
                          Published
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-400 space-y-1">
                        <div>Building: {ws.buildings?.[0]?.name || 'Main Tower'}</div>
                        <div>Floor Number: Level {fl.floorNumber}</div>
                      </div>

                      <Link
                        href={`/admin/spaces/${fl.id}/floor-plan`}
                        className="w-full text-center py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition block"
                      >
                        Edit Floor Plan Objects
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configured Booking Plans */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Configured Plans & Policies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {ws.bookingPlans?.map((plan: any) => (
                    <div key={plan.id} className="p-3 bg-neutral-900 rounded-xl border border-neutral-800/80 text-xs">
                      <div className="font-bold text-white truncate">{plan.title}</div>
                      <div className="text-[#0e4962] font-extrabold text-sm mt-0.5">
                        ₹{(Number(plan.ratePaise) / 100).toLocaleString('en-IN')}/{plan.planType.toLowerCase()}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-1">
                        {plan.minCommitmentMonths > 0 ? `${plan.minCommitmentMonths}-Month Minimum` : 'No Minimum'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
