'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { CategoryBar } from '@/components/catalog/CategoryBar';
import { FilterModal, FilterCriteria } from '@/components/catalog/FilterModal';
import { PropertyCard, PropertyCardData } from '@/components/catalog/PropertyCard';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import { SmartSearchBar } from '@/features/ai/components/SmartSearchBar';
import { StayComparisonModal } from '@/features/ai/components/StayComparisonModal';
import { useAiCapabilities } from '@/features/ai/use-ai-capabilities';
import {
  Loader2,
  Sparkles,
  Scale,
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Users,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CalendarCheck,
  Headphones,
  Heart,
} from 'lucide-react';

export interface SliderCardItem {
  id: string;
  slug?: string;
  title: string;
  location?: string;
  city?: string;
  propertyType?: string;
  rating?: number;
  reviewCount?: number;
  price: number;
  priceUnit?: string;
  isGuestFavourite?: boolean;
  image?: string;
  images?: string[];
}

// ITEMS DATA FOR SECTION 1 (FOR YOU, HOME, BUSINESS, OTHERS)
const FOR_YOU_ITEMS: SliderCardItem[] = [
  {
    id: 'fy-1',
    title: 'Sunset Villa',
    location: 'Goa, India',
    rating: 4.8,
    reviewCount: 124,
    price: 3500,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'],
    slug: 'sunset-villa-goa',
  },
  {
    id: 'fy-2',
    title: 'Forest Cabin',
    location: 'Rishikesh, Uttarakhand',
    rating: 4.7,
    reviewCount: 98,
    price: 2900,
    priceUnit: '/ night',
    isGuestFavourite: false,
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
    slug: 'forest-cabin-rishikesh',
  },
  {
    id: 'fy-3',
    title: 'Modern Apartment',
    location: 'Bengaluru, Karnataka',
    rating: 4.6,
    reviewCount: 76,
    price: 4200,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    slug: 'modern-apartment-bengaluru',
  },
  {
    id: 'fy-4',
    title: 'Beach House',
    location: 'Alleppey, Kerala',
    rating: 4.9,
    reviewCount: 210,
    price: 5800,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80'],
    slug: 'beach-house-alleppey',
  },
  {
    id: 'fy-5',
    title: 'Mountain Chalet',
    location: 'Manali, Himachal Pradesh',
    rating: 4.92,
    reviewCount: 140,
    price: 6500,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'],
    slug: 'mountain-chalet-manali',
  },
];

const HOME_ITEMS: SliderCardItem[] = [
  {
    id: 'hm-1',
    title: 'Cottage in Manali',
    location: 'Manali, Himachal Pradesh',
    rating: 4.9,
    reviewCount: 112,
    price: 18366,
    priceUnit: 'for 2 nights',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'hm-2',
    title: 'Home in Sector 29',
    location: 'Gurgaon, Haryana',
    rating: 5.0,
    reviewCount: 84,
    price: 11900,
    priceUnit: 'for 2 nights',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'hm-3',
    title: 'Penthouse in Golf Course Road',
    location: 'Gurgaon, Haryana',
    rating: 4.96,
    reviewCount: 65,
    price: 18500,
    priceUnit: 'for 2 nights',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'hm-4',
    title: 'Heritage Villa',
    location: 'Jaipur, Rajasthan',
    rating: 4.94,
    reviewCount: 130,
    price: 15000,
    priceUnit: 'for 2 nights',
    isGuestFavourite: false,
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'],
  },
];

const BUSINESS_ITEMS: SliderCardItem[] = [
  {
    id: 'biz-1',
    title: 'Executive Suite',
    location: 'Bandra Kurla Complex, Mumbai',
    rating: 4.85,
    reviewCount: 92,
    price: 8500,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'biz-2',
    title: 'Cyber City Studio',
    location: 'DLF Phase 2, Gurgaon',
    rating: 4.78,
    reviewCount: 64,
    price: 5200,
    priceUnit: '/ night',
    isGuestFavourite: false,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'biz-3',
    title: 'Tech Park Loft',
    location: 'Whitefield, Bengaluru',
    rating: 4.91,
    reviewCount: 105,
    price: 6800,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'],
  },
];

const OTHERS_ITEMS: SliderCardItem[] = [
  {
    id: 'oth-1',
    title: 'Desert Luxury Camp',
    location: 'Jaisalmer, Rajasthan',
    rating: 4.95,
    reviewCount: 150,
    price: 9500,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'oth-2',
    title: 'Rainforest Treehouse',
    location: 'Wayanad, Kerala',
    rating: 4.88,
    reviewCount: 88,
    price: 7200,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'oth-3',
    title: 'Heritage Houseboat',
    location: 'Dal Lake, Srinagar',
    rating: 4.92,
    reviewCount: 142,
    price: 11000,
    priceUnit: '/ night',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'],
  },
];

// ITEMS DATA FOR SECTION 2 (EXPERIENCE)
const EXPERIENCE_ITEMS: SliderCardItem[] = [
  {
    id: 'exp-1',
    title: 'Authentic Cooking Class',
    location: 'Jaipur, Rajasthan',
    rating: 4.8,
    reviewCount: 54,
    price: 1200,
    priceUnit: '/ person',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'exp-2',
    title: 'Heritage City Walking Tour',
    location: 'Udaipur, Rajasthan',
    rating: 4.7,
    reviewCount: 89,
    price: 999,
    priceUnit: '/ person',
    isGuestFavourite: false,
    images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'exp-3',
    title: 'Himalayan Trekking Adventure',
    location: 'Manali, Himachal Pradesh',
    rating: 4.9,
    reviewCount: 112,
    price: 1500,
    priceUnit: '/ person',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'exp-4',
    title: 'Ganges Sunset Photography Tour',
    location: 'Rishikesh, Uttarakhand',
    rating: 4.6,
    reviewCount: 67,
    price: 1800,
    priceUnit: '/ person',
    isGuestFavourite: false,
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'exp-5',
    title: 'Scuba Diving & Coral Safari',
    location: 'Grand Island, Goa',
    rating: 4.95,
    reviewCount: 180,
    price: 3200,
    priceUnit: '/ person',
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'],
  },
];

// ITEMS DATA FOR SECTION 3 (FEATURED DESTINATION)
const FEATURED_DESTINATION_ITEMS: SliderCardItem[] = [
  {
    id: 'dest-1',
    title: 'Manali Stays',
    location: 'Himachal Pradesh',
    price: 2500,
    priceUnit: '/ night starting',
    rating: 4.9,
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'dest-2',
    title: 'Goa Beaches & Villas',
    location: 'Goa',
    price: 3800,
    priceUnit: '/ night starting',
    rating: 4.88,
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'dest-3',
    title: 'Jaipur Forts & Haveli',
    location: 'Rajasthan',
    price: 2200,
    priceUnit: '/ night starting',
    rating: 4.85,
    isGuestFavourite: false,
    images: ['https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'dest-4',
    title: 'Udaipur Lakes & Palaces',
    location: 'Rajasthan',
    price: 3500,
    priceUnit: '/ night starting',
    rating: 4.92,
    isGuestFavourite: true,
    images: ['https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'dest-5',
    title: 'Rishikesh Yoga & River Stays',
    location: 'Uttarakhand',
    price: 2800,
    priceUnit: '/ night starting',
    rating: 4.82,
    isGuestFavourite: false,
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
  },
];

// SLIDER CARD COMPONENT MATCHING AIRBNB DESIGN
export function AirbnbSliderCard({ item }: { item: SliderCardItem }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images =
    item.images && item.images.length > 0
      ? item.images
      : item.image
        ? [item.image]
        : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'];

  const displayTitle = item.title;
  const locationText = item.location || (item.city ? `${item.propertyType || 'Stay'} in ${item.city}` : '');
  const formattedPrice = `₹${item.price.toLocaleString('en-IN')}`;
  const priceUnitText = item.priceUnit || 'for 2 nights';
  const ratingText = item.rating ? ` · ★ ${item.rating}` : '';

  return (
    <Link
      href={`/properties/${item.slug || item.id}`}
      className="group block min-w-[210px] w-[65vw] sm:w-[260px] md:w-[280px] lg:w-[300px] shrink-0 snap-start select-none cursor-pointer"
    >
      {/* 1. IMAGE CONTAINER */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={images[currentImageIndex]}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* GUEST FAVOURITE BADGE */}
        {item.isGuestFavourite && (
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs text-gray-900 font-semibold text-overline px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span>Guest favourite</span>
          </div>
        )}

        {/* WISHLIST HEART BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition hover:scale-110 active:scale-95 cursor-pointer"
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-[#0e4962] text-[#0e4962]' : 'text-gray-700 stroke-[2]'
              }`}
          />
        </button>

        {/* CAROUSEL ARROWS FOR MULTIPLE IMAGES */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* 2. CARD TEXT DETAILS */}
      <div className="mt-2.5 space-y-0.5 px-0.5">
        <h3 className="font-semibold text-gray-900 text-body line-clamp-1 leading-snug group-hover:text-[#0e4962] transition-colors">
          {displayTitle}
        </h3>

        {locationText && (
          <p className="text-caption text-gray-500 font-medium line-clamp-1">
            {locationText}
          </p>
        )}

        <p className="text-caption text-gray-600 font-medium line-clamp-1">
          <span className="font-bold font-tabular text-gray-900">{formattedPrice}</span>{' '}
          <span className="text-gray-500">{priceUnitText}</span>
          {ratingText}
        </p>
      </div>
    </Link>
  );
}

// SLIDER SECTION CONTAINER WITH HEADER & RIGHT ARROW BUTTON
export function AirbnbSliderSection({
  title,
  subtitle,
  items,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  items: SliderCardItem[];
  onViewAll?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
  }, [items]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-3 py-2 max-sm:mb-1">
      {/* HEADER ROW WITH TITLE AND CIRCULAR RIGHT ARROW BUTTON */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-body-sm text-gray-500 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canScrollLeft && (
            <button
              type="button"
              onClick={handleScrollLeft}
              className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xs transition active:scale-95 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          )}

          <button
            type="button"
            onClick={onViewAll ? onViewAll : handleScrollRight}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xs transition active:scale-95 cursor-pointer"
            aria-label="Next or view all"
          >
            <ArrowRight className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL SLIDER ROW - PERFECTLY ALIGNED WITH SECTION HEADER */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-3 pt-1"
      >
        {items.map((item) => (
          <AirbnbSliderCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function AirbnbMarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TOP PILL SELECTION STATE ("for-you" | "home" | "business" | "others")
  const [activeTab, setActiveTab] = useState<'for-you' | 'home' | 'business' | 'others'>('for-you');

  // Search & Filter States
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [guests, setGuests] = useState<number>(
    searchParams.get('guests') ? Number(searchParams.get('guests')) : 1,
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all',
  );
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // AI features state
  const { isAiEnabled, isFeatureEnabled } = useAiCapabilities();
  const showSmartSearch = Boolean(isAiEnabled && isFeatureEnabled('smartSearch'));
  const [aiSearchResults, setAiSearchResults] = useState<any>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const handleToggleCompare = (propertyId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 stays at a time.');
        return prev;
      }
      return [...prev, propertyId];
    });
  };
  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    propertyType: searchParams.get('propertyType') || undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    instantBook: searchParams.get('instantBook') === 'true' ? true : undefined,
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')?.split(',') : undefined,
  });

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

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get<PropertyCardData[]>(`/properties${queryStr}`);
      setProperties(data);
    } catch (err: any) {
      console.error('Failed to load listings:', err);
      setError(err?.message || 'Failed to load listings. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [city, guests, selectedCategory, filters]);

  // Refined filtering
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (filters.bedrooms && (prop.bedrooms || 0) < filters.bedrooms) return false;
      if (filters.bathrooms && (prop.bathrooms || 0) < filters.bathrooms) return false;
      if (filters.amenities && filters.amenities.length > 0) {
        const extras = prop.listingExtras || {};
        const matchesAll = filters.amenities.every((amenityKey) => Boolean(extras[amenityKey]));
        if (!matchesAll) return false;
      }
      return true;
    });
  }, [properties, filters]);

  // Dynamic tab header text & items for Section 1
  const section1Title =
    activeTab === 'for-you'
      ? 'For you'
      : activeTab === 'home'
        ? 'Home'
        : activeTab === 'business'
          ? 'Business'
          : 'Others';

  const section1Subtitle =
    activeTab === 'for-you'
      ? 'Handpicked stays just for you'
      : activeTab === 'home'
        ? 'Cozy homes and stays for your getaway'
        : activeTab === 'business'
          ? 'Top-rated stays equipped for business travelers'
          : 'Unique and extraordinary stays across India';

  const section1Items =
    activeTab === 'for-you'
      ? FOR_YOU_ITEMS
      : activeTab === 'home'
        ? HOME_ITEMS
        : activeTab === 'business'
          ? BUSINESS_ITEMS
          : OTHERS_ITEMS;

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

  const handleRemoveCity = () => setCity('');
  const handleRemoveCategory = () => setSelectedCategory('all');
  const handleRemoveGuests = () => setGuests(1);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* 1. AIRBNB HEADER */}
      <AirbnbHeader
        onSearch={handleHeaderSearch}
        currentCity={city}
        currentGuests={guests}
      />

      {/* 2. TEXT HERO SECTION (No photos, clean brand text) */}
      <div className="max-w-[1760px] mx-auto w-full py-8 px-4 sm:px-8 lg:px-12 ">
        <h1 className="text-display font-bold tracking-tight text-[#0e4962] leading-[1.1]">
          Find your next<br />
          <span className="text-gray-400 font-semibold">stay, your way</span>
        </h1>
        <p className="mt-2 text-body-lg text-gray-400 font-medium tracking-wide">
          Handpicked stays for every kind of traveller.
        </p>
      </div>

      {/* AI SMART CONCIERGE BANNER */}
      {showSmartSearch && (
        <section aria-label="AI Concierge Search" className="border-y border-[#d4e4ec] bg-gradient-to-r from-[#edf4f7] via-white to-[#edf4f7] py-6 px-4 sm:px-8 lg:px-12">
          <div className="max-w-[1760px] mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#0e4962] text-white shadow-md shadow-[#0e4962]/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-h3 font-bold text-[#0e4962] tracking-tight">
                      FairBnB AI Concierge
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-white text-[#0e4962] border border-[#adcada] shadow-xs">
                      AI Natural Language Search
                    </span>
                  </div>
                  <p className="text-caption text-gray-600 mt-0.5">
                    Describe your ideal stay in natural English or Hinglish. We automatically extract your budget, amenities, and guest requirements, verified against real listing data.
                  </p>
                </div>
              </div>
            </div>

            {/* SMART SEARCH COMPONENT */}
            <SmartSearchBar
              onResults={(results) => {
                setAiSearchResults(results);
              }}
            />

            {/* QUICK PROMPTS CHIPS */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-caption font-bold text-gray-500 mr-1">Quick Ideas:</span>
              {[
                '2-bedroom pool villa in Goa under 15000',
                'Mountain view cottage in Manali with high-speed wifi',
                'Luxury penthouse in Mumbai under 30000',
                'Royal heritage haveli in Jaipur for family',
                'Lake view chalet in Udaipur under 13000',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('set-smart-search-prompt', { detail: prompt }));
                    setTimeout(() => {
                      const form = document.querySelector('#smart-search-input')?.closest('form');
                      if (form) form.requestSubmit();
                    }, 50);
                  }}
                  className="text-caption px-3 py-1.5 bg-white hover:bg-[#edf4f7] hover:border-[#adcada] border border-gray-200 text-gray-700 rounded-full transition shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#0e4962]" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* 3. CATEGORY BAR WITH FILTERS BUTTON */}
      {/* <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onOpenFilters={() => setFilterModalOpen(true)}
        activeFilterCount={activeFilterCount}
      /> */}

      {/* 4. MAIN MARKETPLACE CONTENT */}
      <main className="flex-1 max-w-[1760px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-3 sm:py-6 space-y-6 sm:space-y-10">

        {/* ACTIVE AI SEARCH FILTER NOTIFICATION & RESULTS */}
        {showSmartSearch && aiSearchResults && (
          <div className="p-5 bg-[#edf4f7] border border-[#adcada] rounded-3xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0e4962]" />
                  <span className="font-bold text-body text-[#0e4962]">
                    Showing {aiSearchResults.candidates?.length || 0} AI Ranked Ground-Truth Matches
                  </span>
                  {aiSearchResults.appliedPreferences?.destination && (
                    <span className="text-caption px-2.5 py-0.5 rounded-full bg-white border border-[#adcada] text-[#0e4962] font-semibold">
                      📍 {aiSearchResults.appliedPreferences.destination}
                    </span>
                  )}
                  {aiSearchResults.appliedPreferences?.budget?.amount && (
                    <span className="text-caption px-2.5 py-0.5 rounded-full bg-white border border-[#adcada] text-[#0e4962] font-semibold">
                      💰 Max ₹{aiSearchResults.appliedPreferences.budget.amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-caption text-[#093447]/80">
                  Sorted by deterministic criteria matching (location, price ceiling, verified amenities).
                </p>
              </div>
              <button
                onClick={() => setAiSearchResults(null)}
                className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-gray-100 text-[#0e4962] border border-[#adcada] text-caption font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset to Standard Catalog</span>
              </button>
            </div>

            {aiSearchResults.candidates?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-5 lg:gap-6 pt-2">
                {aiSearchResults.candidates.map((c: any) => {
                  const prop = properties.find((p) => p.id === c.property.id) || (c.property as PropertyCardData);
                  return (
                    <div key={c.property.id} className="flex flex-col space-y-2">
                      <PropertyCard
                        property={prop}
                        openInNewTab={true}
                        isSelectedForCompare={selectedForCompare.includes(c.property.id)}
                        onToggleCompare={() => handleToggleCompare(c.property.id)}
                      />
                      {c.matchReasons?.length > 0 && (
                        <div className="p-2 bg-white rounded-xl border border-[#adcada] text-[11px] text-emerald-800 flex items-start gap-1.5 shadow-2xs">
                          <span className="text-emerald-600 font-bold shrink-0">✓</span>
                          <span className="line-clamp-2">{c.matchReasons.join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-caption text-gray-500 bg-white rounded-2xl border border-dashed border-[#adcada]">
                No listings matched the specific constraints. Try loosening the price budget or destination filter.
              </div>
            )}
          </div>
        )}

        {/* TOP TAB PILLS BAR (For you | Home | Business | Others) */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pt-1 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('for-you')}
            className={`px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${activeTab === 'for-you'
              ? 'bg-[#0e4962] text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold'
              }`}
          >
            For you
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`px-6 py-2.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${activeTab === 'home'
              ? 'bg-[#0e4962] text-white font-bold shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold'
              }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-6 py-2.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${activeTab === 'business'
              ? 'bg-[#0e4962] text-white font-bold shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold'
              }`}
          >
            Business
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('others')}
            className={`px-6 py-2.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${activeTab === 'others'
              ? 'bg-[#0e4962] text-white font-bold shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold'
              }`}
          >
            Others
          </button>
        </div>

        {/* SECTION 1: DYNAMIC HEADER (For you / Home / Business / Others) SLIDER */}
        <AirbnbSliderSection
          title={section1Title}
          subtitle={section1Subtitle}
          items={section1Items}
          onViewAll={() => router.push('/search')}
        />

        {/* SECTION 2: EXPERIENCE SLIDER */}
        <AirbnbSliderSection
          title="Experience"
          subtitle="More than just a stay — create memories with unique experiences."
          items={EXPERIENCE_ITEMS}
          onViewAll={() => router.push('/search')}
        />

        {/* SECTION 3: FEATURED DESTINATION SLIDER */}
        <AirbnbSliderSection
          title="Featured Destination"
          subtitle="Handpicked stays in the most loved destinations."
          items={FEATURED_DESTINATION_ITEMS}
          onViewAll={() => router.push('/search')}
        />

        {/* SECTION: BRAND BANNER (EXACT USER DESIGN) */}
        <section className="relative w-full flex justify-center overflow-visible">
          <div className="w-full max-w-[1400px]">
            <img
              src="/images/fairbnb-brand-banner-2x.png"
              alt="FairBnB - Discover unique stays, incredible experiences, and trusted hosts around the world"
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
              loading="eager"
            />
          </div>
        </section>

        {/* ACTIVE FILTER BADGES BAR */}
        {(city || selectedCategory !== 'all' || guests > 1 || activeFilterCount > 0) && (
          <div className="mb-6 flex flex-wrap items-center gap-2 pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {city && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
                <MapPin className="w-3 h-3 text-[#0e4962]" />
                <span>{city}</span>
                <button onClick={handleRemoveCity} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
                <span>Category: {selectedCategory}</span>
                <button onClick={handleRemoveCategory} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {guests > 1 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
                <Users className="w-3 h-3 text-gray-600" />
                <span>{guests} guests</span>
                <button onClick={handleRemoveGuests} className="hover:text-black">
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

        {/* ALL STAYS MARKETPLACE SECTION GRID */}
        {/* <section className="pt-4">
          <h2 className="text-h2 font-bold text-gray-900 tracking-tight mb-4">
            All Properties & Stays
          </h2>

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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-[#0e4962] mb-3" />
              <p className="text-sm font-semibold text-gray-600">Finding extraordinary stays for you...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 shadow-xs">
                <Search className="w-7 h-7 text-[#0e4962]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">No exact matches found</h2>
              <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                Try adjusting your search criteria, clearing your selected filters, or searching for a different destination.
              </p>
              <button
                onClick={handleClearAll}
                className="px-6 py-3 bg-[#0e4962] hover:bg-[#0a374a] text-white text-sm font-bold rounded-2xl shadow transition cursor-pointer"
              >
                Show all available stays
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between text-xs font-semibold text-gray-500">
                <p>Over {filteredProperties.length} {filteredProperties.length === 1 ? 'stay' : 'stays'} available</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-5 lg:gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    openInNewTab={true}
                    isSelectedForCompare={selectedForCompare.includes(property.id)}
                    onToggleCompare={() => handleToggleCompare(property.id)}
                  />
                ))}
              </div>
            </>
          )}
        </section> */}
      </main>

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        initialFilters={filters}
      />

      {/* FLOATING COMPARISON DOCK BAR */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0e4962] text-white backdrop-blur-md px-5 py-3.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white text-[#0e4962] flex items-center justify-center text-caption font-bold">
              {selectedForCompare.length}
            </div>
            <span className="text-caption font-medium text-white/90">
              {selectedForCompare.length === 1
                ? '1 stay selected (select at least 2 to compare)'
                : `${selectedForCompare.length} stays selected for side-by-side comparison`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedForCompare.length < 2}
              onClick={() => setCompareModalOpen(true)}
              className="px-4 py-2 rounded-full bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-[#0e4962] text-caption font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Stays</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="p-1.5 text-white/70 hover:text-white rounded-full transition cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE STAY COMPARISON MODAL */}
      <StayComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        propertyIds={selectedForCompare}
      />

      {/* 5. AIRBNB FOOTER */}
      <AirbnbFooter />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading Stays...</div>}>
      <AirbnbMarketplaceContent />
    </Suspense>
  );
}
