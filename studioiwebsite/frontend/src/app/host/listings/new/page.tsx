'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Building2, MapPin, Sparkles, Check, ArrowRight, ArrowLeft, 
  Upload, DollarSign, Shield, CheckCircle2, Image as ImageIcon
} from 'lucide-react';

export default function HostNewListingWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'Coworking Hub',
    privacyType: 'Entire Place',
    location: 'Lehariya KGK Realty, Jawahar Circle, Malviya Nagar, Jaipur',
    landmark: 'Opposite WTP Mall',
    maxGuests: 10,
    desksCount: 8,
    bathroomsCount: 2,
    amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'Free Coffee & Tea', '4K TV Casting', '24/7 Access'],
    title: 'Flagship Executive Coworking & Meeting Suite',
    description: 'Ultra-modern workspace featuring ergonomic Herman Miller seating, high-speed fiber internet, and complimentary barista coffee.',
    basePrice: 1500,
    cleaningFee: 300,
    weekendMultiplier: 1.2,
    photos: [
      '/assets/building-lehariya.png',
      '/assets/building-horizon.png',
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleAmenity = (item: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter(a => a !== item)
        : [...prev.amenities, item]
    }));
  };

  const handleNext = () => {
    if (currentStep < 10) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 bg-[#0e4962]/10 text-[#0e4962] rounded-full flex items-center justify-center mx-auto border border-[#0e4962]/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-neutral-900">Property Submitted for Moderation!</h1>
        <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
          Your property listing <span className="text-neutral-900 font-bold">"{formData.title}"</span> has been submitted to the Studio i Admin Moderation Queue. Once approved, it will be published live!
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/host/listings"
            className="px-6 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            View All Listings
          </Link>
          <Link
            href="/host/today"
            className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition border border-neutral-200"
          >
            Go to Today Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-neutral-900">
      {/* Wizard Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#0e4962] uppercase tracking-wider">Step {currentStep} of 10</span>
          <span className="text-neutral-500">
            {currentStep === 1 && '1. Category Selection'}
            {currentStep === 2 && '2. Privacy & Layout'}
            {currentStep === 3 && '3. Location & Pin Map'}
            {currentStep === 4 && '4. Space Capacity & Basics'}
            {currentStep === 5 && '5. Amenities & Facilities'}
            {currentStep === 6 && '6. Photos Uploader'}
            {currentStep === 7 && '7. Title & Story'}
            {currentStep === 8 && '8. House Rules & Access'}
            {currentStep === 9 && '9. Pricing & Cleaning Fees'}
            {currentStep === 10 && '10. Final Review & Submit'}
          </span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
          <div 
            className="h-full bg-linear-to-r from-[#0e4962] to-[#1a6585] transition-all duration-300"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Container Card */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">Which category best describes your space?</h2>
            <p className="text-xs text-neutral-500">Select the property structure to categorize your workspace listing.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {['Coworking Hub', 'Private Cabin Suite', 'Meeting & Event Room', 'Creative Studio', 'Executive Floor'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`p-4 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                    formData.category === cat ? 'bg-[#edf4f7]/60 border-[#0e4962] text-[#0e4962]' : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-2" />
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">What type of space will guests have?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {['Entire Place', 'Private Dedicated Suite', 'Shared Coworking Desk'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, privacyType: type })}
                  className={`p-4 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                    formData.privacyType === type ? 'bg-[#edf4f7]/60 border-[#0e4962] text-[#0e4962]' : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">Where is your property located?</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Full Street Address</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Landmark / Landmark Note</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">Share the basics about your space</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                <span className="font-bold text-neutral-700 block">Max Guests</span>
                <input
                  type="number"
                  value={formData.maxGuests}
                  onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-bold"
                />
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                <span className="font-bold text-neutral-700 block">Work Desks Count</span>
                <input
                  type="number"
                  value={formData.desksCount}
                  onChange={(e) => setFormData({ ...formData, desksCount: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-bold"
                />
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                <span className="font-bold text-neutral-700 block">Bathrooms</span>
                <input
                  type="number"
                  value={formData.bathroomsCount}
                  onChange={(e) => setFormData({ ...formData, bathroomsCount: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">Tell guests what your space offers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['High-Speed Wi-Fi', 'Air Conditioning', 'Free Coffee & Tea', '4K TV Casting', '24/7 Access', 'Free Parking', 'Pet-Friendly', 'Soundproof Booths'].map((item) => {
                const isSelected = formData.amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected ? 'bg-[#edf4f7]/60 border-[#0e4962] text-[#0e4962]' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <span>{item}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-[#0e4962]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6 */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">Add photos of your workspace</h2>
            <div className="border-2 border-dashed border-neutral-200 hover:border-[#0e4962] rounded-3xl p-8 text-center bg-neutral-50 cursor-pointer transition">
              <Upload className="w-8 h-8 text-[#0e4962] mx-auto mb-2" />
              <p className="text-xs font-bold text-neutral-900">Drag & drop high-resolution photos here</p>
              <p className="text-[11px] text-neutral-500 mt-1">Upload 5+ photos for optimal booking conversion</p>
            </div>
          </div>
        )}

        {/* Step 7 */}
        {currentStep === 7 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-xl font-black text-neutral-900">Now, let's give your workspace a title & story</h2>
            <div>
              <label className="font-bold text-neutral-700 block mb-1">Listing Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:border-[#0e4962] focus:bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 block mb-1">Property Story & Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Step 8 */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">Set house rules & security protocols</h2>
            <p className="text-xs text-neutral-500">Define access window, quiet hours, and safety policies for incoming guests.</p>
          </div>
        )}

        {/* Step 9 */}
        {currentStep === 9 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-xl font-black text-neutral-900">Set your nightly base price & fees</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Nightly Base Rate (₹)</label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold text-lg focus:outline-none focus:border-[#0e4962] focus:bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Cleaning Fee (₹)</label>
                <input
                  type="number"
                  value={formData.cleaningFee}
                  onChange={(e) => setFormData({ ...formData, cleaningFee: Number(e.target.value) })}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold text-lg focus:outline-none focus:border-[#0e4962] focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 10 */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962] bg-[#edf4f7] px-2.5 py-1 rounded-full border border-[#adcada]">
                Step 10 Review
              </span>
              <h2 className="text-xl font-black text-neutral-900 mt-2">{formData.title}</h2>
              <p className="text-xs text-neutral-500">{formData.location}</p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                <span>Category</span>
                <span className="font-bold text-neutral-900">{formData.category} ({formData.privacyType})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                <span>Capacity</span>
                <span className="font-bold text-neutral-900">{formData.maxGuests} Guests • {formData.desksCount} Desks</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                <span>Nightly Base Price</span>
                <span className="font-bold text-[#0e4962]">₹{formData.basePrice}/night</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 disabled:opacity-30 text-neutral-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? 'Submitting to Moderation...' : 'Submit to Admin Moderation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
