import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelFeedCard, ReelFeedItem } from '../ReelFeedCard';
import { api } from '@/lib/api-client';

describe('Phase 10 — Reel Attribution Frontend Suite', () => {
  const mockReelFeedItem: ReelFeedItem = {
    id: 'reel_attr_feed_100',
    hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_attr.m3u8',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_attr.jpg',
    caption: 'Charming Seaside Villa',
    duration: 25,
    likeCount: 8,
    commentCount: 1,
    creator: {
      id: 'creator_host_10',
      name: 'Sophia Host',
      avatarUrl: null,
    },
    property: {
      id: 'prop_attr_sea_10',
      title: 'Seaside Sunset Villa',
      city: 'Goa',
      pricePerNight: 4500,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'post').mockResolvedValue({ success: true, queued: true });
  });

  it('renders tagged listing badge with standard property URL without booking attribution search parameters', () => {
    render(<ReelFeedCard item={mockReelFeedItem} autoPlay={false} />);
    const link = screen.getByRole('link', { name: /seaside sunset villa/i });

    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/properties/prop_attr_sea_10');
  });

  it('emits LISTING_CLICK event to backend on clicking tagged listing badge', () => {
    render(<ReelFeedCard item={mockReelFeedItem} autoPlay={false} />);
    const link = screen.getByRole('link', { name: /seaside sunset villa/i });

    fireEvent.click(link);

    expect(api.post).toHaveBeenCalledWith(
      '/api/reels/reel_attr_feed_100/events',
      expect.objectContaining({
        eventType: 'LISTING_CLICK',
        propertyId: 'prop_attr_sea_10',
      }),
    );
  });

  it('handles LISTING_CLICK event failure gracefully without throwing errors', () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('Network error'));
    render(<ReelFeedCard item={mockReelFeedItem} autoPlay={false} />);
    const link = screen.getByRole('link', { name: /seaside sunset villa/i });

    expect(() => fireEvent.click(link)).not.toThrow();
  });
});
