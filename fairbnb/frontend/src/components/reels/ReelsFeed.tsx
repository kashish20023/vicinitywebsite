'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { ReelFeedCard, ReelFeedItem } from './ReelFeedCard';
import { Film, RotateCcw, Sparkles } from 'lucide-react';
import { subscribeReelPlay } from './reel-registry';
import { prefetchManager } from './prefetch-manager';

export interface ReelsFeedProps {
  initialItems?: ReelFeedItem[];
  initialNextCursor?: string | null;
}

export function ReelsFeed({ initialItems, initialNextCursor }: ReelsFeedProps) {
  const [items, setItems] = useState<ReelFeedItem[]>(initialItems || []);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor !== undefined ? initialNextCursor : null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialItems);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch initial feed items
  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{
        items: ReelFeedItem[];
        nextCursor: string | null;
      }>('/reels?limit=10');

      let feedItems = response.items || [];
      if (typeof window !== 'undefined' && window.location?.search) {
        const params = new URLSearchParams(window.location.search);
        const targetReelId = params.get('reel');
        if (targetReelId) {
          const matchIndex = feedItems.findIndex((item) => item.id === targetReelId);
          if (matchIndex > 0) {
            const target = feedItems[matchIndex];
            feedItems = [target, ...feedItems.filter((_, i) => i !== matchIndex)];
          }
        }
      }

      setItems(feedItems);
      setNextCursor(response.nextCursor || null);
    } catch (err: any) {
      setError(
        err?.message || 'Unable to load Reels feed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch next page via cursor pagination
  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await api.get<{
        items: ReelFeedItem[];
        nextCursor: string | null;
      }>(`/reels?limit=10&cursor=${encodeURIComponent(nextCursor)}`);

      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newUniqueItems = (response.items || []).filter(
          (item) => !existingIds.has(item.id),
        );
        return [...prev, ...newUniqueItems];
      });

      setNextCursor(response.nextCursor || null);
    } catch (err) {
      // Non-fatal background fetch error
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore]);

  // Initial load effect if not pre-populated
  useEffect(() => {
    if (!initialItems) {
      fetchFeed();
    }
  }, [initialItems, fetchFeed]);

  // Coordinate active reel URL synchronization and controlled next-reel prefetch
  useEffect(() => {
    const unsubscribe = subscribeReelPlay((activeReelId) => {
      // 1. Synchronize URL query parameter for return context & deep link sharing
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('reel', activeReelId);
        window.history.replaceState(null, '', url.toString());
      }

      // 2. Controlled bounded next-reel prefetch
      const activeIdx = items.findIndex((it) => it.id === activeReelId);
      if (activeIdx >= 0 && activeIdx + 1 < items.length) {
        prefetchManager.prefetchNextReel(items[activeIdx + 1]);
      }
    });

    return () => {
      unsubscribe();
      prefetchManager.cancelPrefetch();
    };
  }, [items]);

  // Infinite scroll observer for pagination sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [nextCursor, isLoadingMore, loadMore]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-sm h-full max-h-[750px] bg-gray-900 rounded-2xl animate-pulse flex flex-col justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-full" />
            <div className="w-32 h-4 bg-gray-800 rounded" />
          </div>
          <div className="space-y-3">
            <div className="w-3/4 h-4 bg-gray-800 rounded" />
            <div className="w-1/2 h-4 bg-gray-800 rounded" />
          </div>
        </div>
        <p className="text-gray-400 text-xs mt-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#38bdf8] animate-spin" />
          Loading FairBnB Reels...
        </p>
      </div>
    );
  }

  // Error State with Retry / Disabled Display
  if (error) {
    const isDisabled = error.toLowerCase().includes('disabled');
    return (
      <div className="w-full h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isDisabled ? 'bg-amber-950/50 border border-amber-800 text-amber-400' : 'bg-rose-950/50 border border-rose-800 text-rose-400'
        }`}>
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-white text-base font-semibold mb-2">
          {isDisabled ? 'Reels Currently Unavailable' : 'Unable to Load Reels'}
        </h3>
        <p className="text-gray-400 text-xs max-w-xs mb-6">
          {isDisabled
            ? 'FairBnB Reels discovery is currently disabled by Platform Administration. Please check back later.'
            : error}
        </p>
        {!isDisabled && (
          <button
            onClick={fetchFeed}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0e4962] hover:bg-[#165a78] text-white font-medium text-xs rounded-full transition-all shadow-lg active:scale-95 border border-white/15"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty State (No published Reels)
  if (items.length === 0) {
    return (
      <div className="w-full h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#0e4962]/40 border border-[#0e4962]/60 rounded-full flex items-center justify-center mb-4 text-[#38bdf8]">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-white text-base font-semibold mb-2">
          No Reels Yet
        </h3>
        <p className="text-gray-400 text-xs max-w-sm">
          Discover short-form video tours of unique stays and experiences from
          FairBnB hosts here.
        </p>
      </div>
    );
  }

  return (
    <div
      role="feed"
      aria-label="FairBnB Reels Feed"
      className="w-full h-screen bg-gray-950 overflow-y-auto snap-y snap-mandatory scroll-smooth"
    >
      {items.map((item) => (
        <ReelFeedCard key={item.id} item={item} autoPlay={true} />
      ))}

      {/* Sentinel for infinite scroll pagination */}
      <div ref={sentinelRef} className="h-10 w-full flex items-center justify-center">
        {isLoadingMore && (
          <div className="w-6 h-6 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
