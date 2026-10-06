/**
 * FairBnB Controlled Next-Reel Prefetch Manager
 *
 * Implements bounded, resource-conscious prefetching for subsequent Reels:
 * 1. Only prefetches the immediate next reel (index + 1) poster and manifest.
 * 2. Never downloads full video chunks or heavy media for unseen reels.
 * 3. Immediately cancels in-flight prefetch requests on rapid swipe / navigation via AbortController.
 * 4. Respects Data-Saver mode (Save-Data header, 2G/3G connections, or user toggle).
 * 5. Can be globally toggled via NEXT_PUBLIC_ENABLE_REELS_PREFETCH.
 */

import { ReelPlayerData } from './ReelPlayer';

export interface PrefetchMetrics {
  prefetchedCount: number;
  cancelledCount: number;
  prefetchedBytes: number;
  dataSaverSkippedCount: number;
}

class PrefetchManager {
  private activeAbortController: AbortController | null = null;
  private prefetchedUrls = new Set<string>();
  private metrics: PrefetchMetrics = {
    prefetchedCount: 0,
    cancelledCount: 0,
    prefetchedBytes: 0,
    dataSaverSkippedCount: 0,
  };

  /**
   * Check whether prefetch is globally enabled via environment or config.
   */
  public isPrefetchEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    if (process.env.NEXT_PUBLIC_ENABLE_REELS_PREFETCH === 'false') {
      return false;
    }
    return !this.isDataSaverEnabled();
  }

  /**
   * Check whether Data-Saver mode is active via Network Information API,
   * Save-Data client hint, or sessionStorage preference.
   */
  public isDataSaverEnabled(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const explicitSaver = sessionStorage.getItem('fairbnb_data_saver');
      if (explicitSaver !== null) {
        return explicitSaver === 'true';
      }
    } catch {}

    const navConn = (navigator as any)?.connection;
    if (navConn) {
      if (navConn.saveData === true) return true;
      if (navConn.effectiveType === '2g' || navConn.effectiveType === '3g') {
        return true;
      }
    }

    return false;
  }

  /**
   * Explicitly toggle Data Saver mode in user session.
   */
  public setDataSaver(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('fairbnb_data_saver', enabled ? 'true' : 'false');
    } catch {}
    if (enabled) {
      this.cancelPrefetch();
    }
  }

  /**
   * Cancel any in-flight prefetch requests upon fast scroll / swipe away.
   */
  public cancelPrefetch(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
      this.metrics.cancelledCount++;
    }
  }

  /**
   * Prefetch the next immediate Reel's poster and manifest metadata.
   */
  public prefetchNextReel(nextReel: ReelPlayerData | null | undefined): void {
    if (!nextReel || !nextReel.id) return;

    if (!this.isPrefetchEnabled()) {
      this.metrics.dataSaverSkippedCount++;
      return;
    }

    // Cancel any ongoing prefetch for a previously anticipated item
    this.cancelPrefetch();

    const controller = new AbortController();
    this.activeAbortController = controller;
    const signal = controller.signal;

    // 1. Prefetch lightweight poster image using cancellable fetch
    if (nextReel.posterUrl && !this.prefetchedUrls.has(nextReel.posterUrl)) {
      this.prefetchedUrls.add(nextReel.posterUrl);
      fetch(nextReel.posterUrl, { signal, mode: 'no-cors' })
        .then(() => {
          this.metrics.prefetchedBytes += 50000; // estimated ~50KB poster
        })
        .catch(() => {});
    }

    // 2. Prefetch HLS master playlist with full reusable GET request
    const hlsUrl = nextReel.hlsUrl;
    if (
      hlsUrl &&
      hlsUrl.includes('.m3u8') &&
      !this.prefetchedUrls.has(hlsUrl)
    ) {
      this.prefetchedUrls.add(hlsUrl);
      fetch(hlsUrl, { signal })
        .then((res) => {
          if (res.ok) {
            this.metrics.prefetchedCount++;
            this.metrics.prefetchedBytes += 1000;
          }
        })
        .catch(() => {
          // Abort or network error on cancelled prefetch is non-fatal
        });
    }
  }

  /**
   * Read cumulative telemetry metrics for prefetch efficiency.
   */
  public getMetrics(): PrefetchMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics for test isolation.
   */
  public resetMetrics(): void {
    this.cancelPrefetch();
    this.prefetchedUrls.clear();
    this.metrics = {
      prefetchedCount: 0,
      cancelledCount: 0,
      prefetchedBytes: 0,
      dataSaverSkippedCount: 0,
    };
  }
}

export const prefetchManager = new PrefetchManager();
