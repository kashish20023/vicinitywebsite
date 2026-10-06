'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { CategoryBar } from '@/components/catalog/CategoryBar';
import { FilterModal, FilterCriteria } from '@/components/catalog/FilterModal';
import { PropertyCard, PropertyCardData } from '@/components/catalog/PropertyCard';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { SearchMapView } from '@/components/catalog/SearchMapView';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import {
  Loader2,
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Users,
  Store,
  Map as MapIcon,
  List,
} from 'lucide-react';

import { FilterBar, FilterBarState } from '@/components/catalog/FilterBar';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Search & Filter States
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [guests, setGuests] = useState<number>(
    searchParams.get('guests') ? Number(searchParams.get('guests')) : 1,
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all',
  );
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    propertyType: searchParams.get('propertyType') || undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    instantBook: searchParams.get('instantBook') === 'true' ? true : undefined,
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')?.split(',') : undefined,
    sortBy: searchParams.get('sortBy') || 'recommended',
  });

  // Responsive map display state (auto-show map on desktop screens >= 1024px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const syncMap = () => setShowMap(mq.matches);
    syncMap();
    mq.addEventListener('change', syncMap);
    return () => mq.removeEventListener('change', syncMap);
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (guests > 1) params.append('maxGuests', guests.toString());
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.instantBook) params.append('instantBook', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get<PropertyCardData[]>(`/properties${queryStr}`);
      setProperties(data);
    } catch (err: any) {
      console.error('Failed to load search listings:', err);
      setError(err?.message || 'Failed to load listings. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [city, guests, selectedCategory, filters]);

  const filteredProperties = useMemo(() => {
    const result = properties.filter((prop) => {
      if (filters.bedrooms && (prop.bedrooms || 0) < filters.bedrooms) return false;
      if (filters.bathrooms && (prop.bathrooms || 0) < filters.bathrooms) return false;
      if (filters.amenities && filters.amenities.length > 0) {
        const extras = prop.listingExtras || {};
        const matchesAll = filters.amenities.every((amenityKey) => Boolean(extras[amenityKey]));
        if (!matchesAll) return false;
      }
      return true;
    });

    if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (filters.sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return result;
  }, [properties, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.propertyType) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.instantBook) count++;
    if (filters.amenities && filters.amenities.length > 0) count += filters.amenities.length;
    return count;
  }, [filters]);

  const handleHeaderSearch = (params: { city: string; guests: number }) => {
    setCity(params.city);
    setGuests(params.guests);
  };

  const handleClearAll = () => {
    setCity('');
    setGuests(1);
    setSelectedCategory('all');
    setFilters({});
  };

  const handleFilterBarChange = (newFilterState: FilterBarState) => {
    if (newFilterState.city !== undefined) setCity(newFilterState.city);
    if (newFilterState.category !== undefined) setSelectedCategory(newFilterState.category);
    setFilters({
      ...filters,
      ...newFilterState,
    });
  };

  const mainHeading = selectedCategory && selectedCategory !== 'all'
    ? `Stays in ${selectedCategory}s`
    : city
      ? `Stays in ${city}`
      : 'Explore Stays';

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* 1. HEADER */}
      <AirbnbHeader
        onSearch={handleHeaderSearch}
        currentCity={city}
        currentGuests={guests}
      />

      {/* 2. FILTER BAR (Any City | Price | All Categories | Rooms | Amenities | Any Type | Book Options | Recommended) */}
      <FilterBar
        filters={{
          city,
          category: selectedCategory,
          ...filters,
        }}
        onChange={handleFilterBarChange}
        onReset={handleClearAll}
      />

      {/* 3. CATEGORY BAR */}
      {/* <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onOpenFilters={() => setFilterModalOpen(true)}
        activeFilterCount={activeFilterCount}
      /> */}

      {/* 3. SPLIT CONTENT AREA: 60% LISTINGS | 40% MAP */}
      <main className="flex-1 flex w-full relative">

        {/* LEFT COLUMN: LISTINGS GRID */}
        <div
          className={`w-full lg:w-[60%] xl:w-[60%] ${showMap ? 'hidden lg:block' : 'block'
            }`}
        >
          <div className="px-4 sm:px-6 md:px-8 py-6">

            {/* HEADING BLOCK */}
            <div className="mb-6 sm:mb-8 flex items-start gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 text-gray-900 bg-gray-100 rounded-2xl">
                <Store className="w-6 h-6 sm:w-7 sm:h-7 text-[#0e4962]" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-h1 font-bold text-gray-900 tracking-tight leading-none mb-1.5">
                  {mainHeading}
                </h1>
                <p className="text-gray-500 text-body-sm font-medium font-tabular">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'stay' : 'stays'} found
                </p>
              </div>
            </div>

            {/* ACTIVE FILTER BADGES BAR */}
            {(city || selectedCategory !== 'all' || guests > 1 || activeFilterCount > 0) && (
              <div className="mb-6 flex flex-wrap items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-overline font-semibold text-gray-400 uppercase tracking-wider mr-1">
                  Active Filters:
                </span>

                {city && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
                    <MapPin className="w-3 h-3 text-[#0e4962]" />
                    <span>{city}</span>
                    <button onClick={() => setCity('')} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
                    <span>Category: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('all')} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {guests > 1 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
                    <Users className="w-3 h-3 text-gray-600" />
                    <span>{guests} guests</span>
                    <button onClick={() => setGuests(1)} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0e4962]">
                    <SlidersHorizontal className="w-3 h-3 text-[#0e4962]" />
                    <span>{activeFilterCount} custom filters</span>
                    <button onClick={() => setFilters({})} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleClearAll}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 ml-2 underline underline-offset-2 cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* ERROR STATE */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                <p className="text-sm text-rose-700 font-medium">{error}</p>
                <button
                  onClick={() => fetchProperties()}
                  className="ml-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* PROPERTIES GRID WITH LOADING SKELETONS & EMPTY STATES */}
            <PropertyGrid
              loading={loading}
              columns={3}
              skeletonCount={6}
              itemCount={filteredProperties.length}
              emptyIcon={<Search className="w-8 h-8 text-[#0e4962]" />}
              emptyTitle="No exact matches found"
              emptySubtitle="Try adjusting your search criteria, clearing your selected filters, or searching for a different destination."
              emptyAction={
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-6 py-3 bg-[#0e4962] hover:bg-[#0a374a] text-white text-sm font-bold rounded-2xl shadow transition cursor-pointer"
                >
                  Browse all stays
                </button>
              }
            >
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} openInNewTab={true} />
              ))}
            </PropertyGrid>

          </div>
        </div>

        {/* RIGHT COLUMN: STICKY MAP VIEW (40% WIDTH ON DESKTOP) */}
        <div
          className={`lg:block lg:w-[40%] xl:w-[40%] ${showMap ? 'fixed inset-0 z-40 lg:static lg:z-auto' : 'hidden'
            }`}
        >
          {/* MOBILE BACK TO LIST BUTTON */}
          {showMap && (
            <div className="lg:hidden absolute top-4 left-4 z-50">
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="bg-white text-gray-900 shadow-xl hover:bg-gray-100 rounded-full h-11 w-11 flex items-center justify-center border border-gray-200 cursor-pointer"
                aria-label="Show list"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="w-full h-full lg:h-[calc(100vh-140px)] lg:sticky lg:top-[140px] relative lg:p-4">
            <SearchMapView
              properties={filteredProperties}
              city={city || 'India'}
              onSearchArea={fetchProperties}
            />
          </div>
        </div>

        {/* MOBILE FLOATING MAP / LIST TOGGLE BUTTON */}
        {!loading && filteredProperties.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 lg:hidden">
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="rounded-full shadow-2xl bg-gray-900 text-white hover:bg-black h-11 px-5 flex items-center gap-2 text-sm font-bold cursor-pointer transition active:scale-95"
            >
              {showMap ? (
                <>
                  <List className="w-4 h-4" />
                  <span>Show list</span>
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4" />
                  <span>Map</span>
                </>
              )}
            </button>
          </div>
        )}

      </main>

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        initialFilters={filters}
      />

      {/* 4. FOOTER */}
      <div className="hidden lg:block w-full">
        <AirbnbFooter />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading Search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
