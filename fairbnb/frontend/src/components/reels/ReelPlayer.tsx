'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  AlertCircle,
  MapPin,
  Home,
} from 'lucide-react';
import { emitReelPlay, subscribeReelPlay } from './reel-registry';
import { api } from '@/lib/api-client';


export interface ReelPlayerData {
  id: string;
  hlsUrl: string;
  posterUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  sessionId?: string;
  property?: {
    id: string;
    title: string;
    city?: string;
    pricePerNight?: number;
  } | null;
}

export interface ReelPlayerProps {
  reel: ReelPlayerData;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  onEnded?: () => void;
  hideOverlay?: boolean;
  isOverlayOpen?: boolean;
}

export function ReelPlayer({
  reel,
  autoPlay = true,
  muted = true,
  className = '',
  onEnded,
  hideOverlay = false,
  isOverlayOpen = false,
}: ReelPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  // Sync external muted prop
  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Synchronous ref to prevent stale in-flight play promises from violating pause state
  const isEligibleRef = useRef(false);
  isEligibleRef.current =
    isIntersecting && !userPaused && !isOverlayOpen && !hasError && autoPlay;

  // Mount tracking ref to prevent reviving unmounted player
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Phase 9 Analytics Instrumentation Refs
  const sessionIdRef = useRef<string | null>(null);
  const hasEmittedPlayStartedRef = useRef<boolean>(false);
  const emittedMilestonesRef = useRef<Set<number>>(new Set());

  // Non-blocking analytics event helper
  const sendAnalyticsEvent = useCallback(
    (
      eventType: 'PLAY_STARTED' | 'PLAY_PROGRESS' | 'PLAY_COMPLETED',
      positionSeconds?: number,
      durationSeconds?: number,
      progressPercent?: number,
    ) => {
      if (!sessionIdRef.current || !reel.id) return;
      api
        .post(`/api/reels/${reel.id}/events`, {
          eventType,
          sessionId: sessionIdRef.current,
          positionSeconds: positionSeconds ? Number(positionSeconds.toFixed(1)) : 0,
          durationSeconds: durationSeconds ? Number(durationSeconds.toFixed(1)) : (reel.duration || 0),
          progressPercent: progressPercent ? Math.min(100, Math.round(progressPercent)) : 0,
        })
        .catch(() => {}); // Non-blocking; video playback is never delayed by analytics
    },
    [reel.id, reel.duration],
  );

  // Clean up HLS instance
  const destroyHls = useCallback(() => {
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }
  }, []);

  // Initialize and attach HLS stream or direct videoUrl
  const initializeHls = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // If valid HLS url is provided, use HLS
    const hasHlsUrl = Boolean(reel.hlsUrl && reel.hlsUrl.trim() !== '' && !reel.hlsUrl.endsWith('.mp4'));

    if (hasHlsUrl) {
      // Check if Native HLS is supported (Safari / iOS Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = reel.hlsUrl;
        return;
      }

      // Check if HLS.js is supported (Chrome / Firefox / Edge / Android)
      if (Hls.isSupported()) {
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
        }

        const navConn = typeof navigator !== 'undefined' ? (navigator as any)?.connection : null;
        const isDataSaver =
          navConn?.saveData ||
          navConn?.effectiveType === '2g' ||
          navConn?.effectiveType === '3g' ||
          (typeof window !== 'undefined' && sessionStorage.getItem('fairbnb_data_saver') === 'true');

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          capLevelToPlayerSize: true,
          startLevel: isDataSaver ? 0 : -1,
          maxBufferLength: isDataSaver ? 8 : 25,
          maxMaxBufferLength: isDataSaver ? 15 : 50,
          backBufferLength: 10,
        });

        hls.loadSource(reel.hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          if (isDataSaver && data?.levels && data.levels.length > 0) {
            let minBitrateIdx = 0;
            let minBitrate = Infinity;
            data.levels.forEach((lvl: any, idx: number) => {
              const br = lvl.bitrate || Infinity;
              if (br < minBitrate) {
                minBitrate = br;
                minBitrateIdx = idx;
              }
            });
            hls.currentLevel = minBitrateIdx;
            hls.loadLevel = minBitrateIdx;
          }
          setIsBuffering(false);
          setHasError(false);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (retryCount < 2) {
                  setRetryCount((prev) => prev + 1);
                  hls.startLoad();
                } else if (reel.videoUrl) {
                  // Fallback to direct MP4 on HLS network error
                  destroyHls();
                  video.src = reel.videoUrl;
                  video.load();
                } else {
                  setHasError(true);
                  setErrorMessage('Network error during video stream');
                  setIsBuffering(false);
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                if (reel.videoUrl) {
                  destroyHls();
                  video.src = reel.videoUrl;
                  video.load();
                } else {
                  setHasError(true);
                  setErrorMessage('Playback stream error');
                  setIsBuffering(false);
                }
                break;
            }
          }
        });

        hlsInstanceRef.current = hls;
        return;
      }
    }

    // Direct MP4 / videoUrl playback (Primary when hlsUrl is empty, or fallback)
    const directUrl = reel.videoUrl || (reel.hlsUrl && reel.hlsUrl.endsWith('.mp4') ? reel.hlsUrl : null);
    if (directUrl) {
      if (video.src !== directUrl && !video.src.endsWith(directUrl)) {
        video.src = directUrl;
        video.load();
      }
      setIsBuffering(false);
      setHasError(false);
      return;
    }

    setHasError(true);
    setErrorMessage('No video stream available');
    setIsBuffering(false);
  }, [reel.hlsUrl, reel.videoUrl, retryCount, destroyHls]);

  // Safe playback execution helper with race-condition & autoplay-policy guards
  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (
      !isMountedRef.current ||
      !isEligibleRef.current ||
      (typeof document !== 'undefined' && document.hidden)
    ) {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
      return;
    }

    emitReelPlay(reel.id);
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Double check eligibility has not changed while play() promise was resolving
          if (
            !isMountedRef.current ||
            !isEligibleRef.current ||
            (typeof document !== 'undefined' && document.hidden)
          ) {
            video.pause();
            setIsPlaying(false);
          } else {
            setIsPlaying(true);
            setIsAutoplayBlocked(false);
            setHasError(false);
          }
        })
        .catch((err: any) => {
          if (err?.name === 'AbortError') {
            return;
          }
          // Autoplay denied: attempt muted fallback as per browser policies
          video.muted = true;
          setIsMuted(true);
          const mutedPromise = video.play();
          if (mutedPromise !== undefined) {
            mutedPromise
              .then(() => {
                if (
                  !isEligibleRef.current ||
                  (typeof document !== 'undefined' && document.hidden)
                ) {
                  video.pause();
                  setIsPlaying(false);
                } else {
                  setIsPlaying(true);
                  setIsAutoplayBlocked(false);
                  setHasError(false);
                }
              })
              .catch((mutedErr: any) => {
                if (mutedErr?.name !== 'AbortError') {
                  setIsPlaying(false);
                  setIsAutoplayBlocked(true);
                }
              });
          }
        });
    }
  }, [reel.id]);

  // Handle single active Reel play coordination
  useEffect(() => {
    const unsubscribe = subscribeReelPlay((activeId) => {
      if (activeId !== reel.id && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    });
    return unsubscribe;
  }, [reel.id]);

  // Viewport IntersectionObserver for lazy initialization and autoplay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const intersecting = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        setIsIntersecting(intersecting);

        const video = videoRef.current;
        if (!video) return;

        if (intersecting) {
          // Initialize analytics session ID when entering viewport
          if (!sessionIdRef.current) {
            sessionIdRef.current = `sess_${Math.random().toString(36).substring(2)}${Date.now()}`;
            hasEmittedPlayStartedRef.current = false;
            emittedMilestonesRef.current.clear();
          }

          // Initialize HLS lazily upon entering viewport
          if (!hlsInstanceRef.current && !video.src) {
            initializeHls();
          }

          if (
            autoPlay &&
            !userPaused &&
            !isOverlayOpen &&
            (typeof document === 'undefined' || !document.hidden) &&
            !hasError
          ) {
            safePlay();
          }
        } else {
          // Pause when scrolling out of viewport (< 50% visible) and reset session
          if (!video.paused) {
            video.pause();
            setIsPlaying(false);
          }
          sessionIdRef.current = null;
          hasEmittedPlayStartedRef.current = false;
          emittedMilestonesRef.current.clear();
        }
      },
      { threshold: [0, 0.5, 1.0] },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [autoPlay, userPaused, isOverlayOpen, hasError, initializeHls, safePlay, reel.id]);

  // Tab Visibility change listener (pause background tab, resume foreground tab if eligible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) return;

      if (document.hidden) {
        if (!video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      } else {
        if (
          isIntersecting &&
          !userPaused &&
          !isOverlayOpen &&
          !hasError &&
          autoPlay
        ) {
          safePlay();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isIntersecting, userPaused, isOverlayOpen, hasError, autoPlay, safePlay]);

  // Overlay / Modal (Comments / Report) open & close handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isOverlayOpen) {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
    } else {
      if (
        isIntersecting &&
        !userPaused &&
        (typeof document === 'undefined' || !document.hidden) &&
        !hasError &&
        autoPlay
      ) {
        safePlay();
      }
    }
  }, [isOverlayOpen, isIntersecting, userPaused, hasError, autoPlay, safePlay]);

  // Component unmount cleanup
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      destroyHls();
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [destroyHls]);

  // Video element media event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    setIsBuffering(false);
    emitReelPlay(reel.id);

    // Emit PLAY_STARTED analytics event once per session
    if (!sessionIdRef.current) {
      sessionIdRef.current = `sess_${Math.random().toString(36).substring(2)}${Date.now()}`;
    }
    if (!hasEmittedPlayStartedRef.current) {
      hasEmittedPlayStartedRef.current = true;
      const video = videoRef.current;
      sendAnalyticsEvent(
        'PLAY_STARTED',
        video?.currentTime || 0,
        video?.duration || reel.duration || 0,
        0,
      );
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration || video.duration === 0) return;

    const progress = (video.currentTime / video.duration) * 100;
    const milestones = [25, 50, 75];

    for (const m of milestones) {
      if (progress >= m && !emittedMilestonesRef.current.has(m)) {
        emittedMilestonesRef.current.add(m);
        sendAnalyticsEvent('PLAY_PROGRESS', video.currentTime, video.duration, m);
      }
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleWaiting = () => {
    if (
      isEligibleRef.current &&
      (typeof document === 'undefined' || !document.hidden)
    ) {
      setIsBuffering(true);
    }
  };

  const handlePlaying = () => {
    setIsBuffering(false);
    setIsPlaying(true);
    setHasError(false);
  };

  const handleError = () => {
    setIsBuffering(false);
    if (retryCount < 2) {
      setRetryCount((prev) => prev + 1);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().catch(() => {});
        }
      }, 1000);
    } else {
      setHasError(true);
      setErrorMessage('Unable to load video stream');
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    const video = videoRef.current;
    if (video && !emittedMilestonesRef.current.has(100)) {
      emittedMilestonesRef.current.add(100);
      sendAnalyticsEvent(
        'PLAY_COMPLETED',
        video.duration || reel.duration || 0,
        video.duration || reel.duration || 0,
        100,
      );
    }
    if (onEnded) onEnded();
  };


  // User interactions
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying || !video.paused) {
      video.pause();
      setUserPaused(true);
      setIsPlaying(false);
    } else {
      setUserPaused(false);
      setIsAutoplayBlocked(false);
      safePlay();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setErrorMessage('');
    setRetryCount(0);
    setIsBuffering(true);
    destroyHls();
    initializeHls();
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'm') {
      e.preventDefault();
      const video = videoRef.current;
      if (video) {
        video.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    } else if (e.key === 'f') {
      e.preventDefault();
      toggleFullscreen(e as any);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={`FairBnB Reel: ${reel.caption || 'Property Reel'}`}
      onKeyDown={handleKeyDown}
      onClick={togglePlayPause}
      className={`relative overflow-hidden bg-black rounded-2xl select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e4962] cursor-pointer aspect-[9/16] max-w-sm mx-auto shadow-2xl ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        loop
        preload="auto"
        muted={isMuted}
        poster={reel.posterUrl || undefined}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onCanPlay={() => setIsBuffering(false)}
        onLoadedData={() => setIsBuffering(false)}
        onLoadedMetadata={() => setIsBuffering(false)}
        onError={handleError}
        onEnded={handleEnded}
        className="w-full h-full object-cover"
      />

      {/* Subtle Buffering Indicator (Video remains visible underneath) */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px] pointer-events-none transition-opacity duration-200">
          <div className="flex flex-col items-center gap-2 p-3 bg-black/70 rounded-full border border-white/10 shadow-lg">
            <div className="w-8 h-8 border-3 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Bounded Error & Retry UI */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-20">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-2 animate-bounce" />
          <p className="text-white text-sm font-medium mb-4">
            {errorMessage || 'Unable to play video'}
          </p>
          <button
            onClick={handleRetry}
            aria-label="Retry video playback"
            className="flex items-center gap-2 px-4 py-2 bg-[#0e4962] hover:bg-[#165a78] text-white font-semibold text-xs rounded-full transition-all shadow-lg active:scale-95 border border-white/15"
          >
            <RotateCcw className="w-4 h-4" />
            Tap to Retry
          </button>
        </div>
      )}

      {/* Play / Pause Center Flash & Tap-to-Play Indicator */}
      {(!isPlaying || isAutoplayBlocked) && !isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none transition-opacity">
          <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md shadow-xl border border-white/15">
            <Play className="w-7 h-7 ml-1 fill-white text-white" />
          </div>
        </div>
      )}

      {/* Standalone Bottom Information Gradient & Controls (Only if hideOverlay is false) */}
      {!hideOverlay && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end gap-2 z-10">
          {/* Property Badge Tag (if attached) */}
          {reel.property && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0e4962]/80 backdrop-blur-md rounded-full text-white text-xs font-medium w-fit border border-white/20">
              <Home className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="truncate max-w-[180px]">{reel.property.title}</span>
              {reel.property.pricePerNight && (
                <span className="text-[#67e8f9] font-semibold ml-1">
                  ₹{reel.property.pricePerNight.toLocaleString('en-IN')}/night
                </span>
              )}
            </div>
          )}

          {/* Caption */}
          {reel.caption && (
            <p className="text-white text-xs leading-snug font-normal line-clamp-2 drop-shadow-sm">
              {reel.caption}
            </p>
          )}

          {/* Control Buttons Bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="p-2 bg-black/40 hover:bg-[#0e4962]/70 text-white rounded-full backdrop-blur-md transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] border border-white/10"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#38bdf8]" />
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              aria-label={
                isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
              }
              className="p-2 bg-black/40 hover:bg-[#0e4962]/70 text-white rounded-full backdrop-blur-md transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] border border-white/10"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
