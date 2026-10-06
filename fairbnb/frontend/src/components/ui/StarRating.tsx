'use client';

import React from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'stars' | 'pill';
  showCount?: boolean;
  className?: string;
}

const SIZE_STYLES = {
  xs: { star: 'w-3 h-3', text: 'text-[11px]', gap: 'gap-0.5' },
  sm: { star: 'w-3.5 h-3.5', text: 'text-xs', gap: 'gap-1' },
  md: { star: 'w-4 h-4', text: 'text-sm font-semibold', gap: 'gap-1' },
  lg: { star: 'w-5 h-5', text: 'text-base font-bold', gap: 'gap-1.5' },
};

export function StarRating({
  rating,
  totalReviews,
  size = 'md',
  variant = 'badge',
  showCount = true,
  className = '',
}: StarRatingProps) {
  const sizeConfig = SIZE_STYLES[size];
  const formattedScore = (rating || 0).toFixed(rating % 1 === 0 ? 1 : 2);

  if (variant === 'stars') {
    return (
      <div className={`flex items-center ${sizeConfig.gap} ${className}`}>
        <div className="flex items-center text-amber-400">
          {[1, 2, 3, 4, 5].map((starIdx) => {
            const isFilled = rating >= starIdx;
            const isHalf = !isFilled && rating >= starIdx - 0.5;
            return (
              <Star
                key={starIdx}
                className={`${sizeConfig.star} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-neutral-300'
                }`}
              />
            );
          })}
        </div>
        {showCount && (
          <span className={`font-tabular text-neutral-700 ${sizeConfig.text}`}>
            {formattedScore}
            {totalReviews !== undefined && (
              <span className="text-neutral-400 font-normal ml-1">({totalReviews})</span>
            )}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center ${sizeConfig.gap} px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 ${sizeConfig.text} ${className}`}
      >
        <Star className={`${sizeConfig.star} fill-amber-400 text-amber-500`} />
        <span className="font-bold font-tabular">{formattedScore}</span>
        {totalReviews !== undefined && showCount && (
          <span className="text-amber-700/80 font-normal">({totalReviews})</span>
        )}
      </div>
    );
  }

  // Default 'badge'
  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} ${className}`}>
      <Star className={`${sizeConfig.star} fill-amber-400 text-amber-500`} />
      <span className={`font-bold font-tabular text-neutral-900 ${sizeConfig.text}`}>
        {formattedScore}
      </span>
      {totalReviews !== undefined && showCount && (
        <span className="text-neutral-400 font-normal text-caption">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
