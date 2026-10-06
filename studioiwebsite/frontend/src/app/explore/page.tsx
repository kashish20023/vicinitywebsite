'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiRequest } from '@/lib/api';
import {
  Search, MapPin, SlidersHorizontal, Users,
  Wifi, Coffee, Clock, ShieldCheck, Star,
  Grid, Map as MapIcon, ArrowRight, CheckCircle2,
  Sparkles, Layers
} from 'lucide-react';

interface Workspace {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  media: Array<{ url: string; caption: string; isHero: boolean }>;
  amenities: Array<{ amenity: { id: string; name: string; icon: string } }>;
  bookingPlans: Array<{
    id: string;
    unitType: string;
    planType: string;
    title: string;
    description: string;
    ratePaise: string;
    minCommitmentMonths: number;
  }>;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || 'All');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        setLoading(true);
        const data = await apiRequest<Workspace[]>('/workspaces');
        setWorkspaces(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch workspaces');
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaces();
  }, []);

  const cities = ['All', 'Jaipur'];
  const unitTypes = [
    { label: 'All Spaces', value: 'All' },
    { label: 'Hot Desk', value: 'HOT_DESK' },
    { label: 'Dedicated Desk', value: 'DEDICATED_DESK' },
    { label: 'Private Cabin', value: 'PRIVATE_CABIN' },
    { label: 'Meeting Room', value: 'MEETING_ROOM' },
  ];

  const availableAmenities = [
    'High-Speed Wi-Fi',
    'Specialty Coffee',
    '24/7 Access',
    'Ergonomic Seating',
    'Power Backup',
    'Boardroom Video Setup',
  ];

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((ws) => {
      if (selectedCity !== 'All' && ws.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      if (selectedType !== 'All') {
        const hasType = ws.bookingPlans.some((p) => p.unitType === selectedType);
        if (!hasType) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = ws.name.toLowerCase().includes(query);
        const matchesAddress = ws.address.toLowerCase().includes(query);
        const matchesTag = ws.tagline?.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress && !matchesTag) return false;
      }

      if (selectedAmenities.length > 0) {
        const wsAmenityNames = ws.amenities.map((a) => a.amenity.name.toLowerCase());
        const hasAll = selectedAmenities.every((sa) =>
          wsAmenityNames.some((an) => an.includes(sa.toLowerCase()))
        );
        if (!hasAll) return false;
      }

      return true;
    });
  }, [workspaces, selectedCity, selectedType, searchQuery, selectedAmenities]);

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 flex flex-col">
      <Navbar />

      {/* Subheader Search & Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by campus, landmark or road..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4962] focus:bg-white transition"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {/* City Selector */}
            <div className="flex bg-gray-100 p-1 rounded-full text-xs font-semibold">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-1.5 rounded-full transition ${selectedCity === city
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                    }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Type Selector */}
            <div className="hidden lg:flex bg-gray-100 p-1 rounded-full text-xs font-semibold">
              {unitTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`px-3.5 py-1.5 rounded-full transition ${selectedType === t.value
                    ? 'bg-[#0e4962] text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-full text-xs font-medium ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition ${viewMode === 'grid' ? 'bg-white shadow-xs text-black' : 'text-gray-500'
                  }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-full transition ${viewMode === 'map' ? 'bg-white shadow-xs text-black' : 'text-gray-500'
                  }`}
                title="Interactive Map view"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0e4962] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Studio i Coworking Spaces
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Explore Campuses & Available Seats
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredWorkspaces.length} fully equipped {filteredWorkspaces.length === 1 ? 'campus' : 'campuses'} with real-time floor availability.
            </p>
          </div>

          {/* Clear Filters Reset */}
          {(selectedCity !== 'All' || selectedType !== 'All' || searchQuery || selectedAmenities.length > 0) && (
            <button
              onClick={() => {
                setSelectedCity('All');
                setSelectedType('All');
                setSearchQuery('');
                setSelectedAmenities([]);
              }}
              className="text-xs font-semibold text-[#0e4962] hover:underline self-start sm:self-auto"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
                <div className="w-full h-64 bg-gray-200 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-10 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl my-8 text-center">
            <p className="font-semibold">{error}</p>
            <p className="text-xs mt-1 text-red-500">Ensure the Studio I backend is running on http://localhost:5002</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredWorkspaces.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 max-w-lg mx-auto">
            <div className="w-14 h-14 bg-[#edf4f7] text-[#0e4962] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No matching workspaces found</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Try adjusting your city filter, workspace category, or clearing specific amenities.
            </p>
            <button
              onClick={() => {
                setSelectedCity('All');
                setSelectedType('All');
                setSearchQuery('');
                setSelectedAmenities([]);
              }}
              className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition"
            >
              Show all Studio i locations
            </button>
          </div>
        )}

        {/* Catalog Grid View */}
        {!loading && !error && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredWorkspaces.map((ws) => {
              const heroMedia = ws.media?.find((m) => m.isHero) || ws.media?.[0];
              const lowestPlan = ws.bookingPlans?.reduce((min, p) => {
                const current = Number(p.ratePaise);
                const lowest = Number(min.ratePaise);
                return current < lowest ? p : min;
              }, ws.bookingPlans[0]);

              return (
                <div
                  key={ws.id}
                  className="group bg-white rounded-3xl border border-gray-200/80 hover:border-gray-300 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={heroMedia?.url || '/assets/building-lehariya.png'}
                      alt={ws.name}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                        <MapPin className="w-3 h-3 text-[#0e4962]" />
                        {ws.city}
                      </span>
                      {ws.isFeatured && (
                        <span className="px-3 py-1 bg-[#0e4962] text-white text-xs font-bold rounded-full shadow-sm">
                          Flagship
                        </span>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 flex items-center gap-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {ws.rating} <span className="text-gray-400 font-normal">({ws.reviewCount})</span>
                    </div>

                    {/* Bottom overlay text */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs font-medium text-white/80">{ws.tagline}</p>
                      <h3 className="text-xl font-bold tracking-tight text-white line-clamp-1">
                        {ws.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Address */}
                      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{ws.address}, {ws.city} - {ws.pincode}</span>
                      </p>

                      {/* Amenities Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {ws.amenities?.slice(0, 4).map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600 rounded-md"
                          >
                            {item.amenity.name}
                          </span>
                        ))}
                        {ws.amenities?.length > 4 && (
                          <span className="px-2 py-1 bg-gray-50 text-[11px] font-medium text-gray-400 rounded-md">
                            +{ws.amenities.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Plans Overview */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 mb-6">
                        {ws.bookingPlans?.slice(0, 4).map((plan) => (
                          <div key={plan.id} className="text-xs">
                            <p className="font-semibold text-gray-900 truncate">
                              {plan.unitType.replace('_', ' ')}
                            </p>
                            <p className="text-gray-500 text-[11px]">
                              ₹{(Number(plan.ratePaise) / 100).toLocaleString('en-IN')}/{plan.planType.toLowerCase()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA & Pricing */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                          Starting From
                        </span>
                        <div className="text-lg font-extrabold text-gray-900">
                          ₹{lowestPlan ? (Number(lowestPlan.ratePaise) / 100).toLocaleString('en-IN') : '499'}
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            /{lowestPlan?.planType.toLowerCase() || 'day'}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/workspaces/${ws.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-full shadow-xs hover:shadow-md transition"
                      >
                        Select Desk / Cabin
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Map / Coordinates View */}
        {!loading && !error && viewMode === 'map' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xs">
            <div className="max-w-xl mx-auto text-center mb-8">
              <div className="w-12 h-12 bg-[#edf4f7] text-[#0e4962] rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Studio i Jaipur & Rajasthan Campuses</h3>
              <p className="text-sm text-gray-500 mt-1">
                Pinpoint real locations, check distances and transit accessibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkspaces.map((ws) => (
                <div key={ws.id} className="p-5 border border-gray-200 rounded-2xl hover:border-[#0e4962] transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">{ws.name}</h4>
                      <span className="text-xs px-2.5 py-0.5 bg-gray-100 font-semibold rounded-full text-gray-700">
                        {ws.city}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{ws.address}</p>
                    <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded-lg mb-4">
                      Lat: {ws.latitude} | Lng: {ws.longitude} | IANA: {ws.timezone}
                    </div>
                  </div>

                  <Link
                    href={`/workspaces/${ws.slug}`}
                    className="w-full text-center py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"
                  >
                    View Campus & Seats
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading Studio i Campuses...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
