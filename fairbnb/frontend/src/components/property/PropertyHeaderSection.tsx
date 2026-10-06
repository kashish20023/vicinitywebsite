'use client';

import React from 'react';
import { Star, Sparkles, Share2, Heart } from 'lucide-react';

interface PropertyHeaderSectionProps {
  title: string;
  avgRating: number;
  totalReviews: number;
  locationString: string;
  isSaved: boolean;
  onToggleSave: () => void;
  onOpenShare: () => void;
  onOpenAskAI: () => void;
  onScrollToReviews: () => void;
}

export function PropertyHeaderSection({
  title,
  avgRating,
  totalReviews,
  locationString,
  isSaved,
  onToggleSave,
  onOpenShare,
  onOpenAskAI,
  onScrollToReviews,
}: PropertyHeaderSectionProps) {
  return (
    <div className="mb-6">
      <h1 className="text-h1 font-bold text-gray-900 tracking-tight leading-snug">
        {title}
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 text-body-sm text-gray-800">
        {/* Sub-row: Star, Reviews link, Location */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900 inline" />
          <span className="font-bold font-tabular text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : '0'}</span>
          <span>·</span>
          <button
            onClick={onScrollToReviews}
            className="underline font-semibold font-tabular hover:text-black transition"
          >
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </button>
          <span>·</span>
          <span className="text-gray-700 underline font-medium">{locationString}</span>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* ✨ Ask AI Button */}
          <button
            type="button"
            onClick={onOpenAskAI}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-900 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:border-gray-400 hover:bg-gray-50 transition shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Ask AI
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 text-gray-900 font-medium hover:bg-gray-200/50 px-2.5 py-1.5 rounded-lg transition"
          >
            <Share2 className="w-4 h-4" />
            <span className="underline">Share</span>
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={onToggleSave}
            className="flex items-center gap-1.5 text-gray-900 font-medium hover:bg-gray-200/50 px-2.5 py-1.5 rounded-lg transition"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="underline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
