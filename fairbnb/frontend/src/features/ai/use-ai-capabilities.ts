'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiApi, type PublicCapabilities, type AiFeatureKey } from './ai.api';

export function useAiCapabilities() {
  const [capabilities, setCapabilities] = useState<PublicCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiApi.getCapabilities();
      setCapabilities(data);
      setError(null);
    } catch (err: any) {
      setCapabilities({
        enabled: false,
        master: false,
        features: {
          smartSearch: false,
          stayComparison: false,
          listingQa: false,
          guestReplyDraft: false,
          listingQuality: false,
        },
        version: 0,
      });
      setError(err.message || 'AI capabilities unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  const isFeatureEnabled = useCallback(
    (feature: AiFeatureKey): boolean => {
      if (!capabilities || !capabilities.enabled) return false;
      return Boolean(capabilities.features[feature]);
    },
    [capabilities],
  );

  return {
    capabilities,
    loading,
    error,
    isAiEnabled: Boolean(capabilities?.enabled),
    isFeatureEnabled,
    refetch: fetchCapabilities,
  };
}
