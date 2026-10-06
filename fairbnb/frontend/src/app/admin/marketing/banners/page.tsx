'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Plus, Eye, UserCheck, Percent, Trash2, Edit3, ToggleLeft, ToggleRight, Sparkles, RefreshCw, Loader2 } from 'lucide-react';

interface CouponOption {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
}

interface BannerItem {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  couponId?: string;
  coupon?: CouponOption;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  triggerType: string;
  triggerValue: number;
  actionType: string;
  targetPages: string[];
  views: number;
  submissions: number;
  createdAt: string;
}

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  couponCode?: string;
  createdAt: string;
  banner?: {
    title?: string;
    actionType?: string;
  };
}

export default function AdminBannersPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'leads'>('banners');
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [coupons, setCoupons] = useState<CouponOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [couponId, setCouponId] = useState('');
  const [triggerType, setTriggerType] = useState('delay');
  const [triggerValue, setTriggerValue] = useState(5);
  const [actionType, setActionType] = useState('form');
  const [targetPages, setTargetPages] = useState('/');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lead Filter State
  const [leadSearch, setLeadSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bannersRes, leadsRes, couponsRes] = await Promise.all([
        api.get<BannerItem[]>('/banners').catch(() => []),
        api.get<LeadItem[]>('/banners/leads').catch(() => []),
        api.get<CouponOption[]>('/coupons').catch(() => []),
      ]);
      setBanners(bannersRes || []);
      setLeads(leadsRes || []);
      setCoupons(couponsRes || []);
    } catch (err) {
      console.error('Error loading banner management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setLinkUrl('');
    setCouponId('');
    setTriggerType('delay');
    setTriggerValue(5);
    setActionType('form');
    setTargetPages('/');
    setIsActive(true);
    setEditingBanner(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setDescription(banner.description || '');
    setImageUrl(banner.imageUrl || '');
    setLinkUrl(banner.linkUrl || '');
    setCouponId(banner.couponId || '');
    setTriggerType(banner.triggerType || 'delay');
    setTriggerValue(banner.triggerValue ?? 5);
    setActionType(banner.actionType || 'form');
    setTargetPages(banner.targetPages ? banner.targetPages.join(', ') : '/');
    setIsActive(banner.isActive);
    setShowCreateModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const pagesArray = targetPages
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      title,
      description,
      imageUrl,
      linkUrl,
      couponId: couponId || undefined,
      triggerType,
      triggerValue: Number(triggerValue),
      actionType,
      targetPages: pagesArray,
      isActive,
    };

    try {
      if (editingBanner) {
        await api.patch(`/banners/${editingBanner.id}`, payload);
      } else {
        await api.post('/banners', payload);
      }
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Failed to save banner:', err);
      alert('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (banner: BannerItem) => {
    try {
      await api.patch(`/banners/${banner.id}`, { isActive: !banner.isActive });
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch (err) {
      console.error('Failed to toggle banner status:', err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marketing banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  // KPI Calculations
  const totalViews = banners.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalSubmissions = banners.reduce((sum, b) => sum + (b.submissions || 0), 0);
  const overallConversion = totalViews > 0 ? ((totalSubmissions / totalViews) * 100).toFixed(1) : '0';

  const filteredLeads = leads.filter((l) => {
    if (!leadSearch) return true;
    const q = leadSearch.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      (l.couponCode && l.couponCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 p-4 sm:p-8">
      {/* HEADER */}
      <PageHeader
        title="Promotional Banners & Leads"
        subtitle="Manage popup campaigns, target guest pages, offer discount coupons & track captured leads."
        badge={
          <span className="flex items-center gap-1.5 text-rose-600 font-semibold text-overline uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
            <Sparkles className="w-3.5 h-3.5" /> Marketing & Conversions
          </span>
        }
        actions={
          <>
            <button
              onClick={fetchData}
              className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-button font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create New Banner
            </button>
          </>
        }
      />

      {/* KPI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Banners"
          value={banners.length}
          subtitle={`${banners.filter((b) => b.isActive).length} Active`}
          icon={Sparkles}
          variant="rose"
        />
        <StatCard
          label="Total Impressions"
          value={totalViews}
          subtitle="Popup views count"
          icon={Eye}
          variant="blue"
        />
        <StatCard
          label="Captured Leads"
          value={totalSubmissions}
          subtitle="Guest form entries"
          icon={UserCheck}
          variant="emerald"
        />
        <StatCard
          label="Conversion Rate"
          value={`${overallConversion}%`}
          subtitle="Lead / Impression ratio"
          icon={Percent}
          variant="purple"
        />
      </div>

      {/* TABS */}
      <FilterTabs
        variant="underline"
        tabs={[
          { id: 'banners', label: 'Campaign Banners', count: banners.length },
          { id: 'leads', label: 'Captured Leads Directory', count: leads.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: BANNERS LIST */}
      {activeTab === 'banners' && (
        <DataTable
          columns={[
            {
              key: 'banner',
              header: 'Banner Info',
              render: (b: BannerItem) => (
                <div className="flex items-center gap-3">
                  {b.imageUrl ? (
                    <img
                      src={b.imageUrl}
                      alt={b.title || 'Banner'}
                      className="h-10 w-16 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="h-10 w-16 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                      Banner
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{b.title || 'Untitled Banner'}</p>
                    {b.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{b.description}</p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'actionCoupon',
              header: 'Action & Coupon',
              render: (b: BannerItem) => (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-700 capitalize">Type: {b.actionType}</span>
                  {b.coupon && (
                    <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded w-fit">
                      {b.coupon.code} ({b.coupon.discountValue}
                      {b.coupon.discountType === 'PERCENTAGE' ? '%' : ' INR'})
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'targetPages',
              header: 'Target Pages',
              render: (b: BannerItem) => (
                <div className="flex flex-wrap gap-1">
                  {b.targetPages && b.targetPages.length > 0 ? (
                    b.targetPages.map((p, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                      All (*)
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'trigger',
              header: 'Trigger',
              cellClassName: 'text-xs font-medium text-gray-600 capitalize',
              render: (b: BannerItem) => `${b.triggerType} (${b.triggerValue}s)`,
            },
            {
              key: 'views',
              header: 'Views',
              cellClassName: 'text-center font-semibold font-tabular text-neutral-800',
              render: (b: BannerItem) => b.views,
            },
            {
              key: 'leads',
              header: 'Leads',
              cellClassName: 'text-center',
              render: (b: BannerItem) => {
                const conv = b.views > 0 ? ((b.submissions / b.views) * 100).toFixed(1) : '0';
                return (
                  <div className="flex flex-col items-center">
                    <span className="font-semibold font-tabular text-rose-600">{b.submissions}</span>
                    <span className="text-caption font-tabular text-neutral-400">({conv}%)</span>
                  </div>
                );
              },
            },
            {
              key: 'status',
              header: 'Status',
              cellClassName: 'text-center',
              render: (b: BannerItem) => (
                <button
                  onClick={() => handleToggleStatus(b)}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  {b.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <ToggleRight className="w-4 h-4 text-emerald-600" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                      <ToggleLeft className="w-4 h-4 text-gray-400" /> Inactive
                    </span>
                  )}
                </button>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              alignRight: true,
              render: (b: BannerItem) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition cursor-pointer"
                    title="Edit Banner"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={banners}
          rowKey={(b: BannerItem) => b.id}
          loading={loading}
          loadingMessage="Loading campaign banners..."
          emptyIcon={<Sparkles className="w-10 h-10 text-gray-300 mx-auto" />}
          emptyTitle="No Banners Created Yet"
          emptySubtitle="Create promotional popups to capture guest phone numbers & offer discount coupons."
        />
      )}

      {/* TAB 2: LEADS DIRECTORY */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SearchInput
              value={leadSearch}
              onChange={setLeadSearch}
              placeholder="Search leads by name, phone, email, coupon..."
              className="max-w-sm w-full"
            />
            <span className="text-xs text-gray-500 font-semibold">
              Showing {filteredLeads.length} of {leads.length} total leads
            </span>
          </div>

          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Guest Name',
                cellClassName: 'font-bold text-gray-900',
                render: (l: LeadItem) => l.name,
              },
              {
                key: 'phone',
                header: 'Phone Number',
                cellClassName: 'font-mono font-medium text-gray-800',
                render: (l: LeadItem) => l.phone,
              },
              {
                key: 'email',
                header: 'Email',
                cellClassName: 'text-gray-600',
                render: (l: LeadItem) => l.email || '—',
              },
              {
                key: 'coupon',
                header: 'Assigned Coupon',
                render: (l: LeadItem) =>
                  l.couponCode ? (
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {l.couponCode}
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  ),
              },
              {
                key: 'source',
                header: 'Source Banner',
                cellClassName: 'text-gray-700 font-medium',
                render: (l: LeadItem) => l.banner?.title || 'Marketing Popup',
              },
              {
                key: 'date',
                header: 'Captured At',
                alignRight: true,
                cellClassName: 'text-gray-500',
                render: (l: LeadItem) => new Date(l.createdAt).toLocaleString(),
              },
            ]}
            data={filteredLeads}
            rowKey={(l: LeadItem) => l.id}
            emptyTitle="No Captured Leads"
            emptySubtitle="No captured leads found matching search query."
          />
        </div>
      )}

      {/* CREATE / EDIT BANNER MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingBanner ? 'Edit Campaign Banner' : 'Create New Campaign Banner'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Banner Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Special Weekend Offer - 20% Off!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description / Subtitle</label>
            <textarea
              rows={2}
              placeholder="e.g. Enter your contact details to unlock an instant discount coupon."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm bg-white"
              >
                <option value="form">Lead Capture Form (Name + Phone)</option>
                <option value="link">CTA Link Button</option>
                <option value="coupon">Direct Coupon Code Display</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Link Coupon Code</label>
              <select
                value={couponId}
                onChange={(e) => setCouponId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm bg-white"
              >
                <option value="">-- No Coupon --</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} ({c.discountValue}
                    {c.discountType === 'PERCENTAGE' ? '%' : ' INR'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Trigger Type</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm bg-white"
              >
                <option value="delay">Time Delay (Seconds)</option>
                <option value="instant">Instant on Load</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Trigger Delay (Seconds)</label>
              <input
                type="number"
                min={0}
                value={triggerValue}
                onChange={(e) => setTriggerValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Target Pages (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. /, /properties, /book (leave / for homepage or * for all)"
              value={targetPages}
              onChange={(e) => setTargetPages(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Banner Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
            />
          </div>

          {actionType === 'link' && (
            <div>
              <label className="block font-bold text-gray-700 mb-1">Redirect Link URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
            />
            <label htmlFor="isActiveToggle" className="font-bold text-gray-800 text-sm">
              Active Immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow hover:bg-rose-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Publish Banner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
