'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Check,
  Building2,
  Home,
  Building,
  Trees,
  Palmtree,
  Sparkles,
  Gem,
  MapPin,
  ChevronDown,
  Tag,
  Image as ImageIcon,
  FileText,
  Globe,
  Bed,
  Bath,
  Users,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Percent,
  Zap,
  Calendar as CalendarIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Shield,
  Star,
  DollarSign,
  Info,
} from 'lucide-react';

import { ImageUploader } from '@/components/ui/ImageUploader';

export interface PropertyData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  propertyType?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  basePrice?: number;
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  minNights?: number;
  cancellationPolicy?: string;
  images?: string[];
  instantBook?: boolean;
  disableWeekendPartial?: boolean;
  taxRate?: number;
  listingPurpose?: 'short-term' | 'long-term';
  status?: string;
  badges?: {
    isNew?: boolean;
    topRated?: boolean;
    verifiedHost?: boolean;
  };
}

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyData;
  onSave?: (updatedProperty: PropertyData) => void;
}

export function EditPropertyModal({
  isOpen,
  onClose,
  property,
  onSave,
}: EditPropertyModalProps) {
  // Active step index (0: Basic Info, 1: Location, 2: Amenities, 3: Pricing, 4: Photos, 5: Policies, 6: Publish)
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form State
  const [formData, setFormData] = useState<PropertyData>({
    ...property,
    category: property.category || 'Farm',
    propertyType: property.propertyType || 'Entire place',
    listingPurpose: property.listingPurpose || 'short-term',
    badges: {
      isNew: property.badges?.isNew ?? true,
      topRated: property.badges?.topRated ?? false,
      verifiedHost: property.badges?.verifiedHost ?? true,
    },
    instantBook: property.instantBook ?? false,
    disableWeekendPartial: property.disableWeekendPartial ?? false,
    taxRate: property.taxRate ?? 0,
    basePrice: property.basePrice || 14000,
    bedrooms: property.bedrooms || 5,
    bathrooms: property.bathrooms || 1,
    maxGuests: property.maxGuests || 15,
    title: property.title || 'This is a 5bhk property',
    city: property.city || 'Jaipur',
    country: property.country || 'India',
    images: property.images && property.images.length > 0 ? property.images : [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    ],
  });

  // Photo Preview Index in Sidebar
  const [sidebarPhotoIdx, setSidebarPhotoIdx] = useState(0);

  // Tax Rate Inline Editing State
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [taxInputVal, setTaxInputVal] = useState(String(formData.taxRate || 0));

  // Step definitions matching Image 1
  const steps = [
    { id: 'basic', label: 'Basic Info', icon: Home },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'amenities', label: 'Amenities', icon: Home },
    { id: 'pricing', label: 'Pricing', icon: Tag },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'publish', label: 'Publish', icon: Globe },
  ];

  // Property Place Categories (Image 1 Grid)
  const placeCategories = [
    { id: 'Apartment', label: 'Apartment', icon: Building2 },
    { id: 'House', label: 'House', icon: Home },
    { id: 'Villa', label: 'Villa', icon: Building },
    { id: 'Cabin', label: 'Cabin', icon: Trees },
    { id: 'Farm', label: 'Farm', icon: Home },
    { id: 'Beachfront', label: 'Beachfront', icon: Palmtree },
    { id: 'Luxury', label: 'Luxury', icon: Sparkles },
    { id: 'Tiny home', label: 'Tiny home', icon: Home },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  const toggleBadge = (badgeKey: 'isNew' | 'topRated' | 'verifiedHost') => {
    setFormData((prev) => ({
      ...prev,
      badges: {
        ...prev.badges,
        [badgeKey]: !prev.badges?.[badgeKey],
      },
    }));
  };

  const saveTaxRate = () => {
    const val = parseFloat(taxInputVal) || 0;
    setFormData((prev) => ({ ...prev, taxRate: val }));
    setIsEditingTax(false);
  };

  const sidebarImages = formData.images && formData.images.length > 0 ? formData.images : [];
  const activeMainImage = sidebarImages[sidebarPhotoIdx] || sidebarImages[0] || '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#0b0f19] text-slate-100 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-800/80 shadow-2xl">
        {/* TOP BAR / MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition cursor-pointer"
              title="Close"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-h3 font-bold text-white tracking-tight">Edit Property</h2>
              <p className="text-body-sm text-slate-400 font-normal">Update property details, amenities and settings.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP WIZARD NAVIGATION BAR (MATCHING IMAGE 1 STEP BAR) */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-800/60 bg-[#0b0f19] overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] max-w-4xl mx-auto px-4 relative">
            {/* Horizontal Line behind icons */}
            <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-800 -z-0" />
            <div
              className="absolute top-4 left-10 h-0.5 bg-amber-400 transition-all duration-300 -z-0"
              style={{
                width: `${(currentStep / (steps.length - 1)) * 90}%`,
              }}
            />

            {steps.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              const IconComp = step.icon;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(idx)}
                  className="flex flex-col items-center gap-2 group z-10 focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 ${
                      isCompleted
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                        : isActive
                        ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 font-bold'
                        : 'bg-[#131b2e] border border-slate-700 text-slate-400 group-hover:border-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <IconComp className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-caption font-semibold transition ${
                      isActive
                        ? 'text-white font-bold'
                        : isCompleted
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN BODY: 2 COLUMN GRID LAYOUT */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT FORM PANEL (65% width) */}
            <div className="lg:col-span-2 space-y-8">
            {/* STEP 0: BASIC INFO */}
            {currentStep === 0 && (
              <div className="space-y-7 animate-in fade-in duration-300">
                {/* 1. CATEGORY SELECTION ("What kind of place will you host?") */}
                <div className="space-y-4">
                  <h3 className="text-h3 font-semibold text-white">What kind of place will you host?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {placeCategories.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = formData.category === cat.id;

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
                          className={`relative p-4 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between h-24 ${
                            isSelected
                              ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                              : 'bg-[#131b2e]/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 bg-amber-400 text-slate-950 rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          <CatIcon
                            className={`w-6 h-6 ${
                              isSelected ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          />
                          <span className={`text-body-sm font-medium ${isSelected ? 'text-white font-semibold' : 'text-slate-300'}`}>
                            {cat.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PROPERTY DETAILS */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-h3 font-semibold text-white">Property Details</h3>
                  <div className="space-y-1.5">
                    <label className="text-label font-medium text-slate-300 flex items-center gap-1">
                      What type of place is it? <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.propertyType}
                        onChange={(e) => setFormData((prev) => ({ ...prev, propertyType: e.target.value }))}
                        className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white appearance-none focus:outline-none focus:border-amber-400 transition cursor-pointer"
                      >
                        <option value="Entire place">Entire place</option>
                        <option value="Private room">Private room</option>
                        <option value="Shared room">Shared room</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 3. LISTING PURPOSE */}
                <div className="space-y-3">
                  <h4 className="text-label font-medium text-slate-300">Listing Purpose</h4>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, listingPurpose: 'short-term' }))}
                      className={`px-5 py-2.5 rounded-full text-button font-medium flex items-center gap-2 border transition cursor-pointer ${
                        formData.listingPurpose === 'short-term'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400 font-semibold'
                          : 'bg-[#131b2e] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          formData.listingPurpose === 'short-term'
                            ? 'border-amber-400 bg-amber-400'
                            : 'border-slate-500'
                        }`}
                      >
                        {formData.listingPurpose === 'short-term' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                        )}
                      </span>
                      Short-term stay
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, listingPurpose: 'long-term' }))}
                      className={`px-5 py-2.5 rounded-full text-button font-medium flex items-center gap-2 border transition cursor-pointer ${
                        formData.listingPurpose === 'long-term'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400 font-semibold'
                          : 'bg-[#131b2e] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          formData.listingPurpose === 'long-term'
                            ? 'border-amber-400 bg-amber-400'
                            : 'border-slate-500'
                        }`}
                      >
                        {formData.listingPurpose === 'long-term' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                        )}
                      </span>
                      Long-term stay
                    </button>
                  </div>
                </div>

                {/* 4. LISTING BADGES (ADMIN ONLY) */}
                <div className="space-y-3">
                  <h4 className="text-label font-medium text-slate-400">Listing Badges (Admin Only)</h4>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleBadge('isNew')}
                      className={`px-4 py-2 rounded-full text-caption font-semibold border transition cursor-pointer ${
                        formData.badges?.isNew
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/60'
                          : 'bg-[#131b2e] text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      New
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleBadge('topRated')}
                      className={`px-4 py-2 rounded-full text-caption font-semibold border transition cursor-pointer ${
                        formData.badges?.topRated
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                          : 'bg-[#131b2e] text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Top Rated
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleBadge('verifiedHost')}
                      className={`px-4 py-2 rounded-full text-caption font-semibold border transition cursor-pointer ${
                        formData.badges?.verifiedHost
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                          : 'bg-[#131b2e] text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Verified Host
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: LOCATION */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <h3 className="text-h3 font-semibold text-white">Where is your place located?</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-label font-medium text-slate-300">Street Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g. 124 Palace Road"
                      className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label font-medium text-slate-300">Locality / Area</label>
                    <input
                      type="text"
                      value={formData.locality || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, locality: e.target.value }))}
                      placeholder="e.g. Bani Park"
                      className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label font-medium text-slate-300">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Jaipur"
                      className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label font-medium text-slate-300">State</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="e.g. Rajasthan"
                      className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label font-medium text-slate-300">Country</label>
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="e.g. India"
                      className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: AMENITIES */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <h3 className="text-h3 font-semibold text-white">What amenities do you offer?</h3>
                <p className="text-caption text-slate-400 font-normal">Select all amenities available at this property.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'Wifi',
                    'Swimming Pool',
                    'Air Conditioning',
                    'Kitchen',
                    'Free Parking',
                    'Workspace',
                    'BBQ Grill',
                    'Hot Tub',
                    'TV / OTT',
                    'Washing Machine',
                    'Garden / Lawn',
                    'Power Backup',
                  ].map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      className="p-3.5 rounded-2xl bg-[#131b2e] border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>{amenity}</span>
                      <Check className="w-4 h-4 text-amber-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: PRICING */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <h3 className="text-h3 font-semibold text-white">Set your base nightly price</h3>
                
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-label font-medium text-slate-300">Price per night (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-body-sm">₹</span>
                      <input
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl pl-9 pr-4 py-3 text-body-lg font-bold font-tabular text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-label font-medium text-slate-300">Bedrooms</label>
                      <input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-label font-medium text-slate-300">Max Guests</label>
                      <input
                        type="number"
                        value={formData.maxGuests}
                        onChange={(e) => setFormData((prev) => ({ ...prev, maxGuests: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PHOTOS */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <ImageUploader
                  theme="dark"
                  images={formData.images || []}
                  onChange={(newImages) => setFormData((prev) => ({ ...prev, images: newImages }))}
                  label="Listing Photos"
                  helperText="Upload high quality photos. Drag to reorder, set cover, or paste direct URLs."
                />
              </div>
            )}

            {/* STEP 5: POLICIES */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <h3 className="text-h3 font-semibold text-white">Cancellation & Booking Policies</h3>
                
                <div className="space-y-3">
                  <label className="text-label font-medium text-slate-300">Cancellation Policy</label>
                  <select
                    value={formData.cancellationPolicy || 'Flexible'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cancellationPolicy: e.target.value }))}
                    className="w-full bg-[#131b2e] border border-slate-800 rounded-2xl px-4 py-3 text-body-sm font-medium text-white focus:outline-none focus:border-amber-400 transition cursor-pointer"
                  >
                    <option value="Flexible">Flexible (Full refund 1 day prior)</option>
                    <option value="Moderate">Moderate (Full refund 5 days prior)</option>
                    <option value="Strict">Strict (50% refund up to 7 days prior)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 6: PUBLISH */}
            {currentStep === 6 && (
              <div className="space-y-5 animate-in fade-in duration-300 text-center py-6">
                <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto">
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-h3 font-bold text-white">Ready to Publish Changes</h3>
                  <p className="text-body-sm text-slate-400 font-normal mt-1 max-w-sm mx-auto">
                    Review your property settings on the right panel and click save to apply updates instantly.
                  </p>
                </div>
              </div>
            )}

            {/* BOTTOM NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#131b2e] hover:bg-slate-800 text-slate-300 rounded-xl text-button font-medium transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold text-button rounded-xl transition flex items-center gap-2 shadow-md shadow-amber-400/20 cursor-pointer"
              >
                {currentStep === steps.length - 1 ? 'Save Changes' : 'Next →'}
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR PANEL (LIVE PROPERTY PREVIEW CARD & QUICK CONTROLS - 35% width) */}
          <div className="space-y-4">
            <div className="bg-[#131b2e] border border-slate-800/90 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
              {/* IMAGE CAROUSEL / PREVIEW HEADER */}
              <div className="relative rounded-2xl overflow-hidden h-44 bg-slate-900 group">
                <img
                  src={activeMainImage}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-overline font-semibold px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1">
                  <span>★</span> Main Image
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarPhotoIdx((prev) => (prev > 0 ? prev - 1 : sidebarImages.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarPhotoIdx((prev) => (prev < sidebarImages.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md text-slate-300 text-caption font-semibold font-tabular px-2 py-0.5 rounded-md">
                  {sidebarPhotoIdx + 1} / {sidebarImages.length}
                </div>
              </div>

              {/* THUMBNAILS STRIP */}
              <div className="grid grid-cols-4 gap-2">
                {sidebarImages.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSidebarPhotoIdx(idx)}
                    className={`rounded-xl overflow-hidden h-14 border cursor-pointer transition ${
                      sidebarPhotoIdx === idx ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {sidebarImages.length > 3 && (
                  <div
                    onClick={() => setSidebarPhotoIdx(3)}
                    className="rounded-xl overflow-hidden h-14 bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold text-body-sm cursor-pointer hover:border-slate-700"
                  >
                    +{sidebarImages.length - 3}
                  </div>
                )}
              </div>

              {/* PROPERTY SUMMARY HEADER */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-amber-400 text-body">
                  <span>★</span>
                  <span className="text-white font-bold">Property Summary</span>
                </div>
              </div>

              {/* PROPERTY DETAILS CARD */}
              <div className="bg-[#0b0f19]/70 rounded-2xl p-3.5 space-y-2 border border-slate-800/60">
                <h4 className="font-bold text-white text-body-sm leading-tight">
                  {formData.title}
                </h4>
                <p className="text-caption text-slate-400 font-normal flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{formData.city}, {formData.country}</span>
                </p>

                <div className="flex items-center gap-4 text-caption font-semibold font-tabular text-slate-300 pt-1">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-amber-400" /> {formData.bedrooms} Beds
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-amber-400" /> {formData.bathrooms} Baths
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> {formData.maxGuests} Guests
                  </span>
                </div>
              </div>

              {/* PRICE DETAILS CARD */}
              <div className="bg-[#0b0f19]/70 rounded-2xl p-3.5 flex items-center justify-between border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center text-xs">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-overline font-semibold text-slate-400 block uppercase tracking-wider">Price Details</span>
                    <span className="font-bold text-white text-body-lg font-tabular">₹{formData.basePrice} <span className="text-caption font-normal text-slate-400">per night</span></span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>

              {/* TOTAL REVENUE CARD */}
              <div className="bg-[#0b0f19]/70 rounded-2xl p-3.5 flex items-center justify-between border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    ₹
                  </div>
                  <div>
                    <span className="text-overline font-semibold text-slate-400 block uppercase tracking-wider">Total Revenue</span>
                    <span className="font-bold text-emerald-400 text-body-lg font-tabular">₹0</span>
                  </div>
                </div>
              </div>

              {/* TAX RATE CARD */}
              <div className="bg-[#0b0f19]/70 rounded-2xl p-3.5 flex items-center justify-between border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-overline font-semibold text-slate-400 block uppercase tracking-wider">Tax Rate</span>
                    {isEditingTax ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          value={taxInputVal}
                          onChange={(e) => setTaxInputVal(e.target.value)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-body-sm text-white font-medium font-tabular"
                        />
                        <button
                          onClick={saveTaxRate}
                          className="px-2 py-0.5 bg-amber-400 text-slate-950 font-semibold rounded text-caption"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-white text-body-sm font-tabular">
                        {formData.taxRate}% {formData.taxRate === 0 ? '(Default)' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {!isEditingTax && (
                  <button
                    onClick={() => setIsEditingTax(true)}
                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* INSTANT BOOKING CARD */}
              <div className="bg-[#0b0f19]/70 rounded-2xl p-3.5 flex items-center justify-between border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center text-xs">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white text-body-sm block leading-tight">Instant Booking</span>
                    <span className="text-caption text-slate-400 font-normal">Manual approval required</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, instantBook: !prev.instantBook }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${
                    formData.instantBook ? 'bg-amber-400' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition duration-200 ${
                      formData.instantBook ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* DISABLE PARTIAL (WEEKEND) CARD */}
              <div className="bg-[#0b0f19]/70 rounded-2xl p-3.5 flex items-center justify-between border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs">
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white text-body-sm block leading-tight">Disable Partial (Weekend)</span>
                    <span className="text-caption text-slate-400 font-normal">Force "Entire Place" on Fri/Sat</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, disableWeekendPartial: !prev.disableWeekendPartial }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${
                    formData.disableWeekendPartial ? 'bg-amber-400' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition duration-200 ${
                      formData.disableWeekendPartial ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
