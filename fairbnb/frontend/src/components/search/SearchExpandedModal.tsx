'use client';

import React, { useState } from 'react';
import { Search, MapPin, Users, Calendar, X, Plus, Minus } from 'lucide-react';
import AirbnbDateRangePicker from '@/components/calendar/AirbnbDateRangePicker';

interface SearchParams {
  city: string;
  category?: string;
  maxGuests?: number;
  minPrice?: number;
  maxPrice?: number;
}

interface SearchExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (params: { city: string; guests: number; checkIn?: string; checkOut?: string }) => void;
  initialCity?: string;
  initialGuests?: number;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

export function SearchExpandedModal({
  isOpen,
  onClose,
  onSearch,
  initialCity = '',
  initialGuests = 1,
  initialCheckIn = '',
  initialCheckOut = '',
}: SearchExpandedModalProps) {
  const [activeTab, setActiveTab] = useState<'where' | 'dates' | 'who'>('where');
  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [adults, setAdults] = useState(initialGuests || 1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infants, setInfants] = useState(0);

  if (!isOpen) return null;

  const totalGuests = adults + childrenCount;

  const popularDestinations = [
    { name: 'Goa', state: 'India', icon: '🏖️' },
    { name: 'Jaipur', state: 'Rajasthan', icon: '🏰' },
    { name: 'Mumbai', state: 'Maharashtra', icon: '🌆' },
    { name: 'Manali', state: 'Himachal Pradesh', icon: '🏔️' },
    { name: 'Udaipur', state: 'Rajasthan', icon: '⛵' },
    { name: 'Kerala', state: 'India', icon: '🌴' },
  ];

  const handleApply = () => {
    onSearch({ city, guests: totalGuests, checkIn, checkOut });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-start items-center pt-24 px-4">
      {/* Backdrop click */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* TOP BAR / TABS */}
        <div className="bg-gray-50/80 p-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex bg-gray-200/70 p-1 rounded-full text-xs font-semibold">
            <button
              onClick={() => setActiveTab('where')}
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'where' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Where
            </button>
            <button
              onClick={() => setActiveTab('dates')}
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'dates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              When
            </button>
            <button
              onClick={() => setActiveTab('who')}
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'who' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Who
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 sm:p-8 min-h-[300px]">
          {activeTab === 'where' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Search by destination
              </label>
              <div className="relative mb-6">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search destinations (e.g. Goa, Jaipur, Mumbai...)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 text-base sm:text-lg font-medium border border-gray-200 rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition"
                />
                <MapPin className="w-5 h-5 text-rose-500 absolute left-4 top-4" />
                {city && (
                  <button
                    onClick={() => setCity('')}
                    className="absolute right-4 top-4 text-xs font-semibold text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Popular destinations in India
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {popularDestinations.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setCity(item.name);
                      setActiveTab('who');
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition hover:border-gray-900 hover:shadow-sm ${
                      city.toLowerCase() === item.name.toLowerCase()
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.state}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dates' && (
            <div className="flex justify-center">
              <AirbnbDateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(newIn, newOut) => {
                  setCheckIn(newIn);
                  setCheckOut(newOut);
                  if (newIn && newOut) {
                    setActiveTab('who');
                  }
                }}
                locationName={city || 'Any destination'}
              />
            </div>
          )}

          {activeTab === 'who' && (
            <div className="max-w-md mx-auto space-y-6">
              {/* ADULTS */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Adults</p>
                  <p className="text-xs text-gray-500">Ages 13 or above</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-900 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-base w-6 text-center">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CHILDREN */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Children</p>
                  <p className="text-xs text-gray-500">Ages 2–12</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                    disabled={childrenCount <= 0}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-900 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-base w-6 text-center">{childrenCount}</span>
                  <button
                    type="button"
                    onClick={() => setChildrenCount(childrenCount + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* INFANTS */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Infants</p>
                  <p className="text-xs text-gray-500">Under 2</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInfants(Math.max(0, infants - 1))}
                    disabled={infants <= 0}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-900 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-base w-6 text-center">{infants}</span>
                  <button
                    type="button"
                    onClick={() => setInfants(infants + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setCity('');
              setAdults(1);
              setChildrenCount(0);
              setInfants(0);
            }}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 underline"
          >
            Clear all
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition flex items-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" /> Search Fair Stay
          </button>
        </div>
      </div>
    </div>
  );
}
