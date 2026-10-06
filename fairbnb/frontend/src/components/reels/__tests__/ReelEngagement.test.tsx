import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelFeedCard, ReelFeedItem } from '../ReelFeedCard';
import { ReelCommentsModal, ReelCommentItem } from '../ReelCommentsModal';
import { ReelReportModal } from '../ReelReportModal';
import { shareReel, getReelShareUrl } from '../share-utils';

describe('Phase 8 — Reels Engagement & Share Suite', () => {
  const mockFeedItem: ReelFeedItem = {
    id: 'reel_engagement_1',
    hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_engagement_1.m3u8',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_engagement_1.jpg',
    caption: 'Sunset Beach House Tour',
    publishedAt: '2026-09-20T00:00:00Z',
    likeCount: 42,
    commentCount: 7,
    isLikedByCurrentUser: false,
    creator: {
      id: 'creator_1',
      name: 'Elena Rostova',
      avatarUrl: 'https://example.com/avatar1.jpg',
    },
    property: {
      id: 'prop_beach_1',
      title: 'Sunset Beach Villa',
      city: 'Malibu',
      pricePerNight: 450,
    },
  };

  const mockComments: ReelCommentItem[] = [
    {
      id: 'comment_1',
      content: 'Absolutely breathtaking view!',
      createdAt: '2026-09-20T00:05:00Z',
      author: {
        id: 'user_1',
        name: 'Sarah Connor',
        avatarUrl: 'https://example.com/sarah.jpg',
      },
    },
    {
      id: 'comment_2',
      content: 'Can I book for next weekend?',
      createdAt: '2026-09-20T00:10:00Z',
      author: {
        id: 'user_2',
        name: 'John Doe',
      },
    },
  ];

  it('should export ReelFeedCard, ReelCommentsModal, ReelReportModal, and share utilities', () => {
    expect(ReelFeedCard).toBeDefined();
    expect(ReelCommentsModal).toBeDefined();
    expect(ReelReportModal).toBeDefined();
    expect(shareReel).toBeDefined();
    expect(getReelShareUrl).toBeDefined();
  });

  it('renders ReelFeedCard engagement buttons (like, comments, share, report) with counts and accessible labels', () => {
    render(<ReelFeedCard item={mockFeedItem} autoPlay={false} />);

    const likeButton = screen.getByRole('button', { name: /like reel/i });
    expect(likeButton).toBeInTheDocument();
    expect(likeButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('42')).toBeInTheDocument();

    const commentButton = screen.getByRole('button', { name: /open comments/i });
    expect(commentButton).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    const shareButton = screen.getByRole('button', { name: /share reel/i });
    expect(shareButton).toBeInTheDocument();

    const reportButton = screen.getByRole('button', { name: /report reel/i });
    expect(reportButton).toBeInTheDocument();
  });

  it('renders ReelCommentsModal dialog when open and presents comments header', async () => {
    await act(async () => {
      render(
        <ReelCommentsModal
          reelId="reel_engagement_1"
          isOpen={true}
          onClose={() => {}}
        />,
      );
    });

    const dialog = screen.getByRole('dialog', { name: /reel comments/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/add a comment\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close comments/i })).toBeInTheDocument();
  });

  it('renders ReelReportModal dialog when open and lists report reasons', () => {
    render(
      <ReelReportModal
        reelId="reel_engagement_1"
        isOpen={true}
        onClose={() => {}}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: /report reel/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
  });

  it('should construct canonical Reel share URL cleanly', () => {
    const url = getReelShareUrl('reel_123');
    expect(url).toContain('/reels?reel=reel_123');
    expect(url).not.toContain('token');
    expect(url).not.toContain('secret');
  });

  it('should use Web Share API when supported', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    });

    const res = await shareReel({ reelId: 'reel_abc', title: 'Test Reel' });
    expect(res.success).toBe(true);
    expect(res.method).toBe('native');
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Reel',
        url: expect.stringContaining('/reels?reel=reel_abc'),
      }),
    );
  });

  it('should fall back to clipboard when Web Share API is unsupported', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
      writable: true,
    });

    const res = await shareReel({ reelId: 'reel_xyz' });
    expect(res.success).toBe(true);
    expect(res.method).toBe('clipboard');
    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('/reels?reel=reel_xyz'));
  });

  it('should handle native share cancellation without treating as success or calling clipboard fallback', async () => {
    const abortErr = new Error('Share aborted');
    abortErr.name = 'AbortError';
    const mockShare = vi.fn().mockRejectedValue(abortErr);

    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    });

    const mockWriteText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
      writable: true,
    });

    const res = await shareReel({ reelId: 'reel_cancel' });
    expect(res.success).toBe(false);
    expect(res.cancelled).toBe(true);
    expect(res.method).toBe('native');
    expect(mockWriteText).not.toHaveBeenCalled();
  });
});

