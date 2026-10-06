'use client';

import React, { useState, useEffect } from 'react';
import { Heart, X, ChevronLeft, ChevronRight, Share2, Grid } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

export interface ImageGalleryMosaicProps {
  title: string;
  images: string[];
  propertyId?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onShare?: () => void;
  className?: string;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
];

export function ImageGalleryMosaic({
  title,
  images = [],
  propertyId,
  isSaved = false,
  onToggleSave,
  onShare,
  className = '',
}: ImageGalleryMosaicProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const displayPhotos = (images && images.length > 0 ? images : FALLBACK_IMAGES);
  const topPhotos = displayPhotos.slice(0, 5);

  const openLightbox = (index: number = 0) => {
    setActivePhotoIdx(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % displayPhotos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, displayPhotos.length]);

  return (
    <>
      <div className={`relative rounded-3xl overflow-hidden mb-8 shadow-2xs border border-neutral-200/80 bg-white ${className}`}>
        {/* DESKTOP 5-PHOTO BENTO MOSAIC */}
        <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2 h-[420px] lg:h-[480px]">
          {/* Main Large Left Photo (2 cols x 2 rows) */}
          <div
            className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group bg-neutral-100"
            onClick={() => openLightbox(0)}
          >
            <img
              src={topPhotos[0]}
              alt={`${title} - Main Photo`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* 4 Supporting Photos */}
          {topPhotos.slice(1, 5).map((photo, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden cursor-pointer group bg-neutral-100"
              onClick={() => openLightbox(idx + 1)}
            >
              <img
                src={photo}
                alt={`${title} - Photo ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* MOBILE SINGLE HERO PHOTO */}
        <div
          className="block sm:hidden relative aspect-[16/10] cursor-pointer"
          onClick={() => openLightbox(0)}
        >
          <img
            src={topPhotos[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            1 / {displayPhotos.length}
          </div>
        </div>

        {/* FLOATING ACTION BUTTONS (TOP RIGHT & BOTTOM RIGHT) */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-sm flex items-center justify-center text-neutral-800 hover:scale-110 active:scale-95 transition cursor-pointer"
              title="Share property"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {propertyId ? (
            <FavoriteButton
              propertyId={propertyId}
              initialFavorited={isSaved}
              onToggle={onToggleSave}
            />
          ) : onToggleSave ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              className="w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-sm flex items-center justify-center text-neutral-800 hover:scale-110 active:scale-95 transition cursor-pointer"
              title="Save property"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#0e4962] text-[#0e4962]' : 'text-neutral-900'}`} />
            </button>
          ) : null}
        </div>

        {/* FLOATING 'SHOW ALL PHOTOS' BUTTON */}
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 bg-white/95 hover:bg-white border border-neutral-300 text-neutral-900 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Show all {displayPhotos.length} photos</span>
        </button>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col justify-between text-white animate-in fade-in duration-200">
          {/* TOP BAR */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800">
            <button
              type="button"
              onClick={closeLightbox}
              className="p-2 rounded-full hover:bg-neutral-800 transition cursor-pointer"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-sm font-bold font-tabular text-neutral-300">
              {activePhotoIdx + 1} / {displayPhotos.length}
            </div>
            <div className="w-10" />
          </div>

          {/* MAIN PHOTO VIEW WITH PREV / NEXT */}
          <div className="relative flex-1 flex items-center justify-center p-4 min-h-0">
            {displayPhotos.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-4 sm:left-8 z-10 w-12 h-12 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center transition hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="max-w-5xl max-h-full flex items-center justify-center overflow-hidden rounded-2xl">
              <img
                src={displayPhotos[activePhotoIdx]}
                alt={`${title} - Photo ${activePhotoIdx + 1}`}
                className="max-h-[70vh] sm:max-h-[75vh] w-auto object-contain rounded-xl select-none"
              />
            </div>

            {displayPhotos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-4 sm:right-8 z-10 w-12 h-12 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center transition hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* BOTTOM THUMBNAIL STRIP */}
          <div className="p-4 sm:p-6 border-t border-neutral-800 overflow-x-auto">
            <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
              {displayPhotos.map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                    activePhotoIdx === idx
                      ? 'border-amber-400 scale-105 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={thumb} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
