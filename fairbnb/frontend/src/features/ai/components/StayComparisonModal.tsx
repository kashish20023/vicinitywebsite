'use client';

import React, { useState } from 'react';
import { aiApi } from '../ai.api';
import { useAiCapabilities } from '../use-ai-capabilities';
import { Sparkles, X, Check, Loader2, ArrowRight } from 'lucide-react';

export function StayComparisonModal({
  isOpen,
  onClose,
  propertyIds,
  checkIn,
  checkOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  propertyIds: string[];
  checkIn?: string;
  checkOut?: string;
}) {
  const { isFeatureEnabled } = useAiCapabilities();
  const isEnabled = isFeatureEnabled('stayComparison');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && isEnabled && propertyIds.length >= 2) {
      loadComparison();
    }
  }, [isOpen, propertyIds]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await aiApi.compareStays({
        propertyIds: propertyIds.slice(0, 4),
        checkIn,
        checkOut,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compare stays.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !isEnabled) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0e485b]" />
            <h2 className="text-lg font-bold text-neutral-900">Side-by-Side Stay Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-500 text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-[#0e485b]" />
              <span>Comparing verified property attributes...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#edf4f7] text-[#0e4962] text-xs rounded-2xl">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {data.disclaimer && (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-2xl">
                  {data.disclaimer}
                </div>
              )}

              {/* Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.columns.map((col: any) => (
                  <div
                    key={col.propertyId}
                    className="p-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/40 space-y-3"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900 text-sm line-clamp-1">{col.title}</h4>
                      <p className="text-xs text-neutral-500">{col.locality || col.city}, {col.state}</p>
                    </div>

                    <div className="text-lg font-black text-neutral-900">
                      ₹{col.basePricePerNight.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-neutral-500">/ night</span>
                    </div>

                    {col.quote && (
                      <div className="p-2 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-semibold">
                        Total: ₹{col.quote.totalAmount.toLocaleString()} ({col.quote.nights} nights)
                      </div>
                    )}

                    <div className="text-xs text-neutral-600 space-y-1 pt-2 border-t border-neutral-100">
                      <div>🛏️ {col.bedrooms} BR ({col.beds} beds) • 🚿 {col.bathrooms} baths</div>
                      <div>👥 Up to {col.maxGuests} guests</div>
                      <div>📜 {col.cancellationPolicy} Cancellation</div>
                    </div>

                    {col.amenities?.length > 0 && (
                      <div className="pt-2 border-t border-neutral-100 text-xs">
                        <span className="font-bold text-neutral-700 block mb-1">Key Perks:</span>
                        <div className="flex flex-wrap gap-1">
                          {col.amenities.slice(0, 4).map((a: string, i: number) => (
                            <span key={i} className="bg-white border border-neutral-200 px-2 py-0.5 rounded-md text-[10px]">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Narrative Summary */}
              {data.narrativeSummary && (
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1.5">
                  <div className="font-bold text-[#0e485b] text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0e485b]" />
                    <span>AI Comparison Insights</span>
                  </div>
                  <p className="text-xs text-[#0e485b]/90 leading-relaxed whitespace-pre-line">
                    {data.narrativeSummary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
