'use client';

import React, { useState } from 'react';
import { Maximize2, ExternalLink, X } from 'lucide-react';

interface PropertyLocationSectionProps {
  title: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  pincode?: number;
}

export function PropertyLocationSection({
  title,
  city,
  state,
  country,
  address,
  pincode,
}: PropertyLocationSectionProps) {
  const [mapExpanded, setMapExpanded] = useState(false);
  
  // Format full address string
  const fullAddressString = address || `${title}, ${city}, ${state || ''} ${pincode || ''}, ${country || 'India'}`;

  return (
    <div className="py-8 border-b border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Where you&apos;ll be</h3>

      {/* Map Container (Only fullscreen expand button on top right) */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-[380px] sm:h-[420px] bg-gray-100 shadow-2xs">
        <iframe
          title="Property Location Map"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(
            address || `${city}, ${state || 'India'}`
          )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />
        {/* Only native fullscreen expand button */}
        <button
          type="button"
          onClick={() => setMapExpanded(true)}
          className="absolute top-3 right-3 bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-lg shadow-md transition"
          title="Expand map"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Unconditional Full Address Block Below Map */}
      <div className="mt-4 space-y-1">
        <h4 className="font-bold text-sm sm:text-base text-gray-900">
          {city}, {country || 'India'}
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed">
          {fullAddressString}
        </p>
        <div className="pt-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              address || `${city}, ${country || 'India'}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-900 underline hover:text-black transition"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* EXPANDED MAP MODAL */}
      {mapExpanded && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[80vh] flex flex-col p-6 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{title} Location</h3>
                <p className="text-xs text-gray-500">{fullAddressString}</p>
              </div>
              <button
                onClick={() => setMapExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200">
              <iframe
                title="Expanded Location Map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  address || `${city}, ${state || 'India'}`
                )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
