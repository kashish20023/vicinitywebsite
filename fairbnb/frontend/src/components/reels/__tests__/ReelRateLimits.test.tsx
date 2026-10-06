import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelReportModal } from '../ReelReportModal';
import { ReelCommentsModal } from '../ReelCommentsModal';
import { api, ApiError } from '@/lib/api-client';

describe('Phase 12 — Reel Rate Limits & Abuse Protection Frontend Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Report Modal Rate Limit (429 Handling)', () => {
    it('handles 429 Too Many Requests gracefully when report limit is exceeded', async () => {
      vi.spyOn(api, 'post').mockRejectedValue(
        new ApiError('Too many requests. Please try again later.', 429, { retryAfter: 60 }),
      );

      render(
        <ReelReportModal
          reelId="reel_pub_123"
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      const submitBtn = screen.getByRole('button', { name: /submit report/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });
  });

  describe('Comments Modal Rate Limit (429 Handling)', () => {
    it('handles 429 Too Many Requests gracefully when comment rate limit is exceeded', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ items: [] });
      vi.spyOn(api, 'post').mockRejectedValue(
        new ApiError('Too many requests. Please try again later.', 429, { retryAfter: 60 }),
      );

      render(
        <ReelCommentsModal
          reelId="reel_pub_123"
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      const input = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(input, { target: { value: 'Spam comment attempt' } });

      const submitBtn = screen.getByRole('button', { name: /submit comment/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/reels/reel_pub_123/comments',
          { content: 'Spam comment attempt' },
        );
      });
    });
  });
});
