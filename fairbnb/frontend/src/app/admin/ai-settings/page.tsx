'use client';

import React, { useState, useEffect } from 'react';
import { aiApi, type AdminAiSettings, type AiFeatureKey } from '@/features/ai/ai.api';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Activity,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function AdminAiSettingsPage() {
  const [settings, setSettings] = useState<AdminAiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await aiApi.getAdminSettings();
      setSettings(data);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load AI admin settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleMaster = async () => {
    if (!settings) return;
    const newMaster = !settings.master;

    if (newMaster && !settings.aiAllowedEnv) {
      setErrorMessage('Cannot turn ON AI master: AI_ALLOWED is set to false in server environment.');
      return;
    }

    try {
      setUpdating(true);
      const updated = await aiApi.updateAdminSettings({ master: newMaster });
      setSettings(updated);
      setSuccessMessage(`AI Master Switch turned ${newMaster ? 'ON' : 'OFF'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update master switch');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFeature = async (key: AiFeatureKey) => {
    if (!settings || !settings.master) return;
    const currentVal = settings.features[key];
    const newVal = !currentVal;

    try {
      setUpdating(true);
      const updated = await aiApi.updateAdminSettings({
        features: { [key]: newVal },
      });
      setSettings(updated);
      setSuccessMessage(`Feature '${key}' updated to ${newVal ? 'ON' : 'OFF'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update feature flag');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestConnectivity = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setErrorMessage(null);
      const res = await aiApi.testConnectivity();
      setTestResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connectivity test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-neutral-600 font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
          Loading AI Runtime Controls...
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl">
          {errorMessage || 'Failed to access AI settings. Ensure you have administrator permissions.'}
        </div>
      </div>
    );
  }

  const featureMetadata: Record<AiFeatureKey, { title: string; description: string }> = {
    smartSearch: {
      title: 'Smart Search & Natural Language Ranking',
      description: 'Hinglish query extraction, date resolution, and factual match reasons.',
    },
    stayComparison: {
      title: 'Multi-Stay Comparison',
      description: 'Side-by-side comparison of 2-4 stays with identical dates, currency, and quotes.',
    },
    listingQa: {
      title: 'Grounded Listing Q&A',
      description: 'Answers guest inquiries strictly using verified facts with source citations.',
    },
    guestReplyDraft: {
      title: 'Host Guest Reply Drafts',
      description: 'Permission-checked draft suggestions requiring human review before sending.',
    },
    listingQuality: {
      title: 'Host Listing Quality & Copywriter',
      description: 'Deterministic quality rubric and grounded listing description generation.',
    },
  };

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">AI Runtime Controls</h1>
            <span className="bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Server Controlled
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Manage global and per-feature AI capabilities. All changes are enforced in real time.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="p-2 border border-neutral-200 hover:border-neutral-300 rounded-xl text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
          title="Refresh Settings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          {errorMessage}
        </div>
      )}

      {/* Single Process Notice Callout */}
      <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Single-Process In-Memory Safety Guard: </span>
          AI master and feature toggles reside strictly in server memory without persistent database writes. All toggles safely reset to <span className="font-bold">OFF</span> upon any backend process restart.
        </div>
      </div>

      {/* Master Switch Card */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-neutral-900">AI Master Switch</h2>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  settings.master
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                }`}
              >
                {settings.master ? 'ACTIVE / ON' : 'DISABLED / OFF'}
              </span>
            </div>
            <p className="text-sm text-neutral-500 max-w-xl">
              Disabling the master switch instantly cuts off all AI endpoints with an HTTP 503 response and cancels any active in-flight requests.
            </p>
          </div>

          <button
            onClick={handleToggleMaster}
            disabled={updating || !settings.aiAllowedEnv}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.master ? 'bg-rose-600' : 'bg-neutral-200'
            } ${!settings.aiAllowedEnv ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.master ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {!settings.aiAllowedEnv && (
          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs text-rose-600 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Server environment variable AI_ALLOWED is not &quot;true&quot;. Master toggle is locked.
          </div>
        )}
      </div>

      {/* Individual Feature Toggles */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-base font-bold text-neutral-900">Authorized AI Features</h2>
          <p className="text-xs text-neutral-500">
            Individual features can only be enabled when the Master Switch is ON.
          </p>
        </div>

        <div className="divide-y divide-neutral-100">
          {(Object.keys(featureMetadata) as AiFeatureKey[]).map((key) => {
            const meta = featureMetadata[key];
            const isEnabled = settings.master && Boolean(settings.features[key]);
            const isLocked = !settings.master;

            return (
              <div key={key} className="py-4 flex items-center justify-between first:pt-2 last:pb-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">{meta.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{meta.description}</p>
                </div>

                <button
                  onClick={() => handleToggleFeature(key)}
                  disabled={updating || isLocked}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-rose-500' : 'bg-neutral-200'
                  } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider Connectivity & Diagnostics */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-neutral-700" />
            <h2 className="text-base font-bold text-neutral-900">Provider & Diagnostics</h2>
          </div>
          <span className="text-xs font-mono bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg">
            Model: {settings.activeModel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <span className="text-neutral-400 font-semibold block mb-1">API Key Configured</span>
            <div className="flex items-center gap-1.5 font-bold">
              {settings.hasApiKey ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Present (Server-only)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-700">Missing GROQ_API_KEY</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <span className="text-neutral-400 font-semibold block mb-1">Runtime Version</span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-800">
              <Activity className="w-4 h-4 text-neutral-600" />
              <span>Version {settings.version}</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <span className="text-neutral-400 font-semibold block mb-1">Last Updated</span>
            <div className="font-mono text-neutral-700">
              {new Date(settings.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleTestConnectivity}
            disabled={testing || !settings.hasApiKey}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {testing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{testing ? 'Testing Groq Ping...' : 'Test Groq Connectivity'}</span>
          </button>

          {testResult && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Connectivity Verified: {testResult.status}
              </div>
              <div className="text-emerald-700 font-mono text-[11px]">
                Model: {testResult.model} | Latency: {testResult.latencyMs}ms | Tokens: {testResult.tokensUsed}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
