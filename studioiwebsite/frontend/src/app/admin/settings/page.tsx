'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Settings, Save, Shield, Clock, DollarSign, Check } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    defaultTaxPercent: 18,
    holdingTimeoutMinutes: 15,
    payoutThresholdInr: 5000,
    openHours: '08:00',
    closeHours: '20:00',
    simulationMode: true
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Platform Settings</h1>
          <p className="text-xs text-neutral-500 mt-1">Configure global pricing rules, holding concurrency limits, and platform parameters.</p>
        </div>
        {saved && (
          <Badge variant="success" className="text-xs py-1 px-3 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Settings Saved Successfully</span>
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Financial & GST */}
          <Card className="bg-white border-neutral-200/80">
            <CardHeader>
              <CardTitle>Financial & Taxation Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Standard GST Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.defaultTaxPercent}
                  onChange={e => setSettings({ ...settings, defaultTaxPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0e4962]"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">Applied to Day Pass and Cabin reservations.</span>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Host Payout Minimum Threshold (₹)</label>
                <input
                  type="number"
                  value={settings.payoutThresholdInr}
                  onChange={e => setSettings({ ...settings, payoutThresholdInr: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0e4962]"
                />
              </div>

              <div className="pt-2">
                <span className="font-bold text-neutral-700 block mb-1">Payment Provider Mode</span>
                <Badge variant="pink">LOCAL SIMULATION MODE (ACTIVE)</Badge>
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Transactions execute instantaneously via verified simulation provider without external gateways.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours & Concurrency */}
          <Card className="bg-white border-neutral-200/80">
            <CardHeader>
              <CardTitle>Seating Holds & Concurrency Timing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Exclusive Seat Hold Timeout (Minutes)</label>
                <input
                  type="number"
                  value={settings.holdingTimeoutMinutes}
                  onChange={e => setSettings({ ...settings, holdingTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0e4962]"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Protects concurrent users from double-booking selected 2D desk positions.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Opening Hour</label>
                  <input
                    type="time"
                    value={settings.openHours}
                    onChange={e => setSettings({ ...settings, openHours: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0e4962]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Closing Hour</label>
                  <input
                    type="time"
                    value={settings.closeHours}
                    onChange={e => setSettings({ ...settings, closeHours: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0e4962]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
}
