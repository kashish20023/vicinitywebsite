'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building, Plus, Search, Grid, List, MoreVertical, 
  Eye, Edit3, Users, Calendar, Star, Sparkles, AlertCircle
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  location: string;
  status: 'PUBLISHED' | 'DRAFT' | 'IN_REVIEW' | 'SUSPENDED';
  nightlyRate: number;
  rating: number;
  reviewsCount: number;
  image: string;
  coHostsCount: number;
}

const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'prop-101',
    title: 'Lehariya KGK Realty — Executive Coworking Floor',
    location: 'Near Jawahar Circle, Malviya Nagar, Jaipur',
    status: 'PUBLISHED',
    nightlyRate: 1500,
    rating: 4.5,
    reviewsCount: 42,
    image: '/assets/building-lehariya.png',
    coHostsCount: 2,
  },
  {
    id: 'prop-102',
    title: 'Horizon Tower — Executive Private Cabins',
    location: 'JLN Marg, Tonk Road, Jaipur',
    status: 'PUBLISHED',
    nightlyRate: 2800,
    rating: 4.3,
    reviewsCount: 28,
    image: '/assets/building-horizon.png',
    coHostsCount: 1,
  },
  {
    id: 'prop-103',
    title: 'Rathore Bhawan Alwar — Event & Conference Space',
    location: '1 Rathore Bhawan, Alwar, Rajasthan',
    status: 'IN_REVIEW',
    nightlyRate: 5000,
    rating: 4.8,
    reviewsCount: 14,
    image: '/assets/building-lehariya.png',
    coHostsCount: 0,
  },
];

export default function HostListingsPage() {
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Portfolio Directory</span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 mt-1">
            Property Listings Manager
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your published coworking assets, delegate co-hosts, inspect ratings, and configure pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'GRID' ? 'bg-[#0e4962] text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-700'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'LIST' ? 'bg-[#0e4962] text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/host/listings/new"
            className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Create New Listing
          </Link>
        </div>
      </div>

      {/* Listings Display */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((l) => (
            <div key={l.id} className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-44 bg-neutral-100 relative overflow-hidden">
                  <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black rounded-full border uppercase ${
                    l.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    l.status === 'IN_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}>
                    {l.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{l.rating}</span>
                    <span className="text-neutral-400">({l.reviewsCount} reviews)</span>
                  </div>
                  <h3 className="text-base font-black text-neutral-900 leading-snug">{l.title}</h3>
                  <p className="text-xs text-neutral-500">{l.location}</p>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-4">
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
                  <span className="text-neutral-500">Nightly Rate</span>
                  <span className="font-extrabold text-[#0e4962]">₹{l.nightlyRate.toLocaleString('en-IN')}/night</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/host/properties/${l.id}/co-hosts`}
                    className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition border border-neutral-200"
                  >
                    <Users className="w-3.5 h-3.5 text-[#0e4962]" /> Co-Hosts ({l.coHostsCount})
                  </Link>
                  <Link
                    href={`/host/calendar`}
                    className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition border border-neutral-200"
                    title="Calendar"
                  >
                    <Calendar className="w-4 h-4 text-[#0e4962]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-6">Property Title</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Base Rate</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Co-Host Delegates</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredListings.map((l) => (
                  <tr key={l.id} className="hover:bg-[#edf4f7]/20 transition">
                    <td className="py-4 px-6 font-bold text-neutral-900">{l.title}</td>
                    <td className="py-4 px-4 font-bold uppercase text-neutral-600">{l.status}</td>
                    <td className="py-4 px-4 font-bold text-[#0e4962]">₹{l.nightlyRate}/night</td>
                    <td className="py-4 px-4 font-bold text-amber-500">★ {l.rating}</td>
                    <td className="py-4 px-4">{l.coHostsCount} Co-Hosts</td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/host/properties/${l.id}/co-hosts`} className="text-[#0e4962] font-bold hover:underline">
                        Manage Co-Hosts
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
