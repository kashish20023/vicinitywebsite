'use client';

import React from 'react';
import { PropertyCardData } from '@/components/catalog/PropertyCard';
import { MapPin, RefreshCw } from 'lucide-react';

interface SearchMapViewProps {
  properties: PropertyCardData[];
  city?: string;
  onSearchArea?: () => void;
}

export function SearchMapView({ properties, city = 'India', onSearchArea }: SearchMapViewProps) {
  const mapCity = city || (properties[0]?.city) || 'India';

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm min-h-[450px] lg:min-h-[calc(100vh-140px)]">
      {/* MAP IFRAME CONTAINER */}
      <iframe
        title="Search Area Map"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(
          mapCity
        )}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
        className="w-full h-full border-0 absolute inset-0"
        loading="lazy"
        allowFullScreen
      />

      {/* TOP RE-SEARCH OVERLAY BUTTON */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={onSearchArea}
          className="bg-white hover:bg-gray-50 text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2 transition cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0e4962]" />
          <span>Search this area</span>
        </button>
      </div>

      {/* OVERLAY PROPERTY COUNT BADGE */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-gray-200 text-xs font-bold text-gray-900 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#0e4962]" />
        <span>{properties.length} {properties.length === 1 ? 'stay' : 'stays'} mapped in {mapCity}</span>
      </div>
    </div>
  );
}
