'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { 
  Wifi, Coffee, Monitor, Shield, Zap, Lock, 
  Printer, Headphones, Plus, Trash2, Edit3, Tag as TagIcon
} from 'lucide-react';

export default function AdminAmenitiesTagsPage() {
  const [amenities, setAmenities] = useState([
    { id: '1', name: 'Gigabit Fiber WiFi', category: 'Essentials', icon: 'Wifi' },
    { id: '2', name: 'Specialty Espresso Bar', category: 'Wellness', icon: 'Coffee' },
    { id: '3', name: 'Biometric Access Control', category: 'Safety', icon: 'Lock' },
    { id: '4', name: 'Dual Monitor Support', category: 'Technology', icon: 'Monitor' },
    { id: '5', name: 'Acoustic Phone Booths', category: 'Facilities', icon: 'Headphones' },
    { id: '6', name: '100% DG Power Backup', category: 'Essentials', icon: 'Zap' },
  ]);

  const [tags, setTags] = useState([
    { id: 't1', name: 'Jaipur Flagship', color: '#0e4962' },
    { id: 't2', name: 'High-Speed Verified', color: '#10B981' },
    { id: 't3', name: 'Executive Suite', color: '#8B5CF6' },
    { id: 't4', name: 'Immediate Move-in', color: '#F59E0B' },
  ]);

  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [newAmenity, setNewAmenity] = useState({ name: '', category: 'Essentials' });

  const handleAddAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenity.name) return;
    setAmenities([...amenities, { id: `a-${Date.now()}`, name: newAmenity.name, category: newAmenity.category, icon: 'Zap' }]);
    setNewAmenity({ name: '', category: 'Essentials' });
    setShowAmenityModal(false);
  };

  const amenitiesTab = (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-neutral-500">Standard amenities attached to workspaces and 2D floor plans.</p>
        <button
          onClick={() => setShowAmenityModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl hover:bg-[#093447] transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Amenity</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {amenities.map(a => (
          <div key={a.id} className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-900">{a.name}</p>
              <Badge variant="default" className="text-[10px] mt-1">{a.category}</Badge>
            </div>
            <button
              onClick={() => setAmenities(amenities.filter(item => item.id !== a.id))}
              className="text-neutral-400 hover:text-red-600 transition p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const tagsTab = (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-neutral-500">Marketing and visual badges displayed across workspace exploration.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {tags.map(t => (
          <div key={t.id} className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex items-center justify-between">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: t.color }}
            >
              {t.name}
            </span>
            <button
              onClick={() => setTags(tags.filter(item => item.id !== t.id))}
              className="text-neutral-400 hover:text-red-600 transition p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'amenities', label: 'Amenities Catalog', content: amenitiesTab },
    { id: 'tags', label: 'Space Badges & Tags', content: tagsTab },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Amenities & Badges</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage catalog features and search filters for all coworking locations.</p>
      </div>

      <Card className="bg-white border-neutral-200/80">
        <CardContent className="p-6">
          <Tabs tabs={tabs} defaultTabId="amenities" />
        </CardContent>
      </Card>

      {showAmenityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleAddAmenity} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-neutral-200 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900">Add New Amenity</h3>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Amenity Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ergonomic Standing Desks"
                value={newAmenity.name}
                onChange={e => setNewAmenity({ ...newAmenity, name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#0e4962]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Category</label>
              <select
                value={newAmenity.category}
                onChange={e => setNewAmenity({ ...newAmenity, category: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#0e4962]"
              >
                <option>Essentials</option>
                <option>Technology</option>
                <option>Facilities</option>
                <option>Wellness</option>
                <option>Safety</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAmenityModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl hover:bg-[#093447]"
              >
                Save Amenity
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
