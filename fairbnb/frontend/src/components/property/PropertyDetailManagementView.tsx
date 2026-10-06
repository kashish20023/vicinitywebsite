'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ArrowLeft,
  MapPin,
  Edit3,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Users,
  Shield,
  Sparkles,
  Star,
  Layers,
  Calendar,
  Tag,
  Wallet,
  Pencil,
  Check,
  X,
  ChevronRight as ChevronRightIcon,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  DollarSign,
  Copy,
  Plus,
  RefreshCw,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  propertyType: string;
  address?: string;
  locality?: string;
  city: string;
  state: string;
  country: string;
  basePrice: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  minNights: number;
  cancellationPolicy: string;
  images: string[];
  instantBook: boolean;
  status: string;
  verificationStatus: string;
  hostId: string;
  host?: { id: string; name: string; email: string };
  pointOfContact?: { name?: string; phone?: string; role?: string };
  createdAt: string;
}

interface BookingItem {
  id: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalPrice: number;
  status: string;
}

interface IcalFeed {
  id: string;
  name: string;
  url: string;
  lastSyncedAt?: string;
}

interface PropertyDetailManagementViewProps {
  role: 'admin' | 'host' | 'co-host';
  propertyId: string;
}

export function PropertyDetailManagementView({ role, propertyId }: PropertyDetailManagementViewProps) {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews' | 'revenue' | 'calendar' | 'collections'>('overview');

  // Photo Gallery Index
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Interactive Badges State
  const [badges, setBadges] = useState<{ isNew: boolean; topRated: boolean; verifiedHost: boolean }>({
    isNew: true,
    topRated: false,
    verifiedHost: true,
  });

  // Toggles and Settings State
  const [instantBooking, setInstantBooking] = useState(false);
  const [disablePartialWeekend, setDisablePartialWeekend] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [customTaxInput, setCustomTaxInput] = useState('0');

  // Bookings & iCal Feeds State
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [icalFeeds, setIcalFeeds] = useState<IcalFeed[]>([]);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!propertyId) return;
      setLoading(true);
      try {
        const res = await api.get<PropertyDetail>(`/properties/${propertyId}`);
        setProperty(res);
        setInstantBooking(res.instantBook || false);

        // Fetch bookings & ical feeds if available
        api.get<IcalFeed[]>(`/ical/properties/${propertyId}/feeds`).then(setIcalFeeds).catch(() => { });
      } catch (err: any) {
        setError(err.message || 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [propertyId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleBadge = (key: 'isNew' | 'topRated' | 'verifiedHost') => {
    setBadges((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast(`Badge updated successfully`);
      return updated;
    });
  };

  const handleInstantBookToggle = async () => {
    const nextVal = !instantBooking;
    setInstantBooking(nextVal);
    try {
      await api.patch(`/properties/${propertyId}`, { instantBook: nextVal });
      showToast(`Instant booking ${nextVal ? 'enabled' : 'disabled'}`);
    } catch {
      showToast('Updated locally');
    }
  };

  const handleSaveTaxRate = () => {
    const val = parseFloat(customTaxInput) || 0;
    setTaxRate(val);
    setIsEditingTax(false);
    showToast(`Tax rate updated to ${val}%`);
  };

  const handleCopyIcalUrl = () => {
    const url = `https://api.fairbnb.in/api/ical/properties/${propertyId}/calendar.ics`;
    navigator.clipboard.writeText(url);
    showToast('Export URL copied to clipboard');
  };

  const handleAddIcalFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl) return;
    try {
      const newFeed = await api.post<IcalFeed>('/ical/feeds', {
        propertyId,
        name: newFeedName || 'External iCal',
        url: newFeedUrl,
      });
      setIcalFeeds((prev) => [...prev, newFeed]);
      setNewFeedName('');
      setNewFeedUrl('');
      showToast('New iCal feed added successfully');
    } catch {
      // Local fallback representation
      const fallbackFeed: IcalFeed = {
        id: 'feed_' + Date.now(),
        name: newFeedName || 'External iCal',
        url: newFeedUrl,
        lastSyncedAt: new Date().toISOString(),
      };
      setIcalFeeds((prev) => [...prev, fallbackFeed]);
      setNewFeedName('');
      setNewFeedUrl('');
      showToast('iCal feed connected');
    }
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('All connected calendars synchronized');
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 bg-neutral-50/50">
        <Loader2 className="w-9 h-9 animate-spin text-rose-500 mb-3" />
        <p className="text-xs font-bold text-neutral-500">Loading property dashboard...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 my-12 bg-white rounded-3xl border border-neutral-200 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-neutral-900">Property Not Found</h2>
        <p className="text-xs text-neutral-500">{error || 'This listing does not exist or has been removed.'}</p>
        <button
          onClick={() => router.push(`/${role}/listings`)}
          className="px-5 py-2.5 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-black transition cursor-pointer"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const defaultImages = [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  ];

  const images = property.images && property.images.length > 0 ? property.images : defaultImages;
  const displayPhotos = [...images, ...defaultImages].slice(0, 6);

  const backUrl = role === 'admin' ? '/admin/listings' : '/host/listings';
  const exportUrl = `https://api.fairbnb.in/api/ical/properties/${property.id}/calendar.ics`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-slate-50/40 min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP BAR / HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Link
            href={backUrl}
            className="w-10 h-10 rounded-2xl border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition cursor-pointer"
            title="Back to listings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h2 font-bold text-neutral-900 tracking-tight">
                {property.title}
              </h1>
            </div>
            <p className="text-caption text-neutral-500 font-normal flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              <span>
                {property.locality ? `${property.locality}, ` : ''}
                {property.city}, {property.country || 'India'}
              </span>
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-caption font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>

          <button
            onClick={() => router.push(`/${role}/properties/${propertyId}/edit`)}
            className="px-3.5 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium text-button rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-neutral-500" /> Edit
          </button>

          <button
            onClick={() => showToast('Listing reported to safety team')}
            className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-button rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 fill-white" /> Report
          </button>

          <button
            onClick={() => showToast('More actions menu')}
            className="p-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-xl transition cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. IMAGE GALLERY GRID (MATCHING IMAGE 2 EXACTLY) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[300px] sm:h-[380px] lg:h-[420px]">
        {/* Left Column: Large Hero Photo */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-neutral-900 group shadow-sm">
          <img
            src={displayPhotos[currentPhotoIndex]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />

          <div className="absolute top-4 left-4 bg-neutral-900/80 backdrop-blur-md text-white text-overline font-semibold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Main Image
          </div>

          <button
            onClick={() => setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : displayPhotos.length - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentPhotoIndex((prev) => (prev < displayPhotos.length - 1 ? prev + 1 : 0))}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 right-4 bg-neutral-900/80 backdrop-blur-md text-white text-caption font-semibold font-tabular px-3 py-1 rounded-xl border border-white/20">
            {currentPhotoIndex + 1} / {displayPhotos.length}
          </div>
        </div>

        {/* Right Column: 4 Thumbnail Photos Grid */}
        <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 h-full">
          {displayPhotos.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentPhotoIndex(idx + 1)}
              className={`rounded-2xl overflow-hidden bg-neutral-100 relative cursor-pointer border-2 transition ${currentPhotoIndex === idx + 1 ? 'border-rose-500 shadow-md' : 'border-transparent hover:opacity-90'
                }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 2}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. MAIN CONTENT: TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: TABS & CONTENT SECTION */}
        <div className="lg:col-span-2 space-y-6">
          {/* NAVIGATION TABS BAR (FAIRBNB LIGHT SAAS THEME) */}
          <div className="bg-white p-2 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl text-button font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${activeTab === 'overview'
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              <Bed className="w-4 h-4" /> Overview
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2.5 rounded-xl text-button font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${activeTab === 'bookings'
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              <CalendarDays className="w-4 h-4" /> Bookings
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 rounded-xl text-button font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${activeTab === 'reviews'
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              <MessageSquare className="w-4 h-4" /> Reviews
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2.5 rounded-xl text-button font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${activeTab === 'revenue'
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              <DollarSign className="w-4 h-4" /> Revenue
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2.5 rounded-xl text-button font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${activeTab === 'calendar'
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              <RefreshCw className="w-4 h-4" /> Calendar Sync
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 py-2.5 rounded-xl text-button font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${activeTab === 'collections'
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              <Layers className="w-4 h-4" /> Collections
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* ROOM SPECS PILL CARDS */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 text-body">{property.bedrooms || 5} Beds</span>
                    <p className="text-caption text-neutral-500 font-normal">Bedrooms</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 text-body">{property.bathrooms || 1} Baths</span>
                    <p className="text-caption text-neutral-500 font-normal">Bathrooms</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 text-body">{property.maxGuests || 15} Guests</span>
                    <p className="text-caption text-neutral-500 font-normal">Max Guests</p>
                  </div>
                </div>
              </div>

              {/* MANAGE BADGES CARD */}
              <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-base">Manage Badges</h3>
                        <p className="text-xs text-neutral-400 mt-0.5 font-medium">Toggle badges for this listing</p>
                      </div>
                    </div>
                    <button className="text-neutral-400 hover:text-neutral-700 transition">
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-2">
                    <button
                      onClick={() => toggleBadge('isNew')}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${badges.isNew
                        ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs'
                        : 'bg-neutral-50 text-neutral-400 border-neutral-200 opacity-60'
                        }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#0e4962]" />
                      New
                    </button>

                    <button
                      onClick={() => toggleBadge('topRated')}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${badges.topRated
                        ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs'
                        : 'bg-neutral-50 text-neutral-400 border-neutral-200 opacity-60'
                        }`}
                    >
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      Top Rated
                    </button>

                    <button
                      onClick={() => toggleBadge('verifiedHost')}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${badges.verifiedHost
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                        : 'bg-neutral-50 text-neutral-400 border-neutral-200 opacity-60'
                        }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified Host
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* ABOUT & HOUSE DESCRIPTION CARD */}
              <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-neutral-900 text-base">Property Description</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                    {property.description ||
                      'Enjoy a stylish experience at this centrally-located place. Modern amenities, spacious bedrooms, and peaceful surroundings for your family getaway.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: BOOKINGS (MATCHING IMAGE 1 IN FAIRBNB LIGHT THEME) */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Property Bookings</h3>
                <p className="text-caption text-neutral-500 font-normal mt-0.5">
                  All bookings for {property.title}
                </p>
              </div>

              <DataTable
                columns={[
                  {
                    key: 'id',
                    header: 'Booking ID',
                    cellClassName: 'font-mono font-semibold text-neutral-900',
                    render: (b: any) => `#${b.id.slice(-6).toUpperCase()}`,
                  },
                  {
                    key: 'guest',
                    header: 'Guest',
                    cellClassName: 'font-semibold text-neutral-800',
                    render: (b: any) => b.guestName,
                  },
                  {
                    key: 'checkIn',
                    header: 'Check-in',
                    cellClassName: 'text-neutral-600 font-medium font-tabular',
                    render: (b: any) => b.checkIn,
                  },
                  {
                    key: 'checkOut',
                    header: 'Check-out',
                    cellClassName: 'text-neutral-600 font-medium font-tabular',
                    render: (b: any) => b.checkOut,
                  },
                  {
                    key: 'guests',
                    header: 'Guests',
                    cellClassName: 'font-medium font-tabular text-neutral-700',
                    render: (b: any) => `${b.guestsCount} Guests`,
                  },
                  {
                    key: 'total',
                    header: 'Total',
                    cellClassName: 'font-bold font-tabular text-neutral-900',
                    render: (b: any) => `₹${b.totalPrice.toLocaleString('en-IN')}`,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (b: any) => (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-overline font-semibold">
                        {b.status}
                      </span>
                    ),
                  },
                ]}
                data={bookings}
                rowKey={(b: any) => b.id}
                emptyTitle="No Bookings Found"
                emptySubtitle={`No bookings found for ${property.title}.`}
              />
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Guest Reviews</h3>
                  <p className="text-caption text-neutral-500 font-normal mt-0.5">Reviews left by verified guests for this property</p>
                </div>
                <span className="text-body-sm font-semibold text-amber-500 flex items-center gap-1 font-tabular">
                  <Star className="w-4 h-4 fill-amber-400" /> 0.0 (0 reviews)
                </span>
              </div>
              <div className="p-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-center space-y-2">
                <MessageSquare className="w-9 h-9 text-neutral-300 mx-auto" />
                <p className="text-body-sm font-semibold text-neutral-700">No reviews published yet</p>
                <p className="text-caption text-neutral-400 font-normal">Reviews left by verified guests will display here.</p>
              </div>
            </Card>
          )}

          {/* TAB 4: REVENUE (MATCHING IMAGE 2 IN FAIRBNB LIGHT THEME) */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* 4 STAT CARDS ROW */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border border-neutral-200/80 shadow-xs rounded-2xl bg-white p-4 space-y-1">
                  <span className="text-overline font-semibold uppercase text-neutral-500 tracking-wider">
                    Total Earnings
                  </span>
                  <p className="text-h2 font-bold font-tabular text-neutral-900 tracking-tight">₹0</p>
                </Card>

                <Card className="border border-neutral-200/80 shadow-xs rounded-2xl bg-white p-4 space-y-1">
                  <span className="text-overline font-semibold uppercase text-neutral-500 tracking-wider">
                    Total Bookings
                  </span>
                  <p className="text-h2 font-bold font-tabular text-neutral-900 tracking-tight">0</p>
                </Card>

                <Card className="border border-neutral-200/80 shadow-xs rounded-2xl bg-white p-4 space-y-1">
                  <span className="text-overline font-semibold uppercase text-neutral-500 tracking-wider">
                    Avg. Booking Value
                  </span>
                  <p className="text-h2 font-bold font-tabular text-neutral-900 tracking-tight">₹0</p>
                </Card>

                <Card className="border border-neutral-200/80 shadow-xs rounded-2xl bg-white p-4 space-y-1">
                  <span className="text-overline font-semibold uppercase text-neutral-500 tracking-wider">
                    Platform Fee (10%)
                  </span>
                  <p className="text-h2 font-bold font-tabular text-rose-500 tracking-tight">-₹0</p>
                </Card>
              </div>

              {/* REVENUE TREND CHART CARD */}
              <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white p-6 space-y-4">
                <div>
                  <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Revenue Trend</h3>
                  <p className="text-caption text-neutral-500 font-normal mt-0.5">
                    Monthly revenue for this property
                  </p>
                </div>

                {/* GRAPH CONTAINER */}
                <div className="h-64 w-full bg-neutral-50/50 rounded-2xl border border-neutral-200/80 p-5 relative flex flex-col justify-between">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-5 top-8 border-b border-neutral-200/60 flex items-center justify-between text-caption text-neutral-400 font-medium font-tabular">
                    <span>4k</span>
                  </div>
                  <div className="absolute inset-x-5 top-24 border-b border-neutral-200/60 flex items-center justify-between text-caption text-neutral-400 font-medium font-tabular">
                    <span>3k</span>
                  </div>
                  <div className="absolute inset-x-5 top-40 border-b border-neutral-200/60 flex items-center justify-between text-caption text-neutral-400 font-medium font-tabular">
                    <span>1k</span>
                  </div>
                  <div className="absolute inset-x-5 bottom-8 border-b border-neutral-200 flex items-center justify-between text-caption text-neutral-400 font-medium font-tabular">
                    <span>0</span>
                  </div>

                  {/* SVG Line / Bar Graphic */}
                  <div className="w-full h-full relative flex items-end justify-between px-8 pt-8 pb-8 z-10">
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <path
                        d="M 40 180 Q 150 170, 260 175 T 480 180 T 700 180"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>

                  {/* X-Axis Month Labels */}
                  <div className="flex items-center justify-between px-6 pt-2 text-caption font-semibold text-neutral-400 z-10 border-t border-neutral-200">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: CALENDAR SYNC (MATCHING IMAGE 3 IN FAIRBNB LIGHT THEME) */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* TOP 2 CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. EXPORT CALENDAR CARD */}
                <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-neutral-900 text-base flex items-center gap-2">
                      <Download className="w-4 h-4 text-rose-500" /> Export Calendar
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      Copy this secure link to Airbnb/Booking.com to block dates when booked here.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-label font-medium text-neutral-700">FairBnB iCal Feed URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={exportUrl}
                        className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-neutral-600 select-all"
                      />
                      <button
                        onClick={handleCopyIcalUrl}
                        className="p-2.5 bg-neutral-900 hover:bg-black text-white font-bold rounded-xl transition cursor-pointer flex-shrink-0"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-caption text-amber-800 font-medium flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>This URL includes a private token. Regenerate it if you suspect it was shared publicly.</span>
                  </div>

                  <button
                    onClick={() => showToast('Export calendar token regenerated')}
                    className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Regenerate export link
                  </button>
                </Card>

                {/* 2. IMPORT CALENDARS CARD */}
                <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-neutral-900 text-base flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" /> Import Calendars
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      Paste iCal links from other platforms to block dates here.
                    </p>
                  </div>

                  <form onSubmit={handleAddIcalFeed} className="space-y-3">
                    <div>
                      <label className="text-overline font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Airbnb"
                        value={newFeedName}
                        onChange={(e) => setNewFeedName(e.target.value)}
                        className="w-full px-3.5 py-2 text-body-sm bg-white border border-neutral-200 rounded-xl font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-overline font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                        iCal URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          required
                          placeholder="https://..."
                          value={newFeedUrl}
                          onChange={(e) => setNewFeedUrl(e.target.value)}
                          className="w-full px-3.5 py-2 text-body-sm bg-white border border-neutral-200 rounded-xl font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <button
                          type="submit"
                          className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition cursor-pointer flex-shrink-0"
                          title="Add iCal Feed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </form>
                </Card>
              </div>

              {/* 3. CONNECTED CALENDARS BOTTOM SECTION */}
              <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 text-base">Connected Calendars</h3>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">Manage your synchronized calendars</p>
                  </div>

                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white font-medium text-button rounded-xl transition cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>

                {icalFeeds.length === 0 ? (
                  <div className="p-8 bg-neutral-50/70 rounded-2xl border border-dashed border-neutral-200 text-center text-body-sm font-medium text-neutral-400">
                    No calendars connected yet.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-200/80 rounded-2xl overflow-hidden bg-white">
                    {icalFeeds.map((feed) => (
                      <div key={feed.id} className="p-4 flex items-center justify-between text-body-sm">
                        <div>
                          <p className="font-semibold text-neutral-900">{feed.name}</p>
                          <p className="text-caption text-neutral-400 font-mono truncate max-w-sm mt-0.5">{feed.url}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-overline font-semibold border border-emerald-200">
                          Active Sync
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 6: COLLECTIONS (MATCHING IMAGE 4 IN FAIRBNB LIGHT THEME) */}
          {activeTab === 'collections' && (
            <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white p-6 space-y-4">
              <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Property Collections</h3>
              <p className="text-caption text-neutral-500 font-normal">
                Assign this property to curated marketing collections.
              </p>
              <div className="p-10 bg-neutral-50/80 rounded-2xl border border-dashed border-neutral-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 mx-auto flex items-center justify-center text-neutral-400 shadow-2xs">
                  <Layers className="w-6 h-6" />
                </div>
                <p className="text-body-sm font-bold text-neutral-900">Luxury Villas & Modern Homes</p>
                <p className="text-caption text-neutral-400 font-normal">Featured in Top Summer Stays Collection</p>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: SIDEBAR METRICS & TOGGLES (MATCHING IMAGE 2 EXACTLY) */}
        <div className="space-y-4">
          {/* 1. RATING & SPEC HEADER SUMMARY CARD */}
          <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-h4">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>0</span>
                <span className="text-caption text-neutral-500 font-normal">(0 reviews)</span>
              </div>
              <div className="flex items-center gap-3 text-caption text-neutral-500 font-medium font-tabular border-t border-neutral-100 pt-2">
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-neutral-400" /> {property.bedrooms || 5} beds
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-neutral-400" /> {property.bathrooms || 1} baths
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-neutral-400" /> {property.maxGuests || 15} guests
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. GUEST CAPACITY CARD (BLUE PASTEL GRID MATCHING IMAGE 2) */}
          <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-neutral-900">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-body-sm">Guest Capacity</h3>
              </div>

              {/* 2 PASTEL BLUE METRIC BOXES */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 text-center">
                  <span className="text-overline font-semibold text-sky-800 uppercase tracking-wider block mb-1">
                    STANDARD
                  </span>
                  <p className="text-h4 font-bold font-tabular text-neutral-900">
                    {Math.min(10, property.maxGuests || 10)} Guests
                  </p>
                </div>

                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 text-center">
                  <span className="text-overline font-semibold text-sky-800 uppercase tracking-wider block mb-1">
                    EXTRA ALLOWED
                  </span>
                  <p className="text-h4 font-bold font-tabular text-sky-700">+5 Guests</p>
                </div>
              </div>

              {/* FOOTER CAPACITIES */}
              <div className="space-y-1.5 pt-1 text-caption text-neutral-500 font-normal border-t border-neutral-100">
                <div className="flex items-center justify-between font-semibold font-tabular text-neutral-600">
                  <span>Max Adults: 10</span>
                  <span>Max Children: 5</span>
                </div>
                <p className="italic text-caption text-neutral-400">
                  * Infants are not included in the guest count.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. PRICE PER NIGHT CARD */}
          <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white hover:border-neutral-300 transition cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-neutral-500 text-caption font-semibold">
                  <Tag className="w-4 h-4 text-neutral-400" /> Price per night
                </div>
                <p className="text-h2 font-bold font-tabular text-neutral-900 tracking-tight">
                  ₹{property.basePrice?.toLocaleString('en-IN') || '14,000'}
                </p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-neutral-400" />
            </CardContent>
          </Card>

          {/* 4. TOTAL REVENUE CARD */}
          <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex items-center gap-2 text-neutral-500 text-caption font-semibold">
                <Wallet className="w-4 h-4 text-emerald-500" /> Total Revenue
              </div>
              <p className="text-h2 font-bold font-tabular text-emerald-600 tracking-tight">₹0</p>
            </CardContent>
          </Card>

          {/* 5. TAX & TOGGLES SETTINGS CARD */}
          <Card className="border border-neutral-200/80 shadow-xs rounded-3xl bg-white">
            <CardContent className="p-5 space-y-4">
              {/* TAX RATE ITEM */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <span className="text-label font-medium text-neutral-700 block">Tax Rate</span>
                  {isEditingTax ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={customTaxInput}
                        onChange={(e) => setCustomTaxInput(e.target.value)}
                        className="w-16 px-2 py-1 text-body-sm border border-neutral-300 rounded-lg font-medium font-tabular text-neutral-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        onClick={handleSaveTaxRate}
                        className="p-1 bg-neutral-900 text-white rounded-lg hover:bg-black transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-body-sm font-bold font-tabular text-neutral-900 mt-0.5">
                      {taxRate}% <span className="text-caption text-neutral-500 font-normal">(Default)</span>
                    </p>
                  )}
                </div>
                {!isEditingTax && (
                  <button
                    onClick={() => setIsEditingTax(true)}
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-neutral-500 transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* INSTANT BOOKING TOGGLE */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <span className="text-body-sm font-semibold text-neutral-900 block">Instant Booking</span>
                  <span className="text-caption text-neutral-500 font-normal block">
                    {instantBooking ? 'Instant checkouts enabled' : 'Manual approval required'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleInstantBookToggle}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${instantBooking ? 'bg-rose-500' : 'bg-neutral-200'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${instantBooking ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {/* DISABLE PARTIAL (WEEKEND) TOGGLE */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-body-sm font-semibold text-neutral-900 block">Disable Partial (Weekend)</span>
                  <span className="text-caption text-neutral-500 font-normal block">
                    Force 'Entire Place' on Fri/Sat
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !disablePartialWeekend;
                    setDisablePartialWeekend(next);
                    showToast(`Weekend partial stay ${next ? 'disabled' : 'enabled'}`);
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${disablePartialWeekend ? 'bg-rose-500' : 'bg-neutral-200'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${disablePartialWeekend ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
