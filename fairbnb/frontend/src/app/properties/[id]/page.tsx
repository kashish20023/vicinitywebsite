'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import { ShareModal } from '@/components/property/ShareModal';
import { ListingQaWidget } from '@/features/ai/components/ListingQaWidget';
import { PropertyHeaderSection } from '@/components/property/PropertyHeaderSection';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyOverviewSection } from '@/components/property/PropertyOverviewSection';
import { PropertyThingsToKnowSection } from '@/components/property/PropertyThingsToKnowSection';
import { PropertyAmenitiesSection } from '@/components/property/PropertyAmenitiesSection';
import { PropertyCalendarSection } from '@/components/property/PropertyCalendarSection';
import { PropertyLocationSection } from '@/components/property/PropertyLocationSection';
import { PropertyHostBioSection } from '@/components/property/PropertyHostBioSection';
import { PropertyBookingCard } from '@/components/property/PropertyBookingCard';
import { SimilarStaysSection } from '@/components/property/SimilarStaysSection';
import { MobileBookingBar } from '@/components/property/MobileBookingBar';
import { Loader2, AlertCircle, Star } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────
interface PropertyDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  propertyType: string;
  address?: string;
  locality?: string;
  city: string;
  state: string;
  country: string;
  pincode?: number;
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
  pointOfContact?: { name?: string; phone?: string; role?: string };
  createdAt: string;
  bookedRanges?: Array<{ checkIn: string; checkOut: string }>;
  unavailableDates?: string[];
  amenities?: string[];
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer?: { id: string; name: string };
  hostReply?: string | null;
}

interface PropertyReviewsResponse {
  summary: {
    totalReviews: number;
    averageOverall: number;
    averageCleanliness: number;
    averageAccuracy: number;
    averageLocation: number;
    averageValue: number;
  };
  reviews: ReviewData[];
}

// ─── Main Page Component ──────────────────────────────────────────────
export default function AirbnbPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.id as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [reviewsData, setReviewsData] = useState<PropertyReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Dates
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Guests
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);

  const totalGuests = adults + childrenCount;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  useEffect(() => {
    async function load() {
      if (!idOrSlug) return;
      setLoading(true);
      try {
        const [propRes, revRes] = await Promise.all([
          api.get<PropertyDetail>(`/properties/${idOrSlug}`),
          api.get<PropertyReviewsResponse>(`/properties/${idOrSlug}/reviews`).catch(() => null),
        ]);
        setProperty(propRes);
        if (revRes) setReviewsData(revRes);
      } catch (err: any) {
        setError(err.message || 'Listing not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [idOrSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        <AirbnbHeader />
        <div className="flex-1 flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-[#0e4962] mb-3" />
          <p className="text-sm font-semibold text-gray-600">Loading home details...</p>
        </div>
        <AirbnbFooter />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        <AirbnbHeader />
        <div className="flex-1 max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center py-32">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-2xl font-bold text-gray-900">Property not available</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">This listing may have been removed or the URL is incorrect.</p>
          <Link href="/" className="px-6 py-3 bg-[#0e4962] text-white font-bold rounded-2xl text-sm hover:bg-[#093447] transition">
            Explore other homes
          </Link>
        </div>
        <AirbnbFooter />
      </div>
    );
  }

  const hostName = property.pointOfContact?.name || 'Vicinity ORG';
  const totalReviews = reviewsData?.summary?.totalReviews ?? 0;
  const avgRating = reviewsData?.summary?.averageOverall ?? 0;
  const locationString = [property.locality, property.city, property.country || 'India'].filter(Boolean).join(', ');

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  function handleReserve() {
    if (!checkIn || !checkOut) {
      scrollToSection('availability-section');
      return;
    }
    if (!property) return;
    router.push(
      `/book/${property.id}?checkin=${checkIn}&checkout=${checkOut}&guests=${totalGuests}&adults=${adults}&children=${childrenCount}&infants=${infants}&pets=${pets}`
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-gray-900 font-sans">
      <AirbnbHeader />

      <main className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 flex-1">
        {/* Section 1: Property Header */}
        <PropertyHeaderSection
          title={property.title}
          avgRating={avgRating}
          totalReviews={totalReviews}
          locationString={locationString}
          isSaved={isSaved}
          onToggleSave={() => setIsSaved(s => !s)}
          onOpenShare={() => setShareModalOpen(true)}
          onOpenAskAI={() => alert('Fair Stay AI Assistant ready to answer your questions!')}
          onScrollToReviews={() => scrollToSection('reviews-section')}
        />

        {/* Section 2: Image Gallery */}
        <PropertyGallery
          title={property.title}
          images={property.images}
          isSaved={isSaved}
          onToggleSave={() => setIsSaved(s => !s)}
        />

        {/* ════ TWO-COLUMN CONTAINER: SECTIONS 3-7 (LEFT) + SIDEBAR (RIGHT) ════ */}
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start mb-8">
          {/* Left Column (Sections 3 through 7) */}
          <div className="flex-1 min-w-0 w-full">
            {/* Section 3: Overview & Highlights */}
            <PropertyOverviewSection
              category={property.category}
              hostName={hostName}
              maxGuests={property.maxGuests}
              bedrooms={property.bedrooms}
              beds={property.beds}
              bathrooms={property.bathrooms}
              avgRating={avgRating}
              totalReviews={totalReviews}
              description={property.description}
              onScrollToReviews={() => scrollToSection('reviews-section')}
            />

            {/* Section 4: Things to know */}
            <PropertyThingsToKnowSection
              maxGuests={property.maxGuests}
              cancellationPolicy={property.cancellationPolicy}
            />

            {/* Section 5: Amenities & Ask AI */}
            <PropertyAmenitiesSection amenities={property.amenities} />

            <div className="py-6 border-b border-neutral-200">
              <ListingQaWidget
                propertyId={property.id}
                checkIn={checkIn || undefined}
                checkOut={checkOut || undefined}
                guests={totalGuests}
              />
            </div>

            {/* Section 6: Calendar & Availability */}
            <PropertyCalendarSection
              basePrice={property.basePrice}
              bookedRanges={property.bookedRanges}
              unavailableDates={property.unavailableDates}
              checkIn={checkIn}
              checkOut={checkOut}
              onSelect={(ci, co) => {
                setCheckIn(ci);
                setCheckOut(co);
              }}
            />

            {/* Section 7: Reviews */}
            <div id="reviews-section" className="py-8 border-b border-gray-200 scroll-mt-28">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 fill-gray-900 text-gray-900" />
                <h3 className="text-xl font-bold text-gray-900">
                  {avgRating > 0 ? avgRating.toFixed(1) : '0'} · {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </h3>
              </div>

              {totalReviews > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviewsData!.reviews.slice(0, 4).map(rev => (
                    <div key={rev.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0f4c5c] text-white font-bold flex items-center justify-center text-sm">
                          {rev.reviewer?.name?.charAt(0) || 'G'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{rev.reviewer?.name || 'Verified Guest'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-normal">No reviews yet.</p>
              )}
            </div>
          </div>

          {/* Right Sticky Sidebar Column (Sticks alongside Sections 3-7) */}
          <PropertyBookingCard
            basePrice={property.basePrice}
            avgRating={avgRating}
            totalReviews={totalReviews}
            maxGuests={property.maxGuests}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            childrenCount={childrenCount}
            infants={infants}
            pets={pets}
            nights={nights}
            onAdultsChange={setAdults}
            onChildrenChange={setChildrenCount}
            onInfantsChange={setInfants}
            onPetsChange={setPets}
            onScrollToAvailability={() => scrollToSection('availability-section')}
            onReserve={handleReserve}
          />
        </div>

        {/* ════ FULL-WIDTH BOTTOM BLOCK ════ */}
        {/* Section 8: Where You'll Be (Map - FULL WIDTH across container) */}
        <PropertyLocationSection
          title={property.title}
          city={property.city}
          state={property.state}
          country={property.country}
          address={property.address}
          pincode={property.pincode}
        />

        {/* Section 9: Host Bio (Host Section - FULL WIDTH across container) */}
        <PropertyHostBioSection hostName={hostName} />

        {/* Section 10: Similar Stays Grid (Matching attached image cards) */}
        <SimilarStaysSection currentPropertyId={property.id} />

      </main>

      {/* Sticky Mobile Bottom Booking Bar */}
      <MobileBookingBar
        basePrice={property.basePrice}
        checkIn={checkIn}
        checkOut={checkOut}
        onReserve={handleReserve}
      />

      {/* Share Modal */}
      {property && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          property={property}
        />
      )}

      <AirbnbFooter />
    </div>
  );
}
