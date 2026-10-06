'use client';

import React, { useRef, useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  {
    ssr: false,
    loading: () => <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />,
  },
);

export interface CategoryItem {
  id: string;
  label: string;
  lottieUrl: string;
  fallbackIcon: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'all',
    label: 'All Categories',
    lottieUrl: '/lottie/all.json',
    fallbackIcon: '✨',
  },
  {
    id: 'villas',
    label: 'Villas',
    lottieUrl: '/lottie/villas.json',
    fallbackIcon: '🏡',
  },
  {
    id: 'trending',
    label: 'Trending',
    lottieUrl: '/lottie/trending.json',
    fallbackIcon: '🔥',
  },
  {
    id: 'farm',
    label: 'Farm',
    lottieUrl: '/lottie/farm.json',
    fallbackIcon: '🌴',
  },
  {
    id: 'apartment',
    label: 'Apartment',
    lottieUrl: '/lottie/apartment.json',
    fallbackIcon: '🏙️',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    lottieUrl: '/lottie/luxury.json',
    fallbackIcon: '💎',
  },
  {
    id: 'house',
    label: 'House',
    lottieUrl: '/lottie/house.json',
    fallbackIcon: '🏠',
  },
  {
    id: 'haveli',
    label: 'Haveli',
    lottieUrl: '/lottie/haveli.json',
    fallbackIcon: '🏰',
  },
  {
    id: 'beachfront',
    label: 'Beachfront',
    lottieUrl: '/lottie/beachfront.json',
    fallbackIcon: '🏖️',
  },
  {
    id: 'cottage',
    label: 'Cottage',
    lottieUrl: '/lottie/cottage.json',
    fallbackIcon: '🛖',
  },
  {
    id: 'penthouse',
    label: 'Penthouse',
    lottieUrl: '/lottie/penthouse.json',
    fallbackIcon: '🏢',
  },
  {
    id: 'cabins',
    label: 'Cabins',
    lottieUrl: '/lottie/cabins.json',
    fallbackIcon: '🪵',
  },
];

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

function CategoryItemButton({
  cat,
  isSelected,
  onSelectCategory,
  isMounted,
}: {
  cat: CategoryItem;
  isSelected: boolean;
  onSelectCategory: (id: string) => void;
  isMounted: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Safeguard: replace broken 403 lottie.host URLs with reliable local /lottie/{id}.json assets
  const srcUrl =
    cat.lottieUrl && !cat.lottieUrl.includes('lottie.host')
      ? cat.lottieUrl
      : `/lottie/${cat.id}.json`;

  return (
    <button
      type="button"
      onClick={() => onSelectCategory(cat.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex flex-col items-center gap-1.5 pb-2 transition border-b-2 flex-shrink-0 group cursor-pointer ${
        isSelected
          ? 'border-gray-900 text-gray-900 font-semibold opacity-100'
          : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300 opacity-70 hover:opacity-100 font-medium'
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-150 overflow-hidden">
        {isMounted && !hasError ? (
          <DotLottieReact
            src={srcUrl}
            loop={isSelected}
            autoplay={isSelected || isHovered}
            style={{ width: '32px', height: '32px' }}
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="text-2xl select-none leading-none">{cat.fallbackIcon || '✨'}</span>
        )}
      </div>
      <span className="text-caption font-medium whitespace-nowrap">{cat.label}</span>
    </button>
  );
}

export function CategoryBar({
  selectedCategory,
  onSelectCategory,
  onOpenFilters,
  activeFilterCount,
}: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 sticky top-20 z-30 shadow-sm/30">
      <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4 py-3">
        {/* CATEGORY SCROLLER */}
        <div className="relative flex-1 overflow-hidden flex items-center">
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 z-10 w-7 h-7 bg-white/95 hover:bg-white shadow-md border border-gray-200 rounded-full items-center justify-center text-gray-700 hover:scale-110 transition -ml-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex items-center gap-7 overflow-x-auto scrollbar-none scroll-smooth px-2 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected =
                selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
                (selectedCategory.toLowerCase().startsWith(cat.id.toLowerCase())) ||
                (cat.id.toLowerCase().startsWith(selectedCategory.toLowerCase()) && selectedCategory !== 'all');
              return (
                <CategoryItemButton
                  key={cat.id}
                  cat={cat}
                  isSelected={isSelected}
                  onSelectCategory={onSelectCategory}
                  isMounted={isMounted}
                />
              );
            })}
          </div>

          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 z-10 w-7 h-7 bg-white/95 hover:bg-white shadow-md border border-gray-200 rounded-full items-center justify-center text-gray-700 hover:scale-110 transition -mr-1 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* FILTERS BUTTON */}
        <div className="flex-shrink-0 pl-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-button font-medium transition hover:border-gray-900 shadow-sm cursor-pointer ${
              activeFilterCount > 0
                ? 'border-gray-900 bg-gray-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-overline flex items-center justify-center font-semibold font-tabular">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
