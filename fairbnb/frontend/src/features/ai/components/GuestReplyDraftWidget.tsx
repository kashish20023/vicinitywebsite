'use client';

import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../ai.api';
import { useAiCapabilities } from '../use-ai-capabilities';
import { useAuth } from '@/context/auth-context';
import { Sparkles, Loader2, Check, RefreshCw, AlertCircle } from 'lucide-react';

export interface GuestReplyDraftWidgetProps {
  propertyId: string;
  guestUserId: string;
  onApplyDraft: (draftText: string) => void;
  className?: string;
}

export function GuestReplyDraftWidget({
  propertyId,
  guestUserId,
  onApplyDraft,
  className = '',
}: GuestReplyDraftWidgetProps) {
  const { isFeatureEnabled } = useAiCapabilities();
  const { user } = useAuth();
  const isEnabled = isFeatureEnabled('guestReplyDraft');

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{
    draftReply?: string;
    draftResponse?: string;
    tone?: string;
    keyFactsReferenced?: string[];
    groundedPoints?: string[];
    caveats?: string[];
    isSafeToSend?: boolean;
    requiresHumanReview?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<'WARM' | 'PROFESSIONAL' | 'CONCISE'>('WARM');
  const [instruction, setInstruction] = useState('');

  // Track active request to prevent race conditions on context/property/user change
  const activeRequestRef = useRef<{
    id: number;
    controller: AbortController;
    propertyId: string;
    guestUserId: string;
  } | null>(null);
  const reqIdCounter = useRef(0);

  // Suppress stale private output & cancel pending calls when switching property, user or account
  useEffect(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.controller.abort('Context changed');
      activeRequestRef.current = null;
    }
    setDraft(null);
    setError(null);
    setLoading(false);
    setInstruction('');
  }, [propertyId, guestUserId, user?.id, isEnabled]);

  if (!isEnabled) return null;

  const handleGenerate = async () => {
    if (!propertyId || !guestUserId) return;

    // Abort previous in-flight request if any
    if (activeRequestRef.current) {
      activeRequestRef.current.controller.abort('Superseded by new request');
      activeRequestRef.current = null;
    }

    const currentReqId = ++reqIdCounter.current;
    const controller = new AbortController();
    activeRequestRef.current = {
      id: currentReqId,
      controller,
      propertyId,
      guestUserId,
    };

    try {
      setLoading(true);
      setError(null);

      const res = await aiApi.createGuestReplyDraft(
        {
          propertyId,
          guestUserId,
          tone: selectedTone,
          instruction: instruction.trim() || undefined,
        },
        { signal: controller.signal },
      );

      // Verify request is still current before applying output
      if (
        activeRequestRef.current &&
        activeRequestRef.current.id === currentReqId &&
        activeRequestRef.current.propertyId === propertyId &&
        activeRequestRef.current.guestUserId === guestUserId
      ) {
        setDraft(res);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        // Request was aborted due to context change: suppress silently
        return;
      }
      if (activeRequestRef.current && activeRequestRef.current.id === currentReqId) {
        if (err.status === 401 || err.statusCode === 401) {
          setError('Session expired. Please log in again.');
        } else if (err.status === 403 || err.statusCode === 403) {
          setError('Access denied: You lack permission to draft replies for this listing.');
        } else if (err.status === 503 || err.statusCode === 503) {
          setError('AI assistant is currently disabled by administrator.');
        } else {
          setError(err.message || 'Failed to generate AI reply draft.');
        }
      }
    } finally {
      if (activeRequestRef.current && activeRequestRef.current.id === currentReqId) {
        setLoading(false);
        activeRequestRef.current = null;
      }
    }
  };

  const handleInsert = () => {
    const textToInsert = draft?.draftReply || draft?.draftResponse;
    if (textToInsert) {
      onApplyDraft(textToInsert);
    }
  };

  return (
    <div className={`p-4 bg-gradient-to-br from-[#edf4f7] to-white border border-[#adcada] rounded-2xl shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0e4962]">
          <Sparkles className="w-4 h-4 text-[#0e4962]" />
          <span>AI Reply Co-Pilot</span>
          <span className="text-[10px] bg-white border border-[#adcada] text-neutral-600 px-2 py-0.5 rounded-full font-semibold">
            Draft only • Human review required
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {(['WARM', 'PROFESSIONAL', 'CONCISE'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTone(t)}
              className={`px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                selectedTone === t
                  ? 'bg-[#0e4962] text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional: custom note (e.g. 'early check-in is fine at 1pm')"
          className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e4962]"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Drafting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Draft</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {draft && (
        <div className="space-y-2 pt-1 border-t border-neutral-200/60">
          <div className="p-3 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap">
            {draft.draftReply || draft.draftResponse}
          </div>
          {((draft.groundedPoints && draft.groundedPoints.length > 0) || (draft.keyFactsReferenced && draft.keyFactsReferenced.length > 0)) && (
            <div className="flex flex-wrap gap-1 items-center text-[10px] text-neutral-500">
              <span className="font-semibold text-neutral-700">Verified facts:</span>
              {(draft.groundedPoints || draft.keyFactsReferenced || []).map((fact: string, idx: number) => (
                <span key={idx} className="bg-neutral-100 px-2 py-0.5 rounded-md">
                  {fact}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              className="px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="px-3 py-1 text-xs font-bold text-white bg-[#0e4962] hover:bg-[#093447] rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Insert into message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
