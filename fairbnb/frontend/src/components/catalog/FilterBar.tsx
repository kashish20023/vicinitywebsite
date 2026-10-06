'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Home,
  X,
  Zap,
  Key,
  Calendar,
  PawPrint,
  Wifi,
  Utensils,
  Wind,
  WashingMachine,
  Shirt,
  Thermometer,
  Waves,
  Car,
  Dumbbell,
  Tv,
  Monitor,
  Briefcase,
  Bath,
  ArrowUpDown,
  ChevronDown,
  Check,
} from 'lucide-react';

const POPULAR_AMENITIES = [
  { label: 'Wifi', icon: Wifi, id: 'wifi' },
  { label: 'Kitchen', icon: Utensils, id: 'kitchen' },
  { label: 'Air conditioning', icon: Wind, id: 'airConditioning' },
  { label: 'Washer', icon: WashingMachine, id: 'washer' },
  { label: 'Dryer', icon: Shirt, id: 'dryer' },
  { label: 'Heating', icon: Thermometer, id: 'heating' },
  { label: 'Pool', icon: Waves, id: 'pool' },
  { label: 'Hot tub', icon: Bath, id: 'jacuzzi' },
  { label: 'Free parking', icon: Car, id: 'parking' },
  { label: 'Gym', icon: Dumbbell, id: 'gym' },
  { label: 'TV', icon: Tv, id: 'tv' },
  { label: 'Dedicated workspace', icon: Monitor, id: 'workspace' },
];

const BOOKING_OPTIONS = [
  { id: 'instant_book', label: 'Instant Book', icon: Zap },
  { id: 'self_checkin', label: 'Self check-in', icon: Key },
  { id: 'free_cancellation', label: 'Free cancellation', icon: Calendar },
  { id: 'pets_allowed', label: 'Allows pets', icon: PawPrint },
];

export interface FilterBarState {
  city?: string;
  category?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  instantBook?: boolean;
  sortBy?: string;
}

interface FilterBarProps {
  filters?: FilterBarState;
  onChange?: (newFilters: FilterBarState) => void;
  onReset?: () => void;
}

export function FilterBar({ filters = {}, onChange, onReset }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active popover identifier
  const [openPopover, setOpenPopover] = useState<
    'city' | 'price' | 'category' | 'rooms' | 'amenities' | 'type' | 'booking' | 'sort' | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter input states
  const [location, setLocation] = useState(filters.city || searchParams.get('city') || '');
  const [category, setCategory] = useState(filters.category || searchParams.get('category') || 'all');
  const [propertyType, setPropertyType] = useState(filters.propertyType || searchParams.get('propertyType') || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || Number(searchParams.get('minPrice')) || 0,
    filters.maxPrice || Number(searchParams.get('maxPrice')) || 50000,
  ]);
  const [bedrooms, setBedrooms] = useState<string>(filters.bedrooms?.toString() || searchParams.get('bedrooms') || '');
  const [bathrooms, setBathrooms] = useState<string>(filters.bathrooms?.toString() || searchParams.get('bathrooms') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    filters.amenities || searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );
  const [bookingOptions, setBookingOptions] = useState<string[]>(
    filters.instantBook ? ['instant_book'] : searchParams.get('bookingOptions')?.split(',').filter(Boolean) || []
  );
  const [sort, setSort] = useState(filters.sortBy || searchParams.get('sortBy') || 'recommended');

  // Sync state with props or URL changes
  useEffect(() => {
    setLocation(filters.city || searchParams.get('city') || '');
    setCategory(filters.category || searchParams.get('category') || 'all');
    setPropertyType(filters.propertyType || searchParams.get('propertyType') || 'all');
    setPriceRange([
      filters.minPrice || Number(searchParams.get('minPrice')) || 0,
      filters.maxPrice || Number(searchParams.get('maxPrice')) || 50000,
    ]);
    setBedrooms(filters.bedrooms?.toString() || searchParams.get('bedrooms') || '');
    setBathrooms(filters.bathrooms?.toString() || searchParams.get('bathrooms') || '');
    setSelectedAmenities(
      filters.amenities || searchParams.get('amenities')?.split(',').filter(Boolean) || []
    );
    setSort(filters.sortBy || searchParams.get('sortBy') || 'recommended');
  }, [searchParams, filters]);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerChange = (updatedState: Partial<FilterBarState>) => {
    const newState: FilterBarState = {
      city: location === 'all' ? undefined : location,
      category: category === 'all' ? undefined : category,
      propertyType: propertyType === 'all' ? undefined : propertyType,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      instantBook: bookingOptions.includes('instant_book'),
      sortBy: sort === 'recommended' ? undefined : sort,
      ...updatedState,
    };

    if (onChange) {
      onChange(newState);
    }

    // Sync to URL parameters
    const next = new URLSearchParams(searchParams.toString());
    if (newState.city) next.set('city', newState.city); else next.delete('city');
    if (newState.category && newState.category !== 'all') next.set('category', newState.category); else next.delete('category');
    if (newState.propertyType && newState.propertyType !== 'all') next.set('propertyType', newState.propertyType); else next.delete('propertyType');
    if (newState.minPrice) next.set('minPrice', newState.minPrice.toString()); else next.delete('minPrice');
    if (newState.maxPrice) next.set('maxPrice', newState.maxPrice.toString()); else next.delete('maxPrice');
    if (newState.bedrooms) next.set('bedrooms', newState.bedrooms.toString()); else next.delete('bedrooms');
    if (newState.bathrooms) next.set('bathrooms', newState.bathrooms.toString()); else next.delete('bathrooms');
    if (newState.amenities && newState.amenities.length > 0) next.set('amenities', newState.amenities.join(',')); else next.delete('amenities');
    if (newState.instantBook) next.set('instantBook', 'true'); else next.delete('instantBook');
    if (newState.sortBy && newState.sortBy !== 'recommended') next.set('sortBy', newState.sortBy); else next.delete('sortBy');

    next.delete('page');
    router.replace(`/search?${next.toString()}`, { scroll: false });
  };

  const togglePopover = (name: typeof openPopover) => {
    setOpenPopover(openPopover === name ? null : name);
  };

  const cities = ['Any City', 'Goa', 'Jaipur', 'Mumbai', 'Manali', 'Udaipur', 'Kerala', 'Delhi'];
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'Villas', label: 'Villas' },
    { id: 'Trending', label: 'Trending' },
    { id: 'Farm', label: 'Farm' },
    { id: 'Apartment', label: 'Apartment' },
    { id: 'Haveli', label: 'Haveli' },
    { id: 'Cottages', label: 'Cottages' },
    { id: 'Chalets', label: 'Chalets' },
    { id: 'Luxe', label: 'Luxe' },
  ];
  const propertyTypes = ['Any Type', 'Apartment', 'House', 'Villa', 'Farm', 'Haveli'];

  const countAmenities = selectedAmenities.length;
  const countBookingOptions = bookingOptions.length;
  const hasPriceFilter = priceRange[0] > 0 || priceRange[1] < 50000;
  const hasRoomFilter = Boolean(bedrooms || bathrooms);

  const activeFilterCount = [
    hasPriceFilter,
    hasRoomFilter,
    countAmenities > 0,
    countBookingOptions > 0,
    Boolean(location && location !== 'all'),
    category !== 'all',
    propertyType !== 'all',
    sort !== 'recommended' && Boolean(sort),
  ].filter(Boolean).length;

  const handleClearAll = () => {
    setLocation('');
    setCategory('all');
    setPropertyType('all');
    setPriceRange([0, 50000]);
    setBedrooms('');
    setBathrooms('');
    setSelectedAmenities([]);
    setBookingOptions([]);
    setSort('recommended');
    if (onReset) onReset();
    router.replace('/search', { scroll: false });
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-white border-b border-gray-200/80 shadow-2xs sticky top-14 sm:top-16 z-40 py-2.5 sm:py-3 px-3 sm:px-6 md:px-8 xl:px-20"
    >
      <div className="max-w-[1760px] mx-auto">
        <div className="flex items-center md:justify-center gap-2 overflow-x-auto w-full scrollbar-none pb-0.5 snap-x snap-mandatory">
          
          {/* 1. CITY DROPDOWN */}
          <div className="min-w-[120px] sm:min-w-[140px] shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('city')}
              className={`w-full h-9 sm:h-10 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors bg-white cursor-pointer ${
                location && location !== 'all'
                  ? 'border-gray-900 bg-gray-50 text-gray-900 font-semibold'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
            >
              <span className="flex items-center truncate">
                <MapPin className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                <span className="truncate">{location || 'Any City'}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </button>

            {openPopover === 'city' && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {cities.map((c) => {
                  const isSelected = (c === 'Any City' && (!location || location === 'all')) || location === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const nextLoc = c === 'Any City' ? '' : c;
                        setLocation(nextLoc);
                        triggerChange({ city: nextLoc || undefined });
                        setOpenPopover(null);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                        isSelected ? 'text-[#0e4962] font-bold bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      <span>{c}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0e4962]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. PRICE POPOVER */}
          <div className="shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('price')}
              className={`h-9 sm:h-10 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-normal flex items-center transition-colors bg-white cursor-pointer ${
                hasPriceFilter
                  ? 'border-gray-900 bg-gray-50 font-semibold text-gray-900'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
            >
              <span>Price</span>
              {hasPriceFilter && <span className="ml-1.5 w-1.5 h-1.5 bg-[#0e4962] rounded-full" />}
            </button>

            {openPopover === 'price' && (
              <div className="absolute left-0 mt-2 w-[min(calc(100vw-2rem),22rem)] p-4 sm:p-5 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                <div>
                  <h4 className="font-bold text-base text-gray-900">Price Range</h4>
                  <p className="text-gray-500 text-xs mt-0.5">Nightly prices including fees and taxes</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                    <div className="text-overline font-semibold text-gray-400 uppercase">Minimum</div>
                    <div className="flex items-center font-semibold text-body-sm text-gray-900">
                      <span className="mr-1 text-gray-500">₹</span>
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none font-semibold font-tabular text-body-sm text-gray-900"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      />
                    </div>
                  </div>
                  <span className="text-gray-400 font-bold">-</span>
                  <div className="flex-1 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                    <div className="text-overline font-semibold text-gray-400 uppercase">Maximum</div>
                    <div className="flex items-center font-semibold text-body-sm text-gray-900">
                      <span className="mr-1 text-gray-500">₹</span>
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none font-semibold font-tabular text-body-sm text-gray-900"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceRange([0, 50000]);
                      triggerChange({ minPrice: undefined, maxPrice: undefined });
                      setOpenPopover(null);
                    }}
                    className="text-xs text-gray-500 font-semibold underline hover:text-gray-900 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerChange({
                        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                        maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
                      });
                      setOpenPopover(null);
                    }}
                    className="px-5 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0a374a] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. CATEGORY DROPDOWN */}
          <div className="min-w-[130px] sm:min-w-[150px] shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('category')}
              className={`w-full h-9 sm:h-10 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors bg-white cursor-pointer ${
                category && category !== 'all'
                  ? 'border-gray-900 bg-gray-50 text-gray-900 font-semibold'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
            >
              <span className="flex items-center truncate">
                <Home className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                <span className="truncate">
                  {categories.find((c) => c.id === category)?.label || 'All Categories'}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </button>

            {openPopover === 'category' && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {categories.map((c) => {
                  const isSelected = (c.id === 'all' && (!category || category === 'all')) || category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const nextCat = c.id === 'all' ? 'all' : c.id;
                        setCategory(nextCat);
                        triggerChange({ category: nextCat === 'all' ? undefined : nextCat });
                        setOpenPopover(null);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                        isSelected ? 'text-[#0e4962] font-bold bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      <span>{c.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0e4962]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. ROOMS & BEDS POPOVER */}
          <div className="shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('rooms')}
              className={`h-9 sm:h-10 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-normal flex items-center transition-colors bg-white cursor-pointer ${
                hasRoomFilter
                  ? 'border-gray-900 bg-gray-50 font-semibold text-gray-900'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
            >
              <span>Rooms</span>
              {hasRoomFilter && <span className="ml-1.5 w-1.5 h-1.5 bg-[#0e4962] rounded-full" />}
            </button>

            {openPopover === 'rooms' && (
              <div className="absolute left-0 mt-2 w-[min(calc(100vw-2rem),18rem)] p-4 sm:p-5 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                <h4 className="font-bold text-base text-gray-900">Rooms & Beds</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Any"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-24 h-8 px-2.5 rounded-lg border border-gray-200 text-xs font-bold outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Any"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-24 h-8 px-2.5 rounded-lg border border-gray-200 text-xs font-bold outline-none focus:border-gray-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      triggerChange({
                        bedrooms: bedrooms ? Number(bedrooms) : undefined,
                        bathrooms: bathrooms ? Number(bathrooms) : undefined,
                      });
                      setOpenPopover(null);
                    }}
                    className="px-5 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0a374a] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. AMENITIES POPOVER */}
          <div className="shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('amenities')}
              className={`h-9 sm:h-10 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-normal flex items-center transition-colors bg-white cursor-pointer ${
                countAmenities > 0
                  ? 'border-gray-900 bg-gray-50 font-semibold text-gray-900'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
            >
              <span>Amenities</span>
              {countAmenities > 0 && (
                <span className="ml-1.5 text-overline bg-[#0e4962] text-white px-1.5 rounded-full h-4 min-w-4 flex items-center justify-center font-semibold font-tabular">
                  {countAmenities}
                </span>
              )}
            </button>

            {openPopover === 'amenities' && (
              <div className="absolute left-0 mt-2 w-[min(calc(100vw-2rem),26rem)] p-4 sm:p-5 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                <h4 className="font-bold text-base text-gray-900">Popular Amenities</h4>
                <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {POPULAR_AMENITIES.map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity.id);
                    const IconComp = amenity.icon;
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedAmenities(selectedAmenities.filter((i) => i !== amenity.id));
                          } else {
                            setSelectedAmenities([...selectedAmenities, amenity.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                          isChecked
                            ? 'border-[#0e4962] bg-blue-50/60 text-[#0e4962] font-bold'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <IconComp className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="truncate">{amenity.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAmenities([]);
                      triggerChange({ amenities: undefined });
                      setOpenPopover(null);
                    }}
                    className="text-xs text-gray-500 font-semibold underline hover:text-gray-900 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerChange({
                        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
                      });
                      setOpenPopover(null);
                    }}
                    className="px-5 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0a374a] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. PROPERTY TYPE DROPDOWN */}
          <div className="min-w-[140px] sm:min-w-[170px] shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('type')}
              className={`w-full h-9 sm:h-10 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors bg-white cursor-pointer ${
                propertyType && propertyType !== 'all'
                  ? 'border-gray-900 bg-gray-50 text-gray-900 font-semibold'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
            >
              <span className="flex items-center truncate">
                <Home className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                <span className="truncate">{propertyType || 'Property Type'}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </button>

            {openPopover === 'type' && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {propertyTypes.map((t) => {
                  const isSelected = (t === 'Any Type' && (!propertyType || propertyType === 'all')) || propertyType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const nextType = t === 'Any Type' ? 'all' : t;
                        setPropertyType(nextType);
                        triggerChange({ propertyType: nextType === 'all' ? undefined : nextType });
                        setOpenPopover(null);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                        isSelected ? 'text-[#0e4962] font-bold bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      <span>{t}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0e4962]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. BOOKING OPTIONS POPOVER */}
          <div className="shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('booking')}
              className={`h-9 sm:h-10 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-normal flex items-center transition-colors bg-white cursor-pointer ${
                countBookingOptions > 0
                  ? 'border-gray-900 bg-gray-50 font-semibold text-gray-900'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-gray-600" />
              <span>Book options</span>
              {countBookingOptions > 0 && (
                <span className="ml-1.5 text-overline bg-[#0e4962] text-white px-1.5 rounded-full h-4 min-w-4 flex items-center justify-center font-semibold font-tabular">
                  {countBookingOptions}
                </span>
              )}
            </button>

            {openPopover === 'booking' && (
              <div className="absolute left-0 mt-2 w-[min(calc(100vw-2rem),18rem)] p-4 sm:p-5 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                <h4 className="font-bold text-base text-gray-900">Booking Options</h4>
                <div className="flex flex-col gap-2.5">
                  {BOOKING_OPTIONS.map((opt) => {
                    const isChecked = bookingOptions.includes(opt.id);
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setBookingOptions(bookingOptions.filter((i) => i !== opt.id));
                          } else {
                            setBookingOptions([...bookingOptions, opt.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                          isChecked
                            ? 'border-[#0e4962] bg-blue-50/60 text-[#0e4962]'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <IconComp className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingOptions([]);
                      triggerChange({ instantBook: false });
                      setOpenPopover(null);
                    }}
                    className="text-xs text-gray-500 font-semibold underline hover:text-gray-900 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerChange({
                        instantBook: bookingOptions.includes('instant_book'),
                      });
                      setOpenPopover(null);
                    }}
                    className="px-5 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0a374a] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 8. SORT DROPDOWN */}
          <div className="min-w-[130px] sm:min-w-[160px] shrink-0 snap-start relative">
            <button
              type="button"
              onClick={() => togglePopover('sort')}
              className="w-full h-9 sm:h-10 rounded-full border border-gray-200 hover:border-gray-400 px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors bg-white text-gray-700 cursor-pointer"
            >
              <span className="flex items-center truncate">
                <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-gray-500 shrink-0" />
                <span className="truncate">
                  {sort === 'price_asc'
                    ? 'Price: low to high'
                    : sort === 'price_desc'
                    ? 'Price: high to low'
                    : sort === 'rating_desc'
                    ? 'Rating: high to low'
                    : 'Recommended'}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </button>

            {openPopover === 'sort' && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { id: 'recommended', label: 'Recommended' },
                  { id: 'price_asc', label: 'Price: low to high' },
                  { id: 'price_desc', label: 'Price: high to low' },
                  { id: 'rating_desc', label: 'Rating: high to low' },
                ].map((s) => {
                  const isSelected = (s.id === 'recommended' && (!sort || sort === 'recommended')) || sort === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSort(s.id);
                        triggerChange({ sortBy: s.id === 'recommended' ? undefined : s.id });
                        setOpenPopover(null);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                        isSelected ? 'text-[#0e4962] font-bold bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      <span>{s.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0e4962]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CLEAR ALL BUTTON */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="h-9 sm:h-10 rounded-full text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 shrink-0 snap-start px-3 flex items-center gap-1 hover:bg-rose-50 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
