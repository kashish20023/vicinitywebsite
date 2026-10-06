'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { Plus, Tag as TagIcon, Sparkles, Trash2, Edit3, RefreshCw, Loader2, Check, ShieldCheck, Flame, Home, Award } from 'lucide-react';

interface AmenityItem {
  id: string;
  name: string;
  icon?: string;
  category?: string;
}

interface TagItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  propertyOrder?: string[];
  createdAt: string;
}

const CATEGORIES = ['Essentials', 'Features', 'Location', 'Safety', 'Luxury'];
const PRESET_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#111827'];

export default function AdminAmenitiesTagsPage() {
  const [activeTab, setActiveTab] = useState<'amenities' | 'tags'>('amenities');
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Filter for Amenities
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityItem | null>(null);

  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);

  // Amenity Form State
  const [amenityName, setAmenityName] = useState('');
  const [amenityIcon, setAmenityIcon] = useState('Sparkles');
  const [amenityCategory, setAmenityCategory] = useState('Essentials');
  const [savingAmenity, setSavingAmenity] = useState(false);

  // Tag Form State
  const [tagName, setTagName] = useState('');
  const [tagIcon, setTagIcon] = useState('Award');
  const [tagColor, setTagColor] = useState('#EF4444');
  const [tagDescription, setTagDescription] = useState('');
  const [savingTag, setSavingTag] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [amenitiesRes, tagsRes] = await Promise.all([
        api.get<AmenityItem[]>('/amenities').catch(() => []),
        api.get<TagItem[]>('/tags').catch(() => []),
      ]);
      setAmenities(amenitiesRes || []);
      setTags(tagsRes || []);
    } catch (err) {
      console.error('Error fetching amenities and tags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Amenity Handlers
  const resetAmenityForm = () => {
    setAmenityName('');
    setAmenityIcon('Sparkles');
    setAmenityCategory('Essentials');
    setEditingAmenity(null);
  };

  const handleOpenCreateAmenity = () => {
    resetAmenityForm();
    setShowAmenityModal(true);
  };

  const handleOpenEditAmenity = (item: AmenityItem) => {
    setEditingAmenity(item);
    setAmenityName(item.name);
    setAmenityIcon(item.icon || 'Sparkles');
    setAmenityCategory(item.category || 'Essentials');
    setShowAmenityModal(true);
  };

  const handleSaveAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAmenity(true);
    const payload = { name: amenityName, icon: amenityIcon, category: amenityCategory };

    try {
      if (editingAmenity) {
        await api.patch(`/amenities/${editingAmenity.id}`, payload);
      } else {
        await api.post('/amenities', payload);
      }
      setShowAmenityModal(false);
      resetAmenityForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save amenity');
    } finally {
      setSavingAmenity(false);
    }
  };

  const handleDeleteAmenity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this master amenity?')) return;
    try {
      await api.delete(`/amenities/${id}`);
      setAmenities((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete amenity');
    }
  };

  // Tag Handlers
  const resetTagForm = () => {
    setTagName('');
    setTagIcon('Award');
    setTagColor('#EF4444');
    setTagDescription('');
    setEditingTag(null);
  };

  const handleOpenCreateTag = () => {
    resetTagForm();
    setShowTagModal(true);
  };

  const handleOpenEditTag = (item: TagItem) => {
    setEditingTag(item);
    setTagName(item.name);
    setTagIcon(item.icon || 'Award');
    setTagColor(item.color || '#EF4444');
    setTagDescription(item.description || '');
    setShowTagModal(true);
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTag(true);
    const payload = { name: tagName, icon: tagIcon, color: tagColor, description: tagDescription };

    try {
      if (editingTag) {
        await api.patch(`/tags/${editingTag.id}`, payload);
      } else {
        await api.post('/tags', payload);
      }
      setShowTagModal(false);
      resetTagForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save tag');
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing tag badge?')) return;
    try {
      await api.delete(`/tags/${id}`);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete tag');
    }
  };

  // Filtered Amenities
  const filteredAmenities = amenities.filter((a) => {
    const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 p-4 sm:p-8">
      {/* HEADER */}
      <PageHeader
        title="Master Amenities & Tags"
        subtitle="Manage standard property amenities by category and customize listing highlight badges."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Amenities & Tags' },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-button font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>

            {activeTab === 'amenities' ? (
              <button
                onClick={handleOpenCreateAmenity}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-button font-semibold shadow-md transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Master Amenity
              </button>
            ) : (
              <button
                onClick={handleOpenCreateTag}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-button font-semibold shadow-md transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Tag Badge
              </button>
            )}
          </div>
        }
      />

      {/* KPI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Amenities"
          value={amenities.length}
          icon={Sparkles}
          variant="rose"
          subtitle="Master Catalog"
        />

        <StatCard
          title="Categories"
          value={CATEGORIES.length}
          icon={Home}
          variant="blue"
          subtitle="Grouped Catalog"
        />

        <StatCard
          title="Listing Tag Badges"
          value={tags.length}
          icon={TagIcon}
          variant="purple"
          subtitle="Custom Badges"
        />

        <StatCard
          title="System Status"
          value="Ready"
          icon={ShieldCheck}
          variant="emerald"
          subtitle="Auto Synced"
        />
      </div>

      {/* MAIN TABS */}
      <FilterTabs
        tabs={[
          { id: 'amenities', label: 'Master Amenities Catalog', count: amenities.length },
          { id: 'tags', label: 'Listing Tag Badges', count: tags.length },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'amenities' | 'tags')}
        variant="underline"
      />

      {/* TAB 1: MASTER AMENITIES */}
      {activeTab === 'amenities' && (
        <div className="space-y-6">
          {/* CATEGORY FILTER PILLS & SEARCH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === 'All'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All ({amenities.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = amenities.filter((a) => a.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search amenities..."
              className="max-w-xs w-full"
            />
          </div>

          {/* AMENITIES TABLE */}
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Amenity Name',
                render: (a: AmenityItem) => (
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-semibold text-xs border border-rose-100">
                      ✨
                    </span>
                    {a.name}
                  </div>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                render: (a: AmenityItem) => (
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                    {a.category || 'Essentials'}
                  </span>
                ),
              },
              {
                key: 'icon',
                header: 'Icon Reference',
                cellClassName: 'font-mono text-xs text-gray-500',
                render: (a: AmenityItem) => a.icon || 'Sparkles',
              },
              {
                key: 'actions',
                header: 'Actions',
                alignRight: true,
                render: (a: AmenityItem) => (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditAmenity(a)}
                      className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition cursor-pointer"
                      title="Edit Amenity"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAmenity(a.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                      title="Delete Amenity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredAmenities}
            rowKey={(a: AmenityItem) => a.id}
            loading={loading}
            loadingMessage="Loading master amenities..."
            emptyIcon={<Sparkles className="w-10 h-10 text-gray-300 mx-auto" />}
            emptyTitle="No Amenities Found"
            emptySubtitle="Add standard property amenities to enable host selection during listing creation."
          />
        </div>
      )}

      {/* TAB 2: TAG BADGES */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Custom Listing Highlight Badges</h3>
            <span className="text-xs text-gray-500 font-semibold">{tags.length} Badges Configured</span>
          </div>

          <DataTable
            columns={[
              {
                key: 'preview',
                header: 'Badge Preview',
                render: (t: TagItem) => (
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm inline-flex items-center gap-1"
                    style={{ backgroundColor: t.color || '#EF4444' }}
                  >
                    <Award className="w-3 h-3" /> {t.name}
                  </span>
                ),
              },
              {
                key: 'name',
                header: 'Badge Name',
                cellClassName: 'font-bold text-gray-900',
                render: (t: TagItem) => t.name,
              },
              {
                key: 'description',
                header: 'Description',
                cellClassName: 'text-gray-500',
                render: (t: TagItem) => t.description || '—',
              },
              {
                key: 'color',
                header: 'Badge Color',
                render: (t: TagItem) => (
                  <div className="font-mono font-medium text-gray-700 flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: t.color || '#EF4444' }}
                    />
                    {t.color || '#EF4444'}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                alignRight: true,
                render: (t: TagItem) => (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditTag(t)}
                      className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition cursor-pointer"
                      title="Edit Tag"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(t.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                      title="Delete Tag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={tags}
            rowKey={(t: TagItem) => t.id}
            loading={loading}
            loadingMessage="Loading tag badges..."
            emptyIcon={<TagIcon className="w-10 h-10 text-gray-300 mx-auto" />}
            emptyTitle="No Tag Badges Created"
            emptySubtitle="Create highlight badges like 'Superhost Choice', 'Trending', or 'Oceanfront'."
          />
        </div>
      )}

      {/* CREATE / EDIT AMENITY MODAL */}
      <Modal
        isOpen={showAmenityModal}
        onClose={() => setShowAmenityModal(false)}
        title={editingAmenity ? 'Edit Master Amenity' : 'Add New Master Amenity'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAmenity} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Amenity Name</label>
            <input
              type="text"
              required
              placeholder="e.g. High-Speed Wi-Fi, Swimming Pool, Fireplace"
              value={amenityName}
              onChange={(e) => setAmenityName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Category</label>
            <select
              value={amenityCategory}
              onChange={(e) => setAmenityCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Icon Reference Name</label>
            <input
              type="text"
              placeholder="e.g. Wifi, Waves, ShieldCheck, Flame"
              value={amenityIcon}
              onChange={(e) => setAmenityIcon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAmenityModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAmenity}
              className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow hover:bg-rose-700 transition disabled:opacity-50"
            >
              {savingAmenity ? 'Saving...' : editingAmenity ? 'Update Amenity' : 'Save Amenity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT TAG MODAL */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title={editingTag ? 'Edit Listing Tag Badge' : 'Add New Listing Tag Badge'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveTag} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tag Badge Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Superhost Choice, Top Rated, Beachfront"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Badge Theme Color</label>
            <div className="flex items-center gap-2 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTagColor(color)}
                  className={`h-6 w-6 rounded-full border border-gray-300 transition ${
                    tagColor === color ? 'ring-2 ring-purple-600 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="text"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Assigned to properties with rating > 4.8"
              value={tagDescription}
              onChange={(e) => setTagDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="block text-overline font-semibold text-neutral-500 uppercase tracking-wider mb-1">Live Badge Preview</span>
            <span
              className="px-3 py-1 rounded-full text-overline font-semibold uppercase tracking-wider text-white shadow-sm inline-flex items-center gap-1"
              style={{ backgroundColor: tagColor || '#EF4444' }}
            >
              <Award className="w-3.5 h-3.5" /> {tagName || 'Sample Badge'}
            </span>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowTagModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTag}
              className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl shadow hover:bg-purple-700 transition disabled:opacity-50"
            >
              {savingTag ? 'Saving...' : editingTag ? 'Update Tag' : 'Save Tag'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
