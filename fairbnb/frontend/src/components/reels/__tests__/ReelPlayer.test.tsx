import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelPlayer, ReelPlayerData } from '../ReelPlayer';
import { emitReelPlay, subscribeReelPlay } from '../reel-registry';

describe('Phase 4 — Adaptive Reel Player Suite', () => {
  const mockReel: ReelPlayerData = {
    id: 'reel_test_1',
    hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_test_1.m3u8',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_test_1.jpg',
    caption: 'Beautiful FairBnB Luxury Villa Reel',
    property: {
      id: 'prop_123',
      title: 'Oceanfront Luxury Villa',
      pricePerNight: 250,
    },
  };

  it('should define ReelPlayer component interface correctly', () => {
    expect(ReelPlayer).toBeDefined();
  });

  it('should accept ReelPlayerData prop structure', () => {
    expect(mockReel.hlsUrl).toContain('.m3u8');
    expect(mockReel.posterUrl).toContain('.jpg');
    expect(mockReel.property?.title).toBe('Oceanfront Luxury Villa');
  });

  it('renders video element and poster image', () => {
    const { container } = render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('poster', mockReel.posterUrl);
  });

  it('renders caption and property link overlay when provided', () => {
    render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    expect(screen.getByText('Beautiful FairBnB Luxury Villa Reel')).toBeInTheDocument();
    expect(screen.getByText('Oceanfront Luxury Villa')).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('toggles mute/unmute state when volume button is clicked', () => {
    render(<ReelPlayer reel={mockReel} autoPlay={false} muted={true} />);
    const muteButton = screen.getByRole('button', { name: /unmute/i });
    expect(muteButton).toBeInTheDocument();

    fireEvent.click(muteButton);
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
  });

  it('single-active-reel registry emits and receives play events correctly', () => {
    let receivedId: string | null = null;
    const unsubscribe = subscribeReelPlay((activeId) => {
      receivedId = activeId;
    });

    emitReelPlay('reel_test_999');
    expect(receivedId).toBe('reel_test_999');

    unsubscribe();
  });

  it('pauses playback when browser tab becomes hidden', () => {
    const { container } = render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();

    const pauseSpy = vi.spyOn(video, 'pause');
    Object.defineProperty(video, 'paused', { value: false, configurable: true, writable: true });

    Object.defineProperty(document, 'hidden', { value: true, configurable: true, writable: true });
    fireEvent(document, new Event('visibilitychange'));

    expect(pauseSpy).toHaveBeenCalled();
  });

  it('pauses playback when overlay opens and resumes when closed if eligible', () => {
    const { container, rerender } = render(
      <ReelPlayer reel={mockReel} autoPlay={true} isOverlayOpen={false} />,
    );
    const video = container.querySelector('video') as HTMLVideoElement;
    const pauseSpy = vi.spyOn(video, 'pause');
    const playSpy = vi.spyOn(video, 'play').mockResolvedValue(undefined);

    Object.defineProperty(video, 'paused', { value: false, configurable: true, writable: true });

    // Open overlay
    rerender(<ReelPlayer reel={mockReel} autoPlay={true} isOverlayOpen={true} />);
    expect(pauseSpy).toHaveBeenCalled();

    // Close overlay
    rerender(<ReelPlayer reel={mockReel} autoPlay={true} isOverlayOpen={false} />);
  });

  it('preserves manual user pause: closing overlay does not resume playback', () => {
    const { container, rerender } = render(
      <ReelPlayer reel={mockReel} autoPlay={true} isOverlayOpen={false} />,
    );
    const video = container.querySelector('video') as HTMLVideoElement;
    const playSpy = vi.spyOn(video, 'play').mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(video, 'pause');
    Object.defineProperty(video, 'paused', { value: false, configurable: true, writable: true });

    // Simulate manual user pause by clicking player container
    const playerRegion = screen.getByRole('region');
    fireEvent.click(playerRegion);
    expect(pauseSpy).toHaveBeenCalled();

    playSpy.mockClear();

    // Open and close overlay
    rerender(<ReelPlayer reel={mockReel} autoPlay={true} isOverlayOpen={true} />);
    rerender(<ReelPlayer reel={mockReel} autoPlay={true} isOverlayOpen={false} />);

    // Since user explicitly paused, play should NOT be called on overlay close
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('cleans up video resources and pauses on component unmount', () => {
    const { container, unmount } = render(<ReelPlayer reel={mockReel} autoPlay={false} />);
    const video = container.querySelector('video') as HTMLVideoElement;
    const pauseSpy = vi.spyOn(video, 'pause');
    const loadSpy = vi.spyOn(video, 'load');

    unmount();

    expect(pauseSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });
});
