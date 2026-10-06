'use client';

import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';

interface PropertyGalleryProps {
  title: string;
  images: string[];
  isSaved: boolean;
  onToggleSave: () => void;
}

export function PropertyGallery({
  title,
  images,
  isSaved,
  onToggleSave,
}: PropertyGalleryProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);

  const fallbackImages = [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  ];
  const displayPhotos = [...(images?.length ? images : []), ...fallbackImages].slice(0, 5);

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden mb-10 shadow-2xs border border-gray-200/60 bg-white">
        {/* Desktop Bento Grid */}
        <div className="hidden sm:grid grid-cols-2 gap-2 h-[480px] lg:h-[520px]">
          {/* Left Column: 1 Large Image (50% width) */}
          <div
            className="relative overflow-hidden cursor-pointer group bg-gray-100 rounded-l-2xl"
            onClick={() => setGalleryOpen(true)}
          >
            <img
              src={displayPhotos[0]}
              alt={title}
              className="w-full h-full object-cover group-hover:brightness-95 transition duration-300"
            />
          </div>

          {/* Right Column: 2x2 Grid of 4 Smaller Images (50% width total) */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
            {displayPhotos.slice(1, 5).map((photo, idx) => {
              let cornerClass = '';
              if (idx === 1) cornerClass = 'rounded-tr-2xl';
              if (idx === 3) cornerClass = 'rounded-br-2xl';

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden cursor-pointer group bg-gray-100 ${cornerClass}`}
                  onClick={() => setGalleryOpen(true)}
                >
                  <img
                    src={photo}
                    alt={`Photo ${idx + 2}`}
                    className="w-full h-full object-cover group-hover:brightness-95 transition duration-300"
                  />

                  {/* Floating Heart/Save on Top-Right Image */}
                  {idx === 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave();
                      }}
                      className="absolute top-3 right-3 bg-white hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition"
                      aria-label="Save Property"
                    >
                      <Heart className={`w-4 h-4 text-gray-900 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Single Hero Image View */}
        <div className="block sm:hidden relative h-[280px] cursor-pointer" onClick={() => setGalleryOpen(true)}>
          <img src={displayPhotos[0]} alt={title} className="w-full h-full object-cover rounded-2xl" />
        </div>

        {/* Floating "Show all photos" Pill Button */}
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 border border-gray-900 text-gray-900 font-semibold text-xs px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition"
        >
          <span>▦</span>
          <span>Show all photos</span>
        </button>
      </div>

      {/* Fullscreen Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
            <button
              onClick={() => setGalleryOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition"
              aria-label="Close Gallery"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-sm font-bold">{displayPhotos.length} photos</p>
            <div className="w-8" />
          </div>
          <div className="max-w-4xl mx-auto space-y-6 pb-12 w-full">
            {displayPhotos.map((p, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={p} alt={`Photo ${idx + 1}`} className="w-full h-auto object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
