import { api } from '@/lib/api-client';

export type AiFeatureKey =
  | 'smartSearch'
  | 'stayComparison'
  | 'listingQa'
  | 'guestReplyDraft'
  | 'listingQuality';

export interface PublicCapabilities {
  enabled: boolean;
  master: boolean;
  features: Record<AiFeatureKey, boolean>;
  version: number;
}

export interface AdminAiSettings {
  aiAllowedEnv: boolean;
  master: boolean;
  features: Record<AiFeatureKey, boolean>;
  version: number;
  hasApiKey: boolean;
  singleProcessNotice: string;
  activeModel: string;
  updatedAt: string;
}

export const aiApi = {
  getCapabilities: async (): Promise<PublicCapabilities> => {
    return api.get<PublicCapabilities>('/ai/capabilities');
  },

  getAdminSettings: async (): Promise<AdminAiSettings> => {
    return api.get<AdminAiSettings>('/admin/ai-settings');
  },

  updateAdminSettings: async (payload: {
    master?: boolean;
    features?: Partial<Record<AiFeatureKey, boolean>>;
  }): Promise<AdminAiSettings> => {
    return api.patch<AdminAiSettings>('/admin/ai-settings', payload);
  },

  testConnectivity: async (): Promise<{
    status: string;
    model: string;
    latencyMs: number;
    tokensUsed: number;
    timestamp: string;
  }> => {
    return api.post('/admin/ai-settings/test-connectivity');
  },

  smartSearch: async (data: {
    query: string;
    sessionPreferences?: any;
    referenceDate?: string;
    limit?: number;
  }) => {
    return api.post('/ai/search', data);
  },

  compareStays: async (data: {
    propertyIds: string[];
    checkIn?: string;
    checkOut?: string;
    guests?: any;
  }) => {
    return api.post('/ai/compare', data);
  },

  askListingQuestion: async (data: {
    propertyId: string;
    question: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }) => {
    return api.post('/ai/listing-qa', data);
  },

  createGuestReplyDraft: async (
    data: {
      propertyId: string;
      guestUserId: string;
      instruction?: string;
      tone?: string;
      language?: string;
    },
    options?: RequestInit,
  ) => {
    return api.post('/ai/hosting/guest-reply-draft', data, options);
  },

  evaluateListingQuality: async (
    data: {
      propertyId: string;
      generateDescriptionDraft?: boolean;
      targetAudience?: string;
    },
    options?: RequestInit,
  ) => {
    return api.post('/ai/hosting/listing-quality', data, options);
  },
};
