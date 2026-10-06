import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelPlayer, ReelPlayerData } from '../ReelPlayer';
import { api } from '@/lib/api-client';

describe('Phase 9 — ReelPlayer Analytics Instrumentation Suite', () => {
  const mockReel: ReelPlayerData = {
    id: 'reel_analytics_123',
    hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_analytics_123.m3u8',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_analytics_123.jpg',
    caption: 'Luxury Villa Video Tour',
    duration: 30,
    property: {
      id: 'prop_villa_1',
      title: 'Malibu Oceanfront Villa',
      city: 'Malibu',
      pricePerNight: 750,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'post').mockResolvedValue({ success: true, queued: true });
  });

  it('renders ReelPlayer region with accessible label', () => {
    render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    const region = screen.getByRole('region', { name: /fairbnb reel: luxury villa video tour/i });
    expect(region).toBeInTheDocument();
  });

  it('emits PLAY_STARTED analytics event when video playback starts', async () => {
    const { container } = render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();

    await act(async () => {
      fireEvent.play(video);
    });

    expect(api.post).toHaveBeenCalledWith(
      '/api/reels/reel_analytics_123/events',
      expect.objectContaining({
        eventType: 'PLAY_STARTED',
        sessionId: expect.stringMatching(/^sess_/),
      }),
    );
  });

  it('emits progress milestones (25, 50, 75%) on timeupdate and 100% on ended at most once per session', async () => {
    const { container } = render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    Object.defineProperty(video, 'duration', { value: 100, configurable: true });

    await act(async () => {
      fireEvent.play(video);
    });

    // 25% milestone
    Object.defineProperty(video, 'currentTime', { value: 30, configurable: true, writable: true });
    await act(async () => {
      fireEvent.timeUpdate(video);
    });

    expect(api.post).toHaveBeenCalledWith(
      '/api/reels/reel_analytics_123/events',
      expect.objectContaining({
        eventType: 'PLAY_PROGRESS',
        progressPercent: 25,
      }),
    );

    // Duplicate timeupdate at same milestone should not emit duplicate event
    vi.clearAllMocks();
    await act(async () => {
      fireEvent.timeUpdate(video);
    });
    expect(api.post).not.toHaveBeenCalled();

    // 100% milestone on ended
    await act(async () => {
      fireEvent.ended(video);
    });

    expect(api.post).toHaveBeenCalledWith(
      '/api/reels/reel_analytics_123/events',
      expect.objectContaining({
        eventType: 'PLAY_COMPLETED',
        progressPercent: 100,
      }),
    );
  });

  it('continues video playback without error even if analytics API endpoint fails', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('Network error'));
    const { container } = render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    await act(async () => {
      expect(() => fireEvent.play(video)).not.toThrow();
    });

    expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
  });
});
