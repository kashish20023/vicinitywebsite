'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Star, Heart } from 'lucide-react';

interface SimilarProperty {
  id: string;
  title: string;
  city: string;
  country?: string;
  basePrice: number;
  category?: string;
  images: string[];
}

export function SimilarStaysSection({ currentPropertyId }: { currentPropertyId: string }) {
  const [stays, setStays] = useState<SimilarProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<SimilarProperty[] | { properties: SimilarProperty[] }>('/properties').catch(() => null);
        let list: SimilarProperty[] = [];
        if (Array.isArray(res)) list = res;
        else if (res && Array.isArray((res as any).properties)) list = (res as any).properties;

        const filtered = list.filter(p => p.id !== currentPropertyId).slice(0, 3);
        setStays(filtered);
      } catch (err) {
        // quiet fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentPropertyId]);

  if (loading || stays.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Similar stays you might like</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-6">
        {stays.map(stay => {
          const mainImg = stay.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';
          return (
            <Link
              key={stay.id}
              href={`/properties/${stay.id}`}
              className="group block rounded-2xl overflow-hidden bg-white border border-gray-200/80 hover:shadow-lg transition duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={mainImg}
                  alt={stay.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                />
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="absolute top-3 right-3 p-2 text-white/90 hover:text-white transition"
                >
                  <Heart className="w-5 h-5 drop-shadow-md" />
                </button>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{stay.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-800 flex-shrink-0">
                    <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                    <span>4.9</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{stay.city}, {stay.country || 'India'}</p>
                <div className="pt-2 flex items-baseline gap-1">
                  <span className="font-bold text-sm text-gray-900">₹{stay.basePrice.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-gray-500 font-normal">night</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
