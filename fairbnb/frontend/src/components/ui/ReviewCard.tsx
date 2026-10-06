'use client';

import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, ThumbsUp } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { StarRating } from './StarRating';

export interface ReviewItem {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  authorLocation?: string;
  rating: number;
  createdAt: string;
  content: string;
  verifiedStay?: boolean;
  hostResponse?: {
    responderName: string;
    responderAvatar?: string;
    createdAt: string;
    content: string;
  };
}

export interface ReviewCardProps {
  review: ReviewItem;
  onHelpful?: (reviewId: string) => void;
  className?: string;
}

export function ReviewCard({ review, onHelpful, className = '' }: ReviewCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [isHelpful, setIsHelpful] = useState(false);

  const isLong = review.content.length > 220;
  const displayContent =
    isLong && !showFullContent ? `${review.content.slice(0, 220)}...` : review.content;

  const handleHelpfulClick = () => {
    if (isHelpful) {
      setHelpfulCount((c) => Math.max(0, c - 1));
      setIsHelpful(false);
    } else {
      setHelpfulCount((c) => c + 1);
      setIsHelpful(true);
      if (onHelpful) onHelpful(review.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 space-y-4 shadow-2xs transition hover:shadow-xs ${className}`}
    >
      {/* AUTHOR HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={review.authorName} avatarUrl={review.authorAvatar} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-neutral-900 leading-snug">{review.authorName}</h4>
              {review.verifiedStay && (
                <span
                  className="inline-flex items-center gap-0.5 text-overline font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md"
                  title="Verified Stay"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-caption text-neutral-400 font-medium">
              {review.authorLocation ? `${review.authorLocation} • ` : ''}
              {review.createdAt}
            </p>
          </div>
        </div>

        <StarRating rating={review.rating} size="sm" variant="stars" showCount={false} />
      </div>

      {/* REVIEW CONTENT */}
      <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
        <p className="whitespace-pre-line">{displayContent}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-xs font-bold text-[#0e4962] hover:underline mt-1 inline-block cursor-pointer"
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-1 text-xs text-neutral-500 border-t border-neutral-100">
        <button
          type="button"
          onClick={handleHelpfulClick}
          className={`flex items-center gap-1.5 font-medium transition cursor-pointer px-2 py-1 rounded-lg hover:bg-neutral-100 ${
            isHelpful ? 'text-[#0e4962] font-bold' : 'text-neutral-500'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Helpful {helpfulCount > 0 && `(${helpfulCount})`}</span>
        </button>
      </div>

      {/* HOST RESPONSE (IF PRESENT) */}
      {review.hostResponse && (
        <div className="mt-3 pl-4 border-l-2 border-[#0e4962]/30 bg-neutral-50/80 rounded-r-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[#0e4962]" />
            <span className="text-xs font-bold text-neutral-900">
              Response from {review.hostResponse.responderName}
            </span>
            <span className="text-caption text-neutral-400">{review.hostResponse.createdAt}</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {review.hostResponse.content}
          </p>
        </div>
      )}
    </div>
  );
}
