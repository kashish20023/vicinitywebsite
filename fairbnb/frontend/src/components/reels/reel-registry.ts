/**
 * Lightweight global event coordinator for single active Reel playback.
 * Ensures only one ReelPlayer instance actively streams audio/video at a time.
 */

const REEL_PLAY_EVENT = 'fairbnb:reel:play';
let activeReelId: string | null = null;

export function getActiveReelId(): string | null {
  return activeReelId;
}

export function emitReelPlay(reelId: string): void {
  activeReelId = reelId;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(REEL_PLAY_EVENT, { detail: { reelId } }),
  );
}

export function subscribeReelPlay(
  onReelPlay: (activeReelId: string) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ reelId: string }>;
    if (customEvent.detail?.reelId) {
      activeReelId = customEvent.detail.reelId;
      onReelPlay(customEvent.detail.reelId);
    }
  };

  window.addEventListener(REEL_PLAY_EVENT, handler);
  return () => {
    window.removeEventListener(REEL_PLAY_EVENT, handler);
  };
}
