export interface ShareReelOptions {
  reelId: string;
  title?: string;
  text?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'none';
  cancelled?: boolean;
  error?: string;
}

/**
 * Constructs the canonical public URL for a FairBnB Reel.
 */
export function getReelShareUrl(reelId: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/reels?reel=${encodeURIComponent(reelId)}`;
  }
  return `/reels?reel=${encodeURIComponent(reelId)}`;
}

/**
 * Triggers native Web Share API if supported, or falls back to Clipboard API.
 */
export async function shareReel(options: ShareReelOptions): Promise<ShareResult> {
  const { reelId, title = 'FairBnB Reel', text = 'Check out this short video tour on FairBnB!' } = options;
  const shareUrl = getReelShareUrl(reelId);

  // 1. Try Native Web Share API if supported
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      // User cancelled native share sheet
      if (err?.name === 'AbortError' || err?.message?.includes('abort') || err?.message?.includes('cancel')) {
        return { success: false, method: 'native', cancelled: true };
      }
      // Non-abort error: proceed to clipboard fallback below
    }
  }

  // 2. Clipboard API Fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { success: true, method: 'clipboard' };
    } catch (err: any) {
      return {
        success: false,
        method: 'none',
        error: err?.message || 'Failed to copy link to clipboard',
      };
    }
  }

  // 3. Fallback for environments lacking clipboard write API
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (copied) {
        return { success: true, method: 'clipboard' };
      }
    }
  } catch {
    // Non-fatal execCommand error
  }

  return {
    success: false,
    method: 'none',
    error: 'Sharing is not supported on this device/browser',
  };
}
