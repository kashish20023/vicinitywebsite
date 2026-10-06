'use client';

import React, { useState } from 'react';
import { aiApi } from '../ai.api';
import { useAiCapabilities } from '../use-ai-capabilities';
import { Sparkles, MessageCircle, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function ListingQaWidget({
  propertyId,
  checkIn,
  checkOut,
  guests,
}: {
  propertyId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  const { isFeatureEnabled } = useAiCapabilities();
  const isEnabled = isFeatureEnabled('listingQa');

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: any }>>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isEnabled) {
    return null;
  }

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question.trim();
    setQuestion('');
    try {
      setLoading(true);
      setError(null);
      const res = await aiApi.askListingQuestion({
        propertyId,
        question: currentQuestion,
        checkIn,
        checkOut,
        guests,
      });
      setQaHistory((prev) => [...prev, { q: currentQuestion, a: res }]);
    } catch (err: any) {
      setError(err.message || 'Could not verify answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-4 my-6">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0e485b]" />
          <h3 className="font-bold text-neutral-900 text-sm">Ask About This Listing</h3>
        </div>
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          Grounded In Property Facts
        </span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {qaHistory.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">
            Have questions about parking, check-in, pool rules, or house amenities? Ask below for an immediate grounded answer.
          </p>
        ) : (
          qaHistory.map((item, idx) => (
            <div key={idx} className="space-y-1.5 text-xs">
              <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-neutral-400" />
                <span>{item.q}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1">
                <p className="text-neutral-700 leading-relaxed">{item.a.answer}</p>
                {item.a.sources?.length > 0 && (
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified via: {item.a.sources.map((s: any) => s.field).join(', ')}</span>
                  </div>
                )}
                {item.a.suggestHostContact && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg inline-block">
                    Host confirmation recommended
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="text-xs text-[#0e4962] bg-[#edf4f7] p-2.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAsk} className="relative flex items-center pt-1">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., Is the pool private? What are the quiet hours?"
          className="w-full pl-4 pr-24 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0e485b]/20 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-1.5 px-4 py-1.5 bg-[#0e485b] hover:bg-[#093543] disabled:opacity-50 text-white text-xs font-bold rounded-full transition flex items-center gap-1 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
