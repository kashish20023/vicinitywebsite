import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelReportModal } from '../ReelReportModal';
import { ReelCommentsModal } from '../ReelCommentsModal';
import { api } from '@/lib/api-client';

describe('Phase 11 — Reel Moderation & Safety Frontend Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'post').mockResolvedValue({
      success: true,
      message: 'Report submitted successfully',
      reportId: 'rep_123',
    });
    vi.spyOn(api, 'get').mockResolvedValue({
      items: [
        {
          id: 'comment_1',
          content: 'This comment needs moderation',
          createdAt: new Date().toISOString(),
          author: { id: 'other_user_1', name: 'Other User' },
        },
      ],
    });
  });

  describe('Reel Report Modal', () => {
    it('renders report reason selection choices when modal is open', () => {
      render(
        <ReelReportModal
          reelId="reel_pub_123"
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByRole('dialog', { name: /report reel/i })).toBeInTheDocument();
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument();
      expect(screen.getByText(/misleading listing information/i)).toBeInTheDocument();
    });

    it('submits report to API and displays success banner', async () => {
      const onCloseMock = vi.fn();
      render(
        <ReelReportModal
          reelId="reel_pub_123"
          isOpen={true}
          onClose={onCloseMock}
        />,
      );

      const submitBtn = screen.getByRole('button', { name: /submit report/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/reels/reel_pub_123/report', {
          reason: 'Inappropriate content',
        });
      });

      expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
    });

    it('displays error message if report submission fails', async () => {
      vi.spyOn(api, 'post').mockRejectedValue(new Error('Please sign in first.'));
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
        expect(screen.getByText(/please sign in first/i)).toBeInTheDocument();
      });
    });
  });

  describe('Comment Reporting Action', () => {
    it('renders report flag icon on comments from other users and triggers report API', async () => {
      render(
        <ReelCommentsModal
          reelId="reel_pub_123"
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/this comment needs moderation/i)).toBeInTheDocument();
      });

      const reportCommentBtn = screen.getByRole('button', { name: /report comment/i });
      expect(reportCommentBtn).toBeInTheDocument();

      fireEvent.click(reportCommentBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/reels/reel_pub_123/comments/comment_1/report',
          expect.objectContaining({
            reason: expect.any(String),
          }),
        );
      });
    });
  });
});
