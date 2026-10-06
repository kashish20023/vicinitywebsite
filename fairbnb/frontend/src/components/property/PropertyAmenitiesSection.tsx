'use client';

import React, { useState } from 'react';
import { Sparkles, X, Wifi, Wind, Utensils, Car, Waves, Trees, Tv, ShieldCheck, Sparkle, Flame } from 'lucide-react';

interface PropertyAmenitiesSectionProps {
  amenities?: string[];
}

export function PropertyAmenitiesSection({ amenities }: PropertyAmenitiesSectionProps) {
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);

  const defaultAmenitiesList = [
    { name: 'Fast WiFi (100+ Mbps)', icon: Wifi },
    { name: 'Air conditioning', icon: Wind },
    { name: 'Fully equipped kitchen', icon: Utensils },
    { name: 'Free parking on premises', icon: Car },
    { name: 'Private swimming pool', icon: Waves },
    { name: 'Garden / Lawn access', icon: Trees },
    { name: 'Smart TV & Sound system', icon: Tv },
    { name: '24/7 Gated security', icon: ShieldCheck },
  ];

  return (
    <>
      <div className="py-8 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-5">What this place offers</h3>

        {/* Ask AI Card */}
        <div className="bg-gray-100/70 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Ask AI about this stay</h4>
              <p className="text-xs text-gray-500 mt-0.5">Get instant answers about amenities, check-in, and house rules.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {['Is WiFi available?', 'Check-in & check-out times?', 'Parking available?', 'Pet friendly?'].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => alert(`AI Assistant: ${q}`)}
                className="bg-white border border-gray-200 text-xs font-semibold text-gray-800 px-3.5 py-1.5 rounded-full hover:bg-gray-50 transition shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => alert('Opening AI assistant...')}
            className="text-xs font-bold text-sky-800 hover:underline inline-flex items-center gap-1"
          >
            <span>Open assistant</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* AMENITIES MODAL */}
      {amenitiesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">What this place offers</h3>
              <button
                onClick={() => setAmenitiesModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-800">
              {defaultAmenitiesList.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3.5 py-1 border-b border-gray-50">
                    <Icon className="w-5 h-5 text-gray-700" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-3.5 py-1 border-b border-gray-50">
                <Sparkle className="w-5 h-5 text-gray-700" />
                <span className="font-medium">In-house chef service on request</span>
              </div>
              <div className="flex items-center gap-3.5 py-1 border-b border-gray-50">
                <Flame className="w-5 h-5 text-gray-700" />
                <span className="font-medium">Outdoor bonfire area</span>
              </div>
            </div>

            <button
              onClick={() => setAmenitiesModalOpen(false)}
              className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl text-sm hover:bg-black transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
