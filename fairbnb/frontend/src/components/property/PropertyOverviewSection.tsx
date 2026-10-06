'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface PropertyOverviewSectionProps {
  category: string;
  hostName: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  avgRating: number;
  totalReviews: number;
  description: string;
  onScrollToReviews: () => void;
}

export function PropertyOverviewSection({
  category,
  hostName,
  maxGuests,
  bedrooms,
  beds,
  bathrooms,
  avgRating,
  totalReviews,
  description,
  onScrollToReviews,
}: PropertyOverviewSectionProps) {
  const defaultHighlights = [
    '3 Luxurious Rooms with Huge Balcony with Attached Washroom and provision of Extra bed & Mattress',
    '2 Swiss Tent Rooms with AC Attrached Washroom',
    'Kids Room with Convertible Sofa Bed',
    'AC Lounge Hall with Sofa Seating, Dining Table & 65 Inch LED SMART TV',
    'Open Hall on 1st Floor with Board Games and Relax Seating',
    'POOL & TT TABLE With Indoor & Outdoor Games',
    'Common Washrooms near pool',
    '35 * 15 Feet Swimming Pool with max ht. 4 Feet with Open Air Jacuzzi',
    'Pool Side Bar Counter',
    'Movable BT Music System for Parties',
    '24 Hours Security Guard and CCTV survilience',
    '3000 Sq. Ft. Area as Pool Deck with Seating and bon fire setup.',
    '15000 Sq. Ft. Landscapped Garden for outdoor parties (Upto 250 People)',
    'Inhouse Chef and party menu on Demand.',
    '24 Hour Caretaker & Housekeeping & Service Staff at the Property.',
  ];

  const rawDescLines = description
    ? description.split('\n').map(l => l.trim()).filter(Boolean)
    : defaultHighlights;

  return (
    <>
      {/* ── SECTION 3: HOST / OVERVIEW BLOCK ── */}
      <div className="pb-8 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              Entire {category?.toLowerCase() || 'home'} hosted by <span className="font-bold">{hostName}</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1 font-normal">
              {maxGuests} guests · {bedrooms} bedrooms · {beds} beds · {bathrooms} baths
            </p>

            {/* Rating line */}
            <div className="flex items-center gap-1.5 mt-2.5 text-sm text-gray-800">
              <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
              <span className="font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '0'}</span>
              <span>·</span>
              <button
                onClick={onScrollToReviews}
                className="underline font-medium hover:text-black"
              >
                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </button>
            </div>
          </div>

          {/* Host Avatar (Solid Dark Green/Teal #0f4c5c) */}
          <div className="w-14 h-14 rounded-full bg-[#0f4c5c] flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-2xs">
            {hostName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-gray-700 mt-5 font-normal">
          This is a {bedrooms}bhk property
        </p>
      </div>

      {/* ── SECTION 3 (CONT.): ABOUT THIS PLACE ── */}
      <div className="py-8 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-3">About this place</h3>
        <p className="text-xs font-bold text-gray-900 mb-4 tracking-wide uppercase">
          THE AMBITION FARM - *Property Highlights*
        </p>

        {/* Bullet highlights with 👉 pointer emoji matching live site */}
        <div className="space-y-2 text-xs sm:text-sm text-gray-800 leading-relaxed font-normal">
          {rawDescLines.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="select-none text-base leading-snug">👉</span>
              <span>{line.replace(/^[👉☞]\s*/, '')}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
