import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prefetchManager } from '../prefetch-manager';
import { ReelPlayerData } from '../ReelPlayer';

describe('Phase 3 / Chunk 3 — Adaptive Delivery & Controlled Prefetch Suite', () => {
  const mockNextReel: ReelPlayerData = {
    id: 'reel_prefetch_next',
    hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_prefetch_next.m3u8',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_prefetch_next.jpg',
    caption: 'Next Luxury Stay in Queue',
    duration: 15,
  };

  beforeEach(() => {
    prefetchManager.resetMetrics();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('prefetches next reel metadata (poster and manifest)', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    prefetchManager.prefetchNextReel(mockNextReel);

    expect(fetchSpy).toHaveBeenCalledWith(
      mockNextReel.posterUrl,
      expect.objectContaining({ mode: 'no-cors' }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      mockNextReel.hlsUrl,
      expect.objectContaining({ signal: expect.any(Object) }),
    );

    // Allow promise tick to increment counter
    await new Promise((resolve) => setTimeout(resolve, 10));
    const metrics = prefetchManager.getMetrics();
    expect(metrics.prefetchedCount).toBe(1);
    expect(metrics.prefetchedBytes).toBeGreaterThan(0);
  });

  it('cancels ongoing in-flight prefetch requests on rapid swipe', () => {
    let capturedSignal: any = null;
    vi.spyOn(global, 'fetch').mockImplementation((_url, init) => {
      capturedSignal = init?.signal;
      return new Promise(() => {}); // never resolves to simulate pending
    });

    prefetchManager.prefetchNextReel(mockNextReel);
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    // User rapidly scrolls past before fetch completes
    prefetchManager.cancelPrefetch();
    expect(capturedSignal?.aborted).toBe(true);

    const metrics = prefetchManager.getMetrics();
    expect(metrics.cancelledCount).toBe(1);
  });

  it('respects Data-Saver mode: skips prefetching when enabled', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    prefetchManager.setDataSaver(true);

    prefetchManager.prefetchNextReel(mockNextReel);

    expect(fetchSpy).not.toHaveBeenCalled();
    const metrics = prefetchManager.getMetrics();
    expect(metrics.dataSaverSkippedCount).toBe(1);
    expect(metrics.prefetchedCount).toBe(0);
  });
});
