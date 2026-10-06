'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  MapPin,
  Heart,
  MessageCircle,
  Flag,
  Share2,
  Check,
  AlertCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ReelPlayer, ReelPlayerData } from './ReelPlayer';
import { ReelCommentsModal } from './ReelCommentsModal';
import { ReelReportModal } from './ReelReportModal';
import { ReelBookingModal } from './ReelBookingModal';
import { shareReel } from './share-utils';
import { api } from '@/lib/api-client';

export interface ReelFeedItem extends ReelPlayerData {
  publishedAt?: string | null;
  likeCount?: number;
  commentCount?: number;
  isLikedByCurrentUser?: boolean;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface ReelFeedCardProps {
  item: ReelFeedItem;
  autoPlay?: boolean;
}

export function ReelFeedCard({ item, autoPlay = true }: ReelFeedCardProps) {
  const [isLiked, setIsLiked] = useState<boolean>(
    Boolean(item.isLikedByCurrentUser),
  );
  const [likeCount, setLikeCount] = useState<number>(item.likeCount || 0);
  const [commentCount, setCommentCount] = useState<number>(
    item.commentCount || 0,
  );
  const [isLiking, setIsLiking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;

    // Optimistic UI update
    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    setIsLiking(true);

    try {
      if (nextLiked) {
        const res = await api.post<{ liked: boolean; likeCount: number }>(
          `/api/reels/${item.id}/like`,
        );
        setLikeCount(res.likeCount);
      } else {
        const res = await api.delete<{ liked: boolean; likeCount: number }>(
          `/api/reels/${item.id}/like`,
        );
        setLikeCount(res.likeCount);
      }
    } catch (err: any) {
      // Rollback on network/auth error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      if (err?.statusCode === 401 || err?.status === 401) {
        showToast('Please log in to like this reel', 'error');
      } else if (err?.statusCode === 429 || err?.status === 429) {
        showToast('Too many requests. Please slow down.', 'error');
      } else {
        showToast(err?.message || 'Unable to update like', 'error');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCommentsOpen(true);
  };

  const handleOpenReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReportOpen(true);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Asynchronously notify backend share endpoint for tracking (non-blocking)
    api.post(`/api/reels/${item.id}/share`).catch(() => {});

    const result = await shareReel({
      reelId: item.id,
      title: item.caption || item.property?.title || 'FairBnB Reel',
      text: `Check out this Reel tour by ${item.creator.name} on FairBnB!`,
    });

    if (result.success) {
      if (result.method === 'clipboard') {
        showToast('Link copied to clipboard!', 'success');
      }
    } else if (!result.cancelled) {
      showToast(result.error || 'Unable to share reel', 'error');
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 md:p-4 snap-start snap-always">
      <div className="relative w-full max-w-sm h-full max-h-[800px] flex flex-col justify-center">
        {/* Reel Player with direct videoUrl fallback & hideOverlay to eliminate duplicates */}
        <ReelPlayer
          reel={item}
          autoPlay={autoPlay}
          muted={isMuted}
          hideOverlay={true}
          isOverlayOpen={isCommentsOpen || isReportOpen || isBookingOpen}
          className="w-full h-full"
        />

        {/* Top Header: Creator Info (Left) + Mute & Report (Right) */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
          <Link
            href={`/hosts/${item.creator.id}`}
            className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-auto border border-white/20 hover:bg-[#0e4962]/80 transition-all shadow-md active:scale-95"
          >
            {item.creator.avatarUrl ? (
              <img
                src={item.creator.avatarUrl}
                alt={item.creator.name}
                className="w-6 h-6 rounded-full object-cover border border-[#38bdf8]"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#0e4962] flex items-center justify-center text-white text-xs font-bold border border-white/25">
                {item.creator.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-white text-xs font-semibold truncate max-w-[120px] drop-shadow-sm">
              {item.creator.name}
            </span>
          </Link>

          {/* Top-Right Controls: Mute Toggle & Report */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="p-2 bg-black/45 hover:bg-[#0e4962]/80 text-white rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/20 shadow-md"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#38bdf8]" />
              )}
            </button>

            <button
              onClick={handleOpenReport}
              aria-label="Report reel"
              className="p-2 bg-black/45 hover:bg-[#0e4962]/80 text-gray-200 hover:text-rose-400 rounded-full backdrop-blur-md transition-all active:scale-90 border border-white/20 shadow-md"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unified Bottom Info Overlay (Constrained with pr-18 so it never overlaps right action buttons) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 pb-5 pr-18 z-20 pointer-events-none flex flex-col justify-end gap-2">
          {/* Tagged Listing Badge with Attribution & Booking Availability Drawer */}
          {item.property && (
            <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
              <Link
                href={`/properties/${item.property.id}`}
                onClick={() => {
                  api
                    .post(`/api/reels/${item.id}/events`, {
                      eventType: 'LISTING_CLICK',
                      sessionId: item.sessionId || `session_${item.id}`,
                      propertyId: item.property?.id,
                    })
                    .catch(() => {});
                }}
                className="inline-flex items-center gap-1.5 bg-[#0e4962]/90 hover:bg-[#0e4962] text-white px-3 py-1.5 rounded-full backdrop-blur-md border border-white/25 text-xs transition-all shadow-lg active:scale-95 group max-w-full"
              >
                <Home className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <span className="font-semibold truncate max-w-[120px] sm:max-w-[150px] group-hover:text-cyan-200 transition-colors">
                  {item.property.title}
                </span>
                {item.property.city && (
                  <span className="text-caption text-white/80 shrink-0">
                    • {item.property.city}
                  </span>
                )}
                {item.property.pricePerNight && (
                  <span className="text-[#67e8f9] font-semibold font-tabular text-caption shrink-0 ml-0.5">
                    From ₹{item.property.pricePerNight.toLocaleString('en-IN')}/night
                  </span>
                )}
              </Link>

              {process.env.NEXT_PUBLIC_ENABLE_REELS_BOOKING_DRAWER !== 'false' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBookingOpen(true);
                  }}
                  aria-label="Check stay availability"
                  className="inline-flex items-center gap-1 bg-[#38bdf8] hover:bg-[#0284c7] text-gray-950 font-bold px-3 py-1 rounded-full text-xs shadow-md transition-all active:scale-95 shrink-0"
                >
                  Check Dates
                </button>
              )}
            </div>
          )}

          {/* Reel Caption */}
          {item.caption && (
            <p className="text-white text-body-sm font-normal line-clamp-2 leading-snug drop-shadow-md pointer-events-auto select-text">
              {item.caption}
            </p>
          )}
        </div>

        {/* Engagement Actions Side Column (Like, Comment & Share) */}
        <div className="absolute right-3.5 bottom-6 sm:right-4 sm:bottom-8 flex flex-col items-center gap-3.5 z-20 pointer-events-auto">
          {/* Like Action */}
          <button
            onClick={handleToggleLike}
            aria-label={isLiked ? 'Unlike reel' : 'Like reel'}
            aria-pressed={isLiked}
            disabled={isLiking}
            className="flex flex-col items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] rounded-full"
          >
            <div
              className={`p-2.5 sm:p-3 rounded-full backdrop-blur-md border transition-all active:scale-90 shadow-lg ${
                isLiked
                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                  : 'bg-black/45 hover:bg-[#0e4962]/80 text-white border-white/20'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                }`}
              />
            </div>
            <span className="text-white text-caption font-semibold font-tabular drop-shadow-md">
              {likeCount}
            </span>
          </button>

          {/* Comment Action */}
          <button
            onClick={handleOpenComments}
            aria-label="Open comments"
            className="flex flex-col items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] rounded-full"
          >
            <div className="p-2.5 sm:p-3 bg-black/45 hover:bg-[#0e4962]/80 text-white rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-90 shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-caption font-semibold font-tabular drop-shadow-md">
              {commentCount}
            </span>
          </button>

          {/* Share Action */}
          <button
            onClick={handleShare}
            aria-label="Share reel"
            className="flex flex-col items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] rounded-full"
          >
            <div className="p-2.5 sm:p-3 bg-black/45 hover:bg-[#0e4962]/80 text-white rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-90 shadow-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-caption font-semibold drop-shadow-md">
              Share
            </span>
          </button>
        </div>

        {/* Feedback Toast Notification Banner */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md shadow-xl flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              toastType === 'success'
                ? 'bg-[#0e4962]/95 text-cyan-200 border-[#38bdf8]/40'
                : 'bg-rose-950/95 text-rose-300 border-rose-500/40'
            }`}
          >
            {toastType === 'success' ? (
              <Check className="w-4 h-4 text-[#38bdf8] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Comments Sheet Modal */}
        <ReelCommentsModal
          reelId={item.id}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          onCommentAdded={() => setCommentCount((prev) => prev + 1)}
          onCommentDeleted={() =>
            setCommentCount((prev) => Math.max(0, prev - 1))
          }
        />

        {/* Report Confirmation Modal */}
        <ReelReportModal
          reelId={item.id}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />

        {/* Reel Direct Booking Availability Modal */}
        {item.property && process.env.NEXT_PUBLIC_ENABLE_REELS_BOOKING_DRAWER !== 'false' && (
          <ReelBookingModal
            isOpen={isBookingOpen}
            onClose={() => setIsBookingOpen(false)}
            property={item.property}
            reelId={item.id}
          />
        )}
      </div>
    </div>
  );
}

