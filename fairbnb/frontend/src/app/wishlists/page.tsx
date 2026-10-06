'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import { PropertyPriceTag } from '@/components/property/PropertyPriceTag';
import {
  Heart,
  Loader2,
  Plus,
  Trash2,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface WishlistProperty {
  id: string;
  title: string;
  city: string;
  state?: string;
  country?: string;
  basePrice: number;
  coverImage?: string;
  images: string[];
  category?: string;
  propertyType?: string;
  maxGuests?: number;
}

interface Wishlist {
  id: string;
  name: string;
  properties: WishlistProperty[];
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

/** Individual property card within a wishlist */
function WishlistPropertyCard({
  property,
  wishlistId,
  onRemove,
}: {
  property: WishlistProperty;
  wishlistId: string;
  onRemove: (wishlistId: string, propertyId: string) => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = property.images?.length
    ? property.images
    : property.coverImage
    ? [property.coverImage]
    : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'];

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition-shadow h-full">
      {/* Image carousel */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        <Link href={`/properties/${property.id}`}>
          <img
            src={images[imgIdx]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Remove from wishlist button */}
        <button
          type="button"
          onClick={() => onRemove(wishlistId, property.id)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition hover:scale-110 active:scale-95 cursor-pointer"
          title="Remove from wishlist"
        >
          <Heart className="w-4 h-4 fill-[#0e4962] text-[#0e4962]" />
        </button>

        {/* Category badge */}
        {property.category && (
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs text-gray-900 font-semibold text-overline px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
            {property.category}
          </div>
        )}

        {/* Carousel navigation */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setImgIdx((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setImgIdx((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {images.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === imgIdx ? 'bg-white w-2' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card info */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/properties/${property.id}`}>
          <h4 className="text-sm font-bold text-gray-900 truncate hover:underline">
            {property.title}
          </h4>
        </Link>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          {property.city}
          {property.state ? `, ${property.state}` : ''}
        </p>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <PropertyPriceTag basePrice={property.basePrice} size="sm" />
          {property.maxGuests && (
            <span className="text-caption text-gray-500 font-tabular flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {property.maxGuests}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Empty state when no wishlists exist */
function WishlistEmptyState() {
  return (
    <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm max-w-lg mx-auto space-y-4">
      <div className="w-16 h-16 bg-rose-50 text-[#0e4962] rounded-full flex items-center justify-center mx-auto">
        <Heart className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Create your first wishlist</h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        As you explore, tap the heart icon on any property to save your favourite stays. They will appear here for easy access.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#0e4962] hover:bg-[#093447] text-white font-bold rounded-2xl text-sm transition shadow-sm"
      >
        <Compass className="w-4 h-4" />
        <span>Explore Stays</span>
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
export default function WishlistsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create wishlist modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch user wishlists
  const fetchWishlists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Wishlist[]>('/wishlists');
      setWishlists(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load wishlists:', err);
      setError(err.message || 'Failed to load wishlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Guest view — show empty state
      setLoading(false);
      return;
    }
    if (isAuthenticated) {
      fetchWishlists();
    }
  }, [isAuthenticated, authLoading]);

  // Create new wishlist
  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) return;
    setCreating(true);
    try {
      await api.post('/wishlists', { name: newWishlistName.trim() });
      setCreateModalOpen(false);
      setNewWishlistName('');
      await fetchWishlists();
    } catch (err: any) {
      alert(err.message || 'Failed to create wishlist');
    } finally {
      setCreating(false);
    }
  };

  // Remove property from wishlist
  const handleRemoveProperty = async (wishlistId: string, propertyId: string) => {
    try {
      await api.delete(`/wishlists/${wishlistId}/properties/${propertyId}`);
      // Optimistic UI update
      setWishlists((prev) =>
        prev.map((wl) =>
          wl.id === wishlistId
            ? { ...wl, properties: wl.properties.filter((p) => p.id !== propertyId) }
            : wl
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to remove property');
    }
  };

  // Delete an entire wishlist
  const handleDeleteWishlist = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to delete this entire wishlist?')) return;
    try {
      await api.delete(`/wishlists/${wishlistId}`);
      setWishlists((prev) => prev.filter((wl) => wl.id !== wishlistId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete wishlist');
    }
  };

  const totalSaved = wishlists.reduce((sum, wl) => sum + wl.properties.length, 0);

  // ──────────────────────────────────────────────────────────────────────────
  // Guest (not logged in) state
  // ──────────────────────────────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
        <AirbnbHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
          <div className="w-16 h-16 bg-rose-50 text-[#0e4962] rounded-full flex items-center justify-center mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Wishlists</h1>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Log in to view your wishlists. You can create, view, or edit wishlists once you have logged in.
          </p>
          <div className="flex gap-3 w-full max-w-xs">
            <Link
              href="/login?redirect=/wishlists"
              className="flex-1 bg-[#0e4962] text-white py-2.5 rounded-xl font-semibold text-sm text-center hover:bg-[#093447] transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="flex-1 bg-gray-100 text-gray-900 py-2.5 rounded-xl font-semibold text-sm text-center hover:bg-gray-200 transition"
            >
              Sign up
            </Link>
          </div>
        </main>
        <AirbnbFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <AirbnbHeader />

      <main className="flex-1 max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 w-full">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h1 font-bold text-gray-900 tracking-tight">Wishlists</h1>
            <p className="text-body-sm text-gray-500 mt-1">
              {totalSaved > 0
                ? `${totalSaved} saved ${totalSaved === 1 ? 'property' : 'properties'} across ${wishlists.length} ${wishlists.length === 1 ? 'list' : 'lists'}`
                : 'Save your favourite properties to view them later.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:border-gray-900 text-gray-800 text-button font-medium rounded-2xl transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Stays</span>
            </Link>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-button font-medium rounded-2xl transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Wishlist</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="py-24 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0e4962] mx-auto mb-3" />
            <p className="text-sm font-semibold">Loading your wishlists...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchWishlists}
              className="mt-3 text-xs font-bold text-red-700 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : wishlists.length === 0 ? (
          <WishlistEmptyState />
        ) : (
          <div className="space-y-10">
            {wishlists.map((wishlist) => (
              <section key={wishlist.id} className="space-y-4">
                {/* Wishlist name header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-h3 font-bold text-gray-900">{wishlist.name}</h2>
                    <span className="text-caption font-semibold font-tabular text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {wishlist.properties.length} {wishlist.properties.length === 1 ? 'stay' : 'stays'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteWishlist(wishlist.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete List</span>
                  </button>
                </div>

                {/* Properties grid */}
                {wishlist.properties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {wishlist.properties.map((property) => (
                      <WishlistPropertyCard
                        key={property.id}
                        property={property}
                        wishlistId={wishlist.id}
                        onRemove={handleRemoveProperty}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                    <p className="text-sm text-gray-500">No properties saved in this wishlist yet.</p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0e4962] mt-2 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Browse stays to add
                    </Link>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      <AirbnbFooter />

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* CREATE WISHLIST MODAL                                               */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Create New Wishlist</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800">Name</label>
              <input
                type="text"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                placeholder="e.g. Beach Getaways, Mountain Retreats"
                className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0e4962]/30 focus:border-[#0e4962]"
                maxLength={50}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateWishlist();
                }}
              />
              <p className="text-caption font-tabular text-gray-400">{newWishlistName.length}/50 characters</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating || !newWishlistName.trim()}
                onClick={handleCreateWishlist}
                className="flex-1 py-3 bg-[#0e4962] hover:bg-[#093447] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {creating ? 'Creating...' : 'Create Wishlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
