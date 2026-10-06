'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { X, Flag, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export interface ReelReportModalProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Inappropriate content',
  'Misleading listing information',
  'Copyright or trademark infringement',
  'Spam or dangerous content',
  'Other issue',
];

export function ReelReportModal({
  reelId,
  isOpen,
  onClose,
}: ReelReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedReason === 'Other issue'
        ? customReason.trim() || 'Other issue'
        : selectedReason;

    if (!finalReason || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/reels/${reelId}/report`, {
        reason: finalReason,
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ||
          'Failed to submit report. Please sign in first.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl flex flex-col p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Report Reel"
      >
        <button
          onClick={onClose}
          aria-label="Close report modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
            <h3 className="text-white font-semibold text-sm mb-1">
              Report Submitted
            </h3>
            <p className="text-gray-400 text-xs">
              Thank you for keeping FairBnB safe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Flag className="w-4 h-4 text-rose-400" />
              <span>Report this Reel</span>
            </div>

            {error && (
              <div className="bg-rose-950/80 border border-rose-800 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-medium">
                Why are you reporting this Reel?
              </p>
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-emerald-500 bg-emerald-950/30 text-white'
                      : 'border-gray-800 bg-gray-800/40 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-emerald-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {selectedReason === 'Other issue' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Provide details..."
                  maxLength={250}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none h-20 mt-2"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Submit Report'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
