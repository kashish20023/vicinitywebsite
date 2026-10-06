import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReelsFeed } from '../ReelsFeed';
import { ReelFeedCard, ReelFeedItem } from '../ReelFeedCard';

describe('Phase 5 — Reels Feed & Discovery Experience Suite', () => {
  const mockFeedItem: ReelFeedItem = {
    id: 'reel_feed_1',
    hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_feed_1.m3u8',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_feed_1.jpg',
    caption: 'Cozy Mountain Lodge Tour',
    publishedAt: '2026-09-19T22:00:00Z',
    likeCount: 15,
    commentCount: 3,
    creator: {
      id: 'creator_1',
      name: 'Alex Rivera',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    property: {
      id: 'prop_lodging_1',
      title: 'Cozy Mountain Lodge',
      city: 'Aspen',
      pricePerNight: 320,
    },
  };

  it('should export ReelsFeed and ReelFeedCard components', () => {
    expect(ReelsFeed).toBeDefined();
    expect(ReelFeedCard).toBeDefined();
  });

  it('should accept initialItems prop to render pre-populated feed without extra request', () => {
    render(<ReelsFeed initialItems={[mockFeedItem]} initialNextCursor={null} />);
    expect(screen.getByRole('feed', { name: /fairbnb reels feed/i })).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getAllByText('Cozy Mountain Lodge')[0]).toBeInTheDocument();
  });

  it('should format creator and property relation links correctly', () => {
    expect(mockFeedItem.property?.id).toBe('prop_lodging_1');
    expect(mockFeedItem.hlsUrl).toContain('.m3u8');
  });

  it('should render empty state message when initialItems is empty array', () => {
    render(<ReelsFeed initialItems={[]} initialNextCursor={null} />);
    expect(screen.getByText('No Reels Yet')).toBeInTheDocument();
    expect(
      screen.getByText(/discover short-form video tours of unique stays/i),
    ).toBeInTheDocument();
  });
});
