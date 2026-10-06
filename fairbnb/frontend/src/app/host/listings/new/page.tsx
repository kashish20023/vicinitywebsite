'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import {
  Building2,
  MapPin,
  Users,
  Bed,
  Bath,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Check,
  Sparkles,
  Camera,
  IndianRupee,
} from 'lucide-react';

export default function AirbnbNewListingWizard() {
  const router = useRouter();

  // Wizard Step (1 to 8)
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // Form State
  const [category, setCategory] = useState('Villa');
  const [propertyType, setPropertyType] = useState('Entire Place');
  const [listingPurpose, setListingPurpose] = useState('Short-Term Rental');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState<number | ''>('');

  const [maxGuests, setMaxGuests] = useState<number>(4);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [beds, setBeds] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'wifi',
    'airConditioning',
    'kitchen',
  ]);

  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  ]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [basePrice, setBasePrice] = useState<number>(8500);
  const [instantBook, setInstantBook] = useState<boolean>(true);
  const [minNights, setMinNights] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'Villa', label: 'Villa', icon: '🏡' },
    { id: 'Apartment', label: 'Apartment', icon: '🌆' },
    { id: 'Haveli', label: 'Haveli', icon: '🏰' },
    { id: 'Resort', label: 'Resort', icon: '🏊‍♂️' },
    { id: 'Cottage', label: 'Cottage', icon: '🌾' },
    { id: 'Chalet', label: 'Chalet', icon: '⛵' },
    { id: 'Hall', label: 'Banquet Hall', icon: '🎉' },
  ];

  const amenities = [
    { id: 'wifi', label: 'Wifi', icon: '📶' },
    { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { id: 'airConditioning', label: 'Air conditioning', icon: '❄️' },
    { id: 'parking', label: 'Free parking', icon: '🚗' },
    { id: 'pool', label: 'Swimming pool', icon: '🏊‍♂️' },
    { id: 'jacuzzi', label: 'Hot tub / Jacuzzi', icon: '🛁' },
    { id: 'seaView', label: 'Sea / Ocean view', icon: '🌊' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'tv', label: 'Smart TV', icon: '📺' },
  ];

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== id));
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const payload = {
        title: title || `${category} in ${city}`,
        description:
          description ||
          `Welcome to our beautiful ${category} in ${city}. Perfect for up to ${maxGuests} guests with ${bedrooms} bedrooms and top amenities.`,
        category,
        propertyType,
        listingPurpose,
        address: address || undefined,
        city: city || 'Goa',
        state: state || 'Goa',
        country: country || 'India',
        pincode: pincode ? Number(pincode) : undefined,
        maxGuests: Number(maxGuests),
        bedrooms: Number(bedrooms),
        beds: Number(beds),
        bathrooms: Number(bathrooms),
        basePrice: Number(basePrice),
        instantBook,
        minNights: Number(minNights),
        images,
      };

      await api.post('/properties', payload);
      router.push('/host/listings');
    } catch (err: any) {
      setError(err.message || 'Failed to submit listing');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* TOP HEADER */}
      <header className="h-20 border-b border-gray-100 px-6 sm:px-12 flex items-center justify-between">
        <Link href="/host/listings" className="font-bold text-h3 tracking-tight text-gray-900">
          fair<span className="text-rose-500">bnb</span> <span className="text-gray-400 font-normal">hosting</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-500 hidden sm:inline-block">
            Step {step} of {totalSteps}
          </span>
          <Link
            href="/host/listings"
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-full text-xs font-bold hover:bg-gray-50 transition"
          >
            Exit wizard
          </Link>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="w-full bg-gray-100 h-1">
        <div
          className="bg-rose-500 h-1 transition-all duration-300 ease-out"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* MAIN STEP CONTENT */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 sm:py-16 flex flex-col justify-between">
        <div className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 1</span>
                <h1 className="text-h1 font-bold text-gray-900 mt-1">
                  Which of these best describes your place?
                </h1>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition flex flex-col justify-between h-32 ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                          : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <span className="text-3xl">{cat.icon}</span>
                      <span className="font-bold text-sm text-gray-900">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 2</span>
                <h1 className="text-h1 font-bold text-gray-900 mt-1">
                  Where is your place located?
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Your exact address is only shared with guests after they make a reservation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14 Beach Road, Candolim"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Goa"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Goa"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Pincode
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 403515"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BASICS */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 3</span>
                <h1 className="text-h1 font-bold text-gray-900 mt-1">
                  Share some basics about your place
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  You'll add more details later, like bed types and room locks.
                </p>
              </div>

              <div className="space-y-6 divide-y divide-gray-100">
                {/* GUESTS */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-bold text-base text-gray-900">Max Guests</span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setMaxGuests(Math.max(1, maxGuests - 1))}
                      disabled={maxGuests <= 1}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-30 hover:border-gray-900 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-6 text-center">{maxGuests}</span>
                    <button
                      type="button"
                      onClick={() => setMaxGuests(maxGuests + 1)}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-900 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* BEDROOMS */}
                <div className="flex items-center justify-between pt-6">
                  <span className="font-bold text-base text-gray-900">Bedrooms</span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                      disabled={bedrooms <= 0}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-30 hover:border-gray-900 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-6 text-center">{bedrooms}</span>
                    <button
                      type="button"
                      onClick={() => setBedrooms(bedrooms + 1)}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-900 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* BEDS */}
                <div className="flex items-center justify-between pt-6">
                  <span className="font-bold text-base text-gray-900">Beds</span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setBeds(Math.max(1, beds - 1))}
                      disabled={beds <= 1}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-30 hover:border-gray-900 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-6 text-center">{beds}</span>
                    <button
                      type="button"
                      onClick={() => setBeds(beds + 1)}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-900 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* BATHROOMS */}
                <div className="flex items-center justify-between pt-6">
                  <span className="font-bold text-base text-gray-900">Bathrooms</span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setBathrooms(Math.max(1, bathrooms - 1))}
                      disabled={bathrooms <= 1}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-30 hover:border-gray-900 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-6 text-center">{bathrooms}</span>
                    <button
                      type="button"
                      onClick={() => setBathrooms(bathrooms + 1)}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-900 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AMENITIES */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 4</span>
                <h1 className="text-h1 font-bold text-gray-900 mt-1">
                  Tell guests what your place has to offer
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  You can add more amenities after you publish your listing.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-28 transition ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                          : 'border-gray-200 bg-white hover:border-gray-400'
                      }`}
                    >
                      <span className="text-2xl">{amenity.icon}</span>
                      <span className="font-bold text-xs sm:text-sm text-gray-900">{amenity.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: PHOTOS */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 5</span>
                <h1 className="text-h1 font-bold text-gray-900 mt-1">
                  Add photos of your place
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  You need at least 1 photo to publish. Add photo links below.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition"
                >
                  Add
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group">
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: TITLE & DESCRIPTION */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 6</span>
                <h1 className="text-h1 font-bold text-gray-900 mt-1">
                  Give your place a catchy title & description
                </h1>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Listing Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Luxurious Sea-View Villa with Private Pool"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe what makes your space unique, the vibe of the neighborhood, and special features..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PRICING */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 7</span>
                <h1 className="text-h1 font-bold text-gray-900 mt-1">
                  Now, set your price
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  You can change your price anytime after publishing.
                </p>
              </div>

              <div className="p-8 bg-gray-50 rounded-3xl border border-gray-200 text-center space-y-4">
                <span className="text-overline font-semibold uppercase tracking-wider text-gray-500">Nightly Price</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-display font-bold text-gray-900">₹</span>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-48 text-display font-bold text-gray-900 bg-transparent text-center outline-none border-b-2 border-gray-400 focus:border-rose-500 font-tabular"
                  />
                </div>
                <p className="text-caption text-gray-500">Per night, before taxes</p>
              </div>

              <div className="p-5 border border-gray-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-body-sm">⚡ Instant Book</p>
                  <p className="text-caption text-gray-500">Allow guests to book without waiting for manual confirmation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInstantBook(!instantBook)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${
                    instantBook ? 'bg-rose-500' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      instantBook ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW & SUBMIT */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <span className="text-overline font-semibold text-rose-600 uppercase tracking-wider">Step 8</span>
                <h1 className="text-h2 font-bold text-gray-900 mt-1">
                  Review your listing
                </h1>
                <p className="text-body-sm text-gray-500 mt-1">
                  Here's what we'll show to guests once your listing is approved.
                </p>
              </div>

              {/* CARD PREVIEW */}
              <div className="p-5 bg-white border border-gray-200 rounded-3xl shadow-xl max-w-sm mx-auto space-y-4">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                  <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold text-body text-gray-900">{title || `${category} in ${city}`}</h3>
                  <p className="text-caption text-gray-500">{city}, {state}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-bold text-body-lg text-gray-900 font-tabular">₹{basePrice.toLocaleString('en-IN')}</span>
                    <span className="text-caption text-gray-500">night</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION CONTROLS */}
        <div className="pt-10 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="text-sm font-bold text-gray-800 hover:underline disabled:opacity-0"
          >
            Back
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow transition"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  Publish Listing <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
