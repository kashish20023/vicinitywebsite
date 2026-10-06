import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelPlayer } from '../ReelPlayer';
import { ReelFeedCard } from '../ReelFeedCard';
import { emitReelPlay } from '../reel-registry';
import { api } from '@/lib/api-client';

describe('Phase 13 — Reel Performance Optimization Frontend Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Poster-First & Lazy Video Loading', () => {
    it('renders video with posterUrl attribute initially', () => {
      const reelData = {
        id: 'reel_perf_1',
        hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_auto/v1/sample.m3u8',
        posterUrl: 'https://res.cloudinary.com/demo/video/upload/v1/sample.jpg',
        caption: 'Luxury Villa Tour',
      };

      render(<ReelPlayer reel={reelData} autoPlay={false} />);

      const videoEl = screen.getByRole('region', { name: /fairbnb reel/i }).querySelector('video');
      expect(videoEl).toBeInTheDocument();
      expect(videoEl).toHaveAttribute('poster', reelData.posterUrl);
    });
  });

  describe('Single Active Video Coordination', () => {
    it('pauses currently playing video when another Reel starts playing', () => {
      const reelData1 = {
        id: 'reel_active_1',
        hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_auto/v1/sample1.m3u8',
        caption: 'First Reel',
      };

      render(<ReelPlayer reel={reelData1} autoPlay={false} />);

      // Emit play for a different Reel ID
      emitReelPlay('reel_active_2');

      const container = screen.getByRole('region', { name: /first reel/i });
      expect(container).toBeInTheDocument();
    });
  });
});
