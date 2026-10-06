'use client';

import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../ai.api';
import { useAiCapabilities } from '../use-ai-capabilities';
import { useAuth } from '@/context/auth-context';
import { Sparkles, Loader2, Check, AlertCircle, Award, FileText } from 'lucide-react';

export interface ListingQualityWidgetProps {
  propertyId: string;
  onApplyDescription?: (headline: string, summary: string) => void;
  className?: string;
}

export function ListingQualityWidget({
  propertyId,
  onApplyDescription,
  className = '',
}: ListingQualityWidgetProps) {
  const { isFeatureEnabled } = useAiCapabilities();
  const { user } = useAuth();
  const isEnabled = isFeatureEnabled('listingQuality');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track active request to prevent race conditions
  const activeRequestRef = useRef<{
    id: number;
    controller: AbortController;
    propertyId: string;
  } | null>(null);
  const reqIdCounter = useRef(0);

  // Suppress stale private output & cancel pending calls when switching property or account
  useEffect(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.controller.abort('Context changed');
      activeRequestRef.current = null;
    }
    setResult(null);
    setError(null);
    setLoading(false);
  }, [propertyId, user?.id, isEnabled]);

  if (!isEnabled) return null;

  const handleAudit = async (generateDraft = true) => {
    if (!propertyId) return;

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
    };

    try {
      setLoading(true);
      setError(null);

      const res = await aiApi.evaluateListingQuality(
        {
          propertyId,
          generateDescriptionDraft: generateDraft,
        },
        { signal: controller.signal },
      );

      if (
        activeRequestRef.current &&
        activeRequestRef.current.id === currentReqId &&
        activeRequestRef.current.propertyId === propertyId
      ) {
        setResult(res);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return;
      }
      if (activeRequestRef.current && activeRequestRef.current.id === currentReqId) {
        if (err.status === 401 || err.statusCode === 401) {
          setError('Session expired. Please log in again.');
        } else if (err.status === 403 || err.statusCode === 403) {
          setError('Access denied: You lack permission to audit quality for this listing.');
        } else if (err.status === 503 || err.statusCode === 503) {
          setError('Listing quality assistant is currently disabled by administrator.');
        } else {
          setError(err.message || 'Listing quality evaluation failed.');
        }
      }
    } finally {
      if (activeRequestRef.current && activeRequestRef.current.id === currentReqId) {
        setLoading(false);
        activeRequestRef.current = null;
      }
    }
  };

  const handleApply = () => {
    if (result?.descriptionDraft && onApplyDescription) {
      const headline = result.descriptionDraft.titleSuggestion || result.descriptionDraft.suggestedHeadline || '';
      const summary = result.descriptionDraft.fullDescriptionDraft || result.descriptionDraft.summary || '';
      onApplyDescription(headline, summary);
    }
  };

  return (
    <div className={`p-5 bg-white border border-[#adcada] rounded-3xl shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#edf4f7] flex items-center justify-center text-[#0e4962]">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">AI Listing Quality & Copywriter</h3>
            <p className="text-xs text-neutral-500">Deterministic scoring & grounded description optimization</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAudit(true)}
          disabled={loading}
          className="px-3.5 py-1.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Evaluating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Quality & Draft</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4 pt-2 border-t border-neutral-100">
          {/* Score Badge */}
          <div className="flex items-center justify-between p-3.5 bg-[#edf4f7] rounded-2xl border border-[#adcada]">
            <div className="space-y-0.5">
              <span className="text-xs text-neutral-600 font-medium">Quality Score</span>
              <div className="text-xl font-black text-[#0e4962]">{result.overallScore ?? result.score} / 100</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-700 capitalize">
                {(result.completenessStatus || result.grade || 'Audit Complete').toLowerCase().replace(/_/g, ' ')}
              </span>
              <div className="text-[11px] text-neutral-500">{result.findings?.length || 0} recommendations</div>
            </div>
          </div>

          {/* Findings */}
          {result.findings?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-800">Improvement Suggestions:</span>
              <div className="space-y-1">
                {result.findings.map((f: any, i: number) => (
                  <div key={i} className="text-xs p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      f.status === 'FAIL' || f.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {f.category}
                    </span>
                    <span className="text-neutral-700">{f.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Draft */}
          {result.descriptionDraft && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0e4962]" />
                  Proposed Headline: <span className="text-[#0e4962] font-semibold">{result.descriptionDraft.titleSuggestion || result.descriptionDraft.suggestedHeadline}</span>
                </span>
                {onApplyDescription && (
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-2.5 py-1 text-xs font-bold bg-[#0e4962] text-white rounded-lg flex items-center gap-1 hover:bg-[#093447] transition cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Apply to Form
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-neutral-200">
                {result.descriptionDraft.fullDescriptionDraft || result.descriptionDraft.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
