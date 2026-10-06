'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Building2, Search, RefreshCw, Loader2, ExternalLink, 
  MapPin, CheckCircle2, Layers, Plus, Star, Users
} from 'lucide-react';

export default function AdminListingsPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadListings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/workspaces');
      setWorkspaces(res);
    } catch (e) {
      console.error('Failed to load listings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const filtered = workspaces.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.city.toLowerCase().includes(search.toLowerCase()) ||
    w.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0e4962]">
            Coworking Campus Inventory
          </span>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Workspaces & Floor Plans
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage flagship buildings, floors, and 2D theatre-style desk/cabin layouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadListings}
            className="p-2.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0e4962]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search workspace by title, city, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#0e4962]"
          />
        </div>
      </div>

      {/* Listings Table */}
      <Card className="border border-neutral-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-5">Workspace / Campus</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Rating & Reviews</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0e4962] mx-auto mb-2" />
                    Loading workspaces...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-neutral-400">
                    No matching workspaces found.
                  </td>
                </tr>
              ) : (
                filtered.map((ws) => (
                  <tr key={ws.id} className="hover:bg-[#edf4f7]/20 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-neutral-900 text-sm">{ws.name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">/{ws.slug}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#0e4962]" />
                        <span>{ws.city} Flagship</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate max-w-xs mt-0.5">{ws.address}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 font-bold text-neutral-900">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{ws.rating || 4.9}</span>
                        <span className="text-neutral-400 text-[11px]">({ws.reviewCount || 48})</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={ws.isPublished ? 'success' : 'default'}>
                        {ws.isPublished ? 'LIVE' : 'DRAFT'}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <Link
                        href={`/admin/spaces/85b1a37a-a43b-48ad-8181-fc46f990ad8e/floor-plan`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#edf4f7] hover:bg-[#edf4f7] text-[#0e4962] font-bold text-xs rounded-xl border border-[#adcada] transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>2D Floor Plan</span>
                      </Link>
                      <Link
                        href={`/workspaces/${ws.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
