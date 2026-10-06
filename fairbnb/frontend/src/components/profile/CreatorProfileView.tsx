'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { ReelPlayer } from '@/components/reels/ReelPlayer';
import { shareReel } from '@/components/reels/share-utils';
import {
  Home,
  Film,
  Star,
  Sparkles,
  Calendar,
  Play,
  Heart,
  MessageCircle,
  X,
  Loader2,
  AlertCircle,
  Share2,
  Check,
} from 'lucide-react';

export interface HostProfileData {
  host: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    bio?: string | null;
    isSuperhost?: boolean;
    joinedAt?: string;
  };
  stats: {
    totalListings: number;
    averageRating: number;
    totalReviews: number;
  };
  listings: Array<{
    id: string;
    title: string;
    city?: string;
    state?: string;
    basePrice: number;
    coverImage?: string | null;
    images?: string[];
  }>;
}

export interface CreatorReelItem {
  id: string;
  hlsUrl: string;
  posterUrl?: string | null;
  videoUrl?: string | null;
  caption?: string | null;
  likeCount?: number;
  commentCount?: number;
  duration?: number | null;
  publishedAt?: string;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  property?: {
    id: string;
    title: string;
    pricePerNight?: number;
  } | null;
}

export interface CreatorProfileViewProps {
  hostId: string;
  initialData?: HostProfileData;
}

export function CreatorProfileView({
  hostId,
  initialData,
}: CreatorProfileViewProps) {
  const [data, setData] = useState<HostProfileData | null>(
    initialData || null,
  );
  const [activeTab, setActiveTab] = useState<'listings' | 'reels'>('listings');
  const [reels, setReels] = useState<CreatorReelItem[]>([]);
  const [reelsCursor, setReelsCursor] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(
    !initialData,
  );
  const [isLoadingReels, setIsLoadingReels] = useState<boolean>(false);
  const [isLoadingMoreReels, setIsLoadingMoreReels] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reelsError, setReelsError] = useState<string | null>(null);
  const [selectedReel, setSelectedReel] = useState<CreatorReelItem | null>(
    null,
  );
  const [modalToast, setModalToast] = useState<string | null>(null);

  const showModalToast = (msg: string) => {
    setModalToast(msg);
    setTimeout(() => {
      setModalToast(null);
    }, 3000);
  };

  const handleShareSelectedReel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedReel) return;

    api.post(`/api/reels/${selectedReel.id}/share`).catch(() => {});

    const result = await shareReel({
      reelId: selectedReel.id,
      title: selectedReel.caption || selectedReel.property?.title || 'FairBnB Reel',
      text: `Check out this Reel tour on FairBnB!`,
    });

    if (result.success && result.method === 'clipboard') {
      showModalToast('Link copied to clipboard!');
    } else if (!result.success && !result.cancelled) {
      showModalToast(result.error || 'Failed to share reel');
    }
  };

  // Fetch host profile & listings if not provided via SSR
  useEffect(() => {
    let active = true;
    if (!initialData && hostId) {
      queueMicrotask(() => {
        if (!active) return;
        setIsLoadingProfile(true);
        setProfileError(null);
        api
          .get<HostProfileData>(`/hosts/profile/${hostId}`)
          .then((res) => {
            if (active) setData(res);
          })
          .catch((err: unknown) => {
            if (active)
              setProfileError(
                (err as { message?: string })?.message ||
                  'Unable to load creator profile.',
              );
          })
          .finally(() => {
            if (active) setIsLoadingProfile(false);
          });
      });
    }
    return () => {
      active = false;
    };
  }, [initialData, hostId]);

  const fetchReels = async () => {
    if (!hostId) return;
    setIsLoadingReels(true);
    setReelsError(null);
    try {
      const res = await api.get<{
        items: CreatorReelItem[];
        nextCursor: string | null;
      }>(`/api/reels/creator/${hostId}?limit=12`);
      setReels(res.items || []);
      setReelsCursor(res.nextCursor || null);
    } catch (err: unknown) {
      setReelsError(
        (err as { message?: string })?.message ||
          'Failed to load creator Reels.',
      );
    } finally {
      setIsLoadingReels(false);
    }
  };

  const loadMoreReels = async () => {
    if (!hostId || !reelsCursor || isLoadingMoreReels) return;
    setIsLoadingMoreReels(true);
    try {
      const res = await api.get<{
        items: CreatorReelItem[];
        nextCursor: string | null;
      }>(
        `/api/reels/creator/${hostId}?limit=12&cursor=${encodeURIComponent(
          reelsCursor,
        )}`,
      );
      setReels((prev) => {
        const existing = new Set(prev.map((r) => r.id));
        const filtered = (res.items || []).filter((r) => !existing.has(r.id));
        return [...prev, ...filtered];
      });
      setReelsCursor(res.nextCursor || null);
    } catch {
      // Non-fatal pagination error
    } finally {
      setIsLoadingMoreReels(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (activeTab === 'reels' && reels.length === 0 && hostId) {
      queueMicrotask(() => {
        if (!active) return;
        void fetchReels();
      });
    }
    return () => {
      active = false;
    };
  }, [activeTab, reels.length, hostId]);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-gray-400 text-xs">Loading creator profile...</p>
      </div>
    );
  }

  if (profileError || !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold mb-1">Profile Not Found</h2>
        <p className="text-gray-400 text-xs max-w-xs mb-4">
          {profileError || 'This creator profile does not exist or has been removed.'}
        </p>
        <Link
          href="/search"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-full transition-all"
        >
          Explore Listings
        </Link>
      </div>
    );
  }

  const { host, stats, listings } = data;
  const joinedYear = host.joinedAt
    ? new Date(host.joinedAt).getFullYear()
    : '2023';

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Profile Card Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative shrink-0">
              {host.avatarUrl ? (
                <img
                  src={host.avatarUrl}
                  alt={host.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-emerald-500/50 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-700 text-white font-bold text-3xl flex items-center justify-center border-2 border-emerald-500/50 shadow-lg">
                  {host.name.charAt(0).toUpperCase()}
                </div>
              )}
              {host.isSuperhost && (
                <div
                  title="Superhost"
                  className="absolute -bottom-1 -right-1 bg-amber-500 text-gray-950 rounded-full p-1.5 shadow-md"
                >
                  <Sparkles className="w-4 h-4 fill-gray-950" />
                </div>
              )}
            </div>

            {/* Host Info */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {host.name}
                  </h1>
                  {host.isSuperhost && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-overline font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-3 h-3" /> Superhost
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>Joined in {joinedYear}</span>
                </p>
              </div>

              {host.bio && (
                <p className="text-gray-300 text-xs leading-relaxed max-w-2xl">
                  {host.bio}
                </p>
              )}

              {/* Stats Bar */}
              <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 text-xs border-t border-gray-800">
                <div>
                  <span className="font-bold text-base text-white block">
                    {stats.totalListings}
                  </span>
                  <span className="text-gray-400">Listings</span>
                </div>
                <div className="h-6 w-px bg-gray-800" />
                <div>
                  <span className="font-bold text-base text-white flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 inline" />
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-400">Rating</span>
                </div>
                <div className="h-6 w-px bg-gray-800" />
                <div>
                  <span className="font-bold text-base text-white block">
                    {stats.totalReviews}
                  </span>
                  <span className="text-gray-400">Reviews</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-gray-800 mb-8" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'listings'}
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs transition-all relative border-b-2 ${
              activeTab === 'listings'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Listings ({listings.length})</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'reels'}
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs transition-all relative border-b-2 ${
              activeTab === 'reels'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Film className="w-4 h-4 text-emerald-400" />
            <span>Reels</span>
          </button>
        </div>

        {/* TAB 1: LISTINGS */}
        {activeTab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-400 text-xs">
                <Home className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                This creator has no public listings at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <Link
                    key={item.id}
                    href={`/properties/${item.id}`}
                    className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all shadow-lg flex flex-col"
                  >
                    <div className="relative aspect-[4/3] bg-gray-800 overflow-hidden">
                      {item.coverImage || (item.images && item.images[0]) ? (
                        <img
                          src={item.coverImage || item.images![0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Home className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        {item.city && (
                          <p className="text-gray-400 text-xs">
                            {item.city}
                            {item.state ? `, ${item.state}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-xs">
                          ${item.basePrice}{' '}
                          <span className="text-gray-400 font-normal">
                            / night
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REELS */}
        {activeTab === 'reels' && (
          <div>
            {isLoadingReels ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                Loading creator Reels...
              </div>
            ) : reelsError ? (
              <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-center text-rose-300 text-xs flex flex-col items-center gap-3">
                <AlertCircle className="w-6 h-6 text-rose-400" />
                <span>{reelsError}</span>
                <button
                  onClick={fetchReels}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : reels.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-400 text-xs">
                <Film className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                No Reels Yet.
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => setSelectedReel(reel)}
                      className="group relative aspect-[9/16] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all shadow-lg"
                    >
                      {reel.posterUrl ? (
                        <img
                          src={reel.posterUrl}
                          alt={reel.caption || 'Creator Reel'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                          <Film className="w-10 h-10" />
                        </div>
                      )}

                      {/* Overlay Play Icon Badge */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 text-xs flex flex-col justify-end gap-1">
                        {reel.caption && (
                          <p className="text-white text-xs font-medium line-clamp-1 drop-shadow-sm">
                            {reel.caption}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-caption text-gray-300 font-semibold font-tabular">
                          {reel.likeCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                              {reel.likeCount}
                            </span>
                          )}
                          {reel.commentCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-emerald-400" />
                              {reel.commentCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cursor Pagination Load More */}
                {reelsCursor && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={loadMoreReels}
                      disabled={isLoadingMoreReels}
                      className="px-6 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white text-xs font-semibold rounded-full transition-all shadow-md flex items-center gap-2"
                    >
                      {isLoadingMoreReels ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          Loading...
                        </>
                      ) : (
                        'Load More Reels'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reel Player Modal Overlay when Reel selected */}
      {selectedReel && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedReel(null)}
          role="dialog"
          aria-label="Reel Viewer"
        >
          <div
            className="relative w-full max-w-sm max-h-[85vh] flex flex-col justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-2 z-30">
              <button
                onClick={handleShareSelectedReel}
                aria-label="Share reel"
                className="p-2 bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedReel(null)}
                aria-label="Close Reel viewer"
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Toast Notification */}
            {modalToast && (
              <div
                role="status"
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{modalToast}</span>
              </div>
            )}

            <ReelPlayer
              reel={{
                id: selectedReel.id,
                hlsUrl: selectedReel.hlsUrl,
                posterUrl: selectedReel.posterUrl,
                videoUrl: selectedReel.videoUrl,
                caption: selectedReel.caption,
                property: selectedReel.property,
              }}
              autoPlay={true}
              muted={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
