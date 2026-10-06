'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Film, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [reelsEnabled, setReelsEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ settings: Record<string, any> }>('/admin-settings');
      if (res && res.settings && typeof res.settings.REELS_FEATURE_ENABLED !== 'undefined') {
        setReelsEnabled(Boolean(res.settings.REELS_FEATURE_ENABLED));
      }
    } catch {
      // Fallback default: enabled
      setReelsEnabled(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleReels = async (newVal: boolean) => {
    setIsUpdating(true);
    setMessage(null);
    try {
      await api.patch('/admin-settings', {
        key: 'REELS_FEATURE_ENABLED',
        value: newVal,
        description: 'Global Admin Feature Flag for FairBnB Reels Discovery Feature',
      });
      setReelsEnabled(newVal);
      setMessage(
        newVal
          ? 'FairBnB Reels discovery feature has been ENABLED globally.'
          : 'FairBnB Reels discovery feature has been DISABLED globally.',
      );
    } catch (err: any) {
      setMessage(err?.message || 'Failed to update feature flag setting.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Platform Feature Flags"
        subtitle="Control global feature availability and platform operational toggles."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Feature Flags' },
        ]}
      />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${reelsEnabled
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
          >
            {reelsEnabled ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="p-6 bg-gray-50/80 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white shadow-xs rounded-xl text-[#0e4962] border border-gray-100">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-base">
                    FairBnB Reels Discovery Feature
                  </h3>
                  <StatusBadge
                    status={reelsEnabled ? 'ACTIVE' : 'INACTIVE'}
                    label={reelsEnabled ? 'ENABLED' : 'DISABLED'}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1 max-w-lg leading-relaxed">
                  When enabled, Hosts can upload video tours and guests can browse short-video stays on /reels.
                  When disabled, user-facing Reels feed access, engagement, and video upload APIs are blocked globally.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isLoading || isUpdating ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleReels(!reelsEnabled)}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${reelsEnabled ? 'bg-[#0e4962]' : 'bg-gray-300'
                    }`}
                  role="switch"
                  aria-checked={reelsEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${reelsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
