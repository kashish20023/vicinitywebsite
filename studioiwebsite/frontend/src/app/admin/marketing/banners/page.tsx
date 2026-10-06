'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Sparkles, Plus, Trash2, ToggleLeft, ToggleRight, 
  Search, Eye, RefreshCw, Loader2, Tag as TagIcon, X, Check
} from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  couponCode?: string;
  isActive: boolean;
  actionType: 'form' | 'coupon' | 'link';
  views: number;
  submissions: number;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([
    {
      id: 'banner-jaipur-promo',
      title: 'Experience Studio i Lehariya Flagship',
      description: 'Book your first Day Pass or Cabin Suite with ₹500 off using code JAIPUR500.',
      couponCode: 'JAIPUR500',
      isActive: true,
      actionType: 'coupon',
      views: 1240,
      submissions: 182
    },
    {
      id: 'banner-flexi-team',
      title: 'Dedicated Team Pods for Tech Startups',
      description: 'Leave your details to schedule a curated walkthrough with our Community Manager.',
      isActive: true,
      actionType: 'form',
      views: 890,
      submissions: 94
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    couponCode: '',
    actionType: 'coupon' as const,
  });

  const handleToggle = (id: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this banner offer?')) {
      setBanners(banners.filter(b => b.id !== id));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newB: Banner = {
      id: `banner-${Date.now()}`,
      title: form.title || 'Studio i Exclusive Deal',
      description: form.description || 'Special coworking pricing.',
      couponCode: form.couponCode,
      isActive: true,
      actionType: form.actionType,
      views: 0,
      submissions: 0
    };
    setBanners([...banners, newB]);
    setShowCreateModal(false);
    setForm({ title: '', description: '', couponCode: '', actionType: 'coupon' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Promotional Banners & Coupons</h1>
          <p className="text-xs text-neutral-500 mt-1">Configure pop-up offers, lead capture magnets, and checkout coupons.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Offer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="bg-white border-neutral-200/80 overflow-hidden">
            {/* Visual Header */}
            <div className="bg-linear-to-r from-[#0e4962] to-[#1a6585] p-6 text-white relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  {banner.actionType.toUpperCase()} OFFER
                </span>
                <Badge variant={banner.isActive ? 'success' : 'default'} className="bg-white/90 text-neutral-900">
                  {banner.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <h3 className="text-lg font-bold">{banner.title}</h3>
              <p className="text-xs text-pink-100 mt-1">{banner.description}</p>
            </div>

            <CardContent className="p-5 space-y-4">
              {banner.couponCode && (
                <div className="flex items-center justify-between p-3 bg-[#edf4f7]/50 rounded-xl border border-[#adcada] text-xs">
                  <span className="text-neutral-600 font-medium">Coupon Code:</span>
                  <span className="font-mono font-bold text-[#0e4962] bg-white px-2.5 py-1 rounded border border-pink-300">
                    {banner.couponCode}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                <span>Impressions: <strong className="text-neutral-900">{banner.views}</strong></span>
                <span>Conversions: <strong className="text-neutral-900">{banner.submissions}</strong></span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <button
                  onClick={() => handleToggle(banner.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  {banner.isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-neutral-400" />
                  )}
                  <span>{banner.isActive ? 'Enabled' : 'Disabled'}</span>
                </button>

                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-neutral-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Create Promotion Banner</h3>
              <button onClick={() => setShowCreateModal(false)} type="button">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Headline Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Jaipur Tech Startup Special"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#0e4962]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                required
                placeholder="Brief pitch about the discount or workspace benefit..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#0e4962]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. FESTIVE2026"
                value={form.couponCode}
                onChange={e => setForm({ ...form, couponCode: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs uppercase font-mono focus:outline-none focus:border-[#0e4962]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl hover:bg-[#093447]"
              >
                Publish Offer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
