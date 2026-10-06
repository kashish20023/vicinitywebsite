'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User, Bed, Sparkles, Check } from 'lucide-react';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { PropertyPriceTag } from '@/components/property/PropertyPriceTag';

export interface PropertyCardData {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category: string;
  propertyType: string;
  locality?: string;
  city: string;
  state?: string;
  country?: string;
  basePrice: number;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  instantBook?: boolean;
  verificationStatus?: string;
  status?: string;
  rating?: number;
  reviewCount?: number;
  adminTags?: string[];
  listingExtras?: Record<string, any>;
}

export function PropertyCard({
  property,
  openInNewTab = false,
  isSelectedForCompare,
  onToggleCompare,
}: {
  property: PropertyCardData;
  openInNewTab?: boolean;
  isSelectedForCompare?: boolean;
  onToggleCompare?: () => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images =
    property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Badges text
  const guestCount = property.maxGuests || 4;
  const bedroomCount = property.bedrooms || 2;
  const guestText = `${guestCount} ${guestCount === 1 ? 'Guest' : 'Guests'}`;
  const bedroomText = `${bedroomCount} ${bedroomCount === 1 ? 'Bedroom' : 'Bedrooms'}`;

  // Location / Subtitle text
  const subtitleText =
    property.shortDescription ||
    property.description ||
    [property.locality || property.city, property.country || 'India'].filter(Boolean).join(', ');

  const displayTitle = property.title || 'Property stay';

  return (
    <Link
      href={`/properties/${property.slug || property.id}`}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className="group flex flex-col bg-white border border-gray-200/90 rounded-3xl shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden select-none cursor-pointer h-full"
    >
      {/* 1. TOP IMAGE CONTAINER */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        <img
          src={images[currentImageIndex]}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* TOP-LEFT COMPARE TOGGLE BUTTON */}
        {onToggleCompare && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 ${
              isSelectedForCompare
                ? 'bg-[#0e4962] text-white'
                : 'bg-white/90 hover:bg-white text-neutral-700'
            }`}
          >
            <span>{isSelectedForCompare ? '✓ Compared' : '+ Compare'}</span>
          </button>
        )}

        {/* TOP-RIGHT CIRCULAR WISHLIST HEART BUTTON */}
        <FavoriteButton
          propertyId={property.id}
          className="absolute top-3 right-3 z-10"
        />

        {/* CAROUSEL ARROWS ON HOVER */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 duration-150 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 duration-150 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* DOT INDICATORS */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {images.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-150 rounded-full ${
                    currentImageIndex === idx ? 'w-3.5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. CARD CONTENT BODY */}
      <div className="p-3 sm:p-3 flex flex-col flex-1 justify-between space-y-3.5">
        <div className="space-y-1">
          {/* TITLE */}
          <h3 className="font-semibold text-gray-900 text-body-lg line-clamp-1 leading-snug group-hover:text-[#0e4962] transition-colors">
            {displayTitle}
          </h3>

          {/* SUBTITLE / DESCRIPTION */}
          <p className="text-caption text-gray-500 line-clamp-1 font-medium">
            {subtitleText}
          </p>
        </div>

        {/* FEATURE BADGES ROW (GUESTS & BEDROOMS) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="bg-gray-100/80 text-gray-700 text-caption font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span>{guestText}</span>
          </div>

          <div className="bg-gray-100/80 text-gray-700 text-caption font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-gray-500" />
            <span>{bedroomText}</span>
          </div>
        </div>

        {/* FOOTER ROW: PRICE & PRIMARY COLOR BOOK NOW BUTTON */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 ">
          <PropertyPriceTag basePrice={property.basePrice || 14000} />

          <span className="bg-[#0e4962] hover:bg-[#093447] text-white text-button px-4 py-2 rounded-full shadow-2xs hover:shadow-xs transition-transform active:scale-95 inline-block text-center">
            Book now
          </span>
        </div>
      </div>
    </Link>
  );
}

