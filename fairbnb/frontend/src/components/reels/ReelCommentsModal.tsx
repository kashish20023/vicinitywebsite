'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { X, Send, Trash2, Flag, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ReelCommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

export interface ReelCommentsModalProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export function ReelCommentsModal({
  reelId,
  isOpen,
  onClose,
  onCommentAdded,
  onCommentDeleted,
}: ReelCommentsModalProps) {
  const [comments, setComments] = useState<ReelCommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('fairbnb_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          return parsed.id || null;
        }
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    let active = true;
    if (isOpen && reelId) {
      queueMicrotask(() => {
        if (!active) return;
        setIsLoading(true);
        setError(null);
        api
          .get<{ items: ReelCommentItem[] }>(`/api/reels/${reelId}/comments`)
          .then((res) => {
            if (active) setComments(res.items || []);
          })
          .catch((err: unknown) => {
            if (active)
              setError(
                (err as { message?: string })?.message ||
                  'Unable to load comments',
              );
          })
          .finally(() => {
            if (active) setIsLoading(false);
          });
      });
    }
    return () => {
      active = false;
    };
  }, [isOpen, reelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const newComment = await api.post<ReelCommentItem>(
        `/api/reels/${reelId}/comments`,
        { content: trimmed },
      );
      setComments((prev) => [newComment, ...prev]);
      setContent('');
      if (onCommentAdded) onCommentAdded();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to post comment. Please sign in first.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (deletingId) return;
    setDeletingId(commentId);
    try {
      await api.delete(`/api/reels/${reelId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (onCommentDeleted) onCommentDeleted();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      await api.post(`/api/reels/${reelId}/comments/${commentId}/report`, {
        reason: 'Inappropriate comment content',
      });
      alert('Comment report submitted to admin queue.');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to report comment. Please sign in.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-2xl flex flex-col h-[75vh] max-h-[600px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Reel Comments"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/90">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <MessageCircle className="w-4 h-4 text-[#38bdf8]" />
            <span>Comments ({comments.length})</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comments"
            className="p-1 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 p-3 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#38bdf8]" />
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-xs text-center p-4">
              <MessageCircle className="w-8 h-8 text-gray-600 mb-2" />
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-xs group">
                {comment.author.avatarUrl ? (
                  <img
                    src={comment.author.avatarUrl}
                    alt={comment.author.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#0e4962] text-white font-bold flex items-center justify-center shrink-0 border border-white/20">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 bg-gray-800/50 rounded-xl p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">
                      {comment.author.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {currentUserId === comment.author.id ? (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          aria-label="Delete comment"
                          disabled={deletingId === comment.id}
                          className="text-gray-500 hover:text-rose-400 transition-colors"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReportComment(comment.id)}
                          aria-label="Report comment"
                          title="Report comment"
                          className="text-gray-500 hover:text-rose-400 transition-colors opacity-80 group-hover:opacity-100"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-gray-800 bg-gray-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0e4962]"
          />
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            aria-label="Submit comment"
            className="p-2 bg-[#0e4962] hover:bg-[#165a78] disabled:opacity-40 text-white rounded-full transition-all active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
