'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { aiApi } from '../ai.api';
import { useAiCapabilities } from '../use-ai-capabilities';
import {
  Sparkles,
  Search,
  Loader2,
  MapPin,
  Check,
  AlertCircle,
  X,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';

export function SmartSearchBar({
  onResults,
}: {
  onResults?: (results: any) => void;
}) {
  const { isFeatureEnabled } = useAiCapabilities();
  const isEnabled = isFeatureEnabled('smartSearch');

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Allow external quick prompts to populate and focus search input
  useEffect(() => {
    const handleSetPrompt = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setQuery(e.detail);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('set-smart-search-prompt', handleSetPrompt);
    return () => window.removeEventListener('set-smart-search-prompt', handleSetPrompt);
  }, []);

  // If feature is disabled by admin, return null gracefully (additive entry point)
  if (!isEnabled) {
    return null;
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || loading) return;

    try {
      setLoading(true);
      setError(null);
      const res = await aiApi.smartSearch({ query: cleanQuery });
      setLastResult(res);
      if (onResults) {
        onResults(res);
      }
    } catch (err: any) {
      setError(err.message || 'Smart search could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setError(null);
    setLastResult(null);
    inputRef.current?.focus();
    if (onResults) {
      onResults(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-3 space-y-3">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="relative flex items-center group">
        <div className="absolute left-4 text-[#0e4962] flex items-center pointer-events-none transition-colors">
          <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0e4962]" />
        </div>

        <input
          ref={inputRef}
          id="smart-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by destination, budget, or amenities (e.g., 2-bedroom pool villa in Goa under 15000)..."
          aria-label="Search by destination, budget, or amenities"
          className="w-full pl-11 sm:pl-12 pr-28 sm:pr-32 py-3 sm:py-3.5 bg-white border border-[#adcada]/60 hover:border-[#0e4962]/40 focus:border-[#0e4962] rounded-full shadow-xs text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#0e4962]/10 transition-all duration-200"
        />

        {/* Clear Button */}
        {query && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 sm:right-28 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Search Submit CTA */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-1.5 sm:right-2 px-4 sm:px-5 py-2 sm:py-2 rounded-full bg-[#0e4962] hover:bg-[#093447] active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-xs sm:text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>{loading ? 'Searching' : 'Search'}</span>
        </button>
      </form>

      {/* Loading Indicator helper */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#0e4962] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Analyzing listings, verifying amenities, and matching preferences...</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200/80 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Structured Result Summary & Candidate Cards */}
      {lastResult && (
        <div className="bg-white border border-[#adcada]/50 p-4 sm:p-5 rounded-3xl space-y-3.5 text-xs shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">
                Found {lastResult.totalEligible} Verified Match{lastResult.totalEligible === 1 ? '' : 'es'}
              </span>
              {lastResult.appliedPreferences?.destination && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#edf4f7] text-[#0e4962] font-semibold text-[11px]">
                  📍 {lastResult.appliedPreferences.destination}
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0e4962]" />
              AI Verified Ground Truth
            </span>
          </div>

          {/* Clarification Tips */}
          {lastResult.clarificationsNeeded?.length > 0 && (
            <div className="space-y-1.5">
              {lastResult.clarificationsNeeded.map((tip: string, idx: number) => (
                <div
                  key={idx}
                  className="text-amber-900 bg-amber-50/90 border border-amber-200/60 px-3.5 py-2 rounded-xl flex items-start gap-2"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Candidate Property Cards */}
          {lastResult.candidates?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {lastResult.candidates.slice(0, 4).map((c: any) => (
                <Link
                  key={c.property.id}
                  href={`/properties/${c.property.id}`}
                  className="group p-3 rounded-2xl border border-gray-100 hover:border-[#0e4962]/30 bg-gray-50/60 hover:bg-white hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-[#0e4962] transition-colors line-clamp-1">
                        {c.property.title}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0e4962] transition-colors shrink-0" />
                    </div>
                    <div className="text-gray-500 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{c.property.locality || c.property.city}</span>
                      <span className="mx-0.5">•</span>
                      <span className="font-bold text-gray-800 shrink-0">₹{c.property.basePrice?.toLocaleString()}/night</span>
                    </div>
                  </div>

                  {c.matchReasons?.length > 0 && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100/80 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{c.matchReasons[0]}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">No exact verified stays matched your search.</p>
              <p className="text-[11px]">Try searching with a broader destination or adjusting your budget ceiling.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
