'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Map, Search, Navigation, Check } from 'lucide-react';

interface LocationSelectorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: string) => void;
  currentCity?: string;
  cities?: string[];
}

const DEFAULT_CITIES = [
  'Manali',
  'Pune',
  'Pushkar',
  'Sumel',
  'Udaipur',
  'Goa',
  'Jaipur',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Rishikesh',
  'Kerala',
];

export function LocationSelectorPopover({
  isOpen,
  onClose,
  onSelectCity,
  currentCity = '',
  cities = DEFAULT_CITIES,
}: LocationSelectorPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  const handleSelect = (cityName: string) => {
    onSelectCity(cityName);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          // Default to Gurgaon/Delhi or nearest detected city
          onSelectCity('Delhi NCR');
          onClose();
        },
        (err) => {
          setLocating(false);
          onSelectCity('Delhi NCR');
          onClose();
        },
      );
    } else {
      setLocating(false);
      onSelectCity('Delhi NCR');
      onClose();
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute left-1/2 -translate-x-1/2 mt-2 w-[min(calc(100vw-2rem),320px)] bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* HEADER SECTION */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0e4962] shrink-0 mt-0.5">
          <Map className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-h4 leading-tight">
            Select Location
          </h3>
          <p className="text-caption text-gray-500 font-normal mt-0.5">
            Find properties in any city or area
          </p>
        </div>
      </div>

      {/* SEARCH INPUT */}
      <div className="relative rounded-2xl border-2 border-[#0e4962] px-3 py-2 flex items-center gap-2.5 bg-white mb-3 shadow-xs">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search city, area, or locality..."
          className="w-full bg-transparent outline-none text-body-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-body-sm font-bold">×</span>
          </button>
        )}
      </div>

      {/* CITIES LIST BOX */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-1.5 max-h-52 overflow-y-auto space-y-0.5 scrollbar-none">
        {filteredCities.length === 0 ? (
          <div className="py-6 text-center text-caption text-gray-400 font-normal">
            No cities found matching "{searchQuery}"
          </div>
        ) : (
          filteredCities.map((cityName) => {
            const isSelected = currentCity.toLowerCase() === cityName.toLowerCase();
            return (
              <button
                key={cityName}
                type="button"
                onClick={() => handleSelect(cityName)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-body-sm flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0e4962] text-white font-semibold'
                    : 'text-gray-800 font-medium hover:bg-white hover:shadow-2xs'
                }`}
              >
                <span>{cityName}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })
        )}
      </div>

      {/* OR DIVIDER */}
      <div className="flex items-center my-3">
        <div className="flex-1 h-px bg-gray-200/80" />
        <span className="px-3 text-overline font-semibold text-gray-400 tracking-wider">
          OR
        </span>
        <div className="flex-1 h-px bg-gray-200/80" />
      </div>

      {/* USE CURRENT LOCATION BUTTON */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        className="w-full py-2.5 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-900 text-button font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Navigation className={`w-4 h-4 text-gray-800 stroke-[2] ${locating ? 'animate-spin' : ''}`} />
        <span>{locating ? 'Locating...' : 'Use Current Location'}</span>
      </button>
    </div>
  );
}
