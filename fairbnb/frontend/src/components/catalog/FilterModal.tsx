'use client';

import React, { useState } from 'react';
import { X, Check, SlidersHorizontal, Sparkles } from 'lucide-react';

export interface FilterCriteria {
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  instantBook?: boolean;
  amenities?: string[];
  sortBy?: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterCriteria) => void;
  initialFilters: FilterCriteria;
}

export function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
  const [minPrice, setMinPrice] = useState<number | ''>(initialFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState<number | ''>(initialFilters.maxPrice || '');
  const [propertyType, setPropertyType] = useState<string>(initialFilters.propertyType || '');
  const [bedrooms, setBedrooms] = useState<number | ''>(initialFilters.bedrooms || '');
  const [bathrooms, setBathrooms] = useState<number | ''>(initialFilters.bathrooms || '');
  const [instantBook, setInstantBook] = useState<boolean>(initialFilters.instantBook || false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilters.amenities || []);

  if (!isOpen) return null;

  const propertyTypes = ['Villa', 'Apartment', 'Haveli', 'Resort', 'Cottage', 'Chalet', 'Hall'];

  const amenitiesList = [
    { id: 'wifi', label: 'Wifi', icon: '📶' },
    { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { id: 'airConditioning', label: 'Air conditioning', icon: '❄️' },
    { id: 'parking', label: 'Free parking', icon: '🚗' },
    { id: 'pool', label: 'Pool', icon: '🏊‍♂️' },
    { id: 'jacuzzi', label: 'Hot tub / Jacuzzi', icon: '🛁' },
    { id: 'seaView', label: 'Sea / Lake view', icon: '🌊' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'rooftopDining', label: 'Rooftop dining', icon: '🍷' },
  ];

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== id));
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const handleApply = () => {
    onApply({
      minPrice: minPrice !== '' ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
      propertyType: propertyType || undefined,
      bedrooms: bedrooms !== '' ? Number(bedrooms) : undefined,
      bathrooms: bathrooms !== '' ? Number(bathrooms) : undefined,
      instantBook: instantBook || undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setBedrooms('');
    setBathrooms('');
    setInstantBook(false);
    setSelectedAmenities([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop click */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-gray-900">Filters</h2>
          <div className="w-8" />
        </div>

        {/* BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8 divide-y divide-gray-100">
          {/* 1. PRICE RANGE */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Price range</h3>
            <p className="text-xs text-gray-500">Nightly prices before taxes and fees</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-200 rounded-2xl focus-within:border-gray-900">
                <label className="block text-overline font-semibold uppercase tracking-wider text-gray-400">
                  Minimum
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-body-sm font-semibold text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-body-lg font-bold font-tabular text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 border border-gray-200 rounded-2xl focus-within:border-gray-900">
                <label className="block text-overline font-semibold uppercase tracking-wider text-gray-400">
                  Maximum
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-body-sm font-semibold text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="50,000+"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-body-lg font-bold font-tabular text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. ROOMS & BEDS */}
          <div className="pt-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Rooms and beds</h3>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Bedrooms</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['Any', '1', '2', '3', '4', '5+'].map((num) => {
                  const val = num === 'Any' ? '' : num === '5+' ? 5 : Number(num);
                  const isSelected = bedrooms === val;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBedrooms(val)}
                      className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Bathrooms</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['Any', '1', '2', '3', '4+'].map((num) => {
                  const val = num === 'Any' ? '' : num === '4+' ? 4 : Number(num);
                  const isSelected = bathrooms === val;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBathrooms(val)}
                      className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. PROPERTY TYPE */}
          <div className="pt-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Property type</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {propertyTypes.map((type) => {
                const isSelected = propertyType.toLowerCase() === type.toLowerCase();
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPropertyType(isSelected ? '' : type)}
                    className={`p-4 rounded-2xl border text-left transition font-semibold text-sm ${
                      isSelected
                        ? 'border-gray-900 bg-gray-50 text-gray-900 ring-2 ring-gray-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. BOOKING OPTIONS */}
          <div className="pt-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Instant Book</h3>
              <p className="text-xs text-gray-500 mt-0.5">Listings you can book without waiting for host approval</p>
            </div>
            <button
              type="button"
              onClick={() => setInstantBook(!instantBook)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                instantBook ? 'bg-rose-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  instantBook ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5. AMENITIES */}
          <div className="pt-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenitiesList.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium">
                      <span>{amenity.icon}</span>
                      <span>{amenity.label}</span>
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-bold text-gray-900 hover:underline"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-2xl shadow transition"
          >
            Show places
          </button>
        </div>
      </div>
    </div>
  );
}
