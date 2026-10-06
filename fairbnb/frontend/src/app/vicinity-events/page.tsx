'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import {
  Users,
  BadgeCheck,
  PartyPopper,
  Briefcase,
  HeartHandshake,
  Sparkles,
  LayoutGrid,
  Heart,
  Star,
} from 'lucide-react';

// Categories focused on Event Hosting Types
const eventCategories = [
  { id: 'all', name: 'All Events', icon: LayoutGrid },
  { id: 'weddings', name: 'Weddings & Anniversaries', icon: HeartHandshake },
  { id: 'parties', name: 'Parties & Celebrations', icon: PartyPopper },
  { id: 'corporate', name: 'Corporate & Meetings', icon: Briefcase },
  { id: 'social', name: 'Social & Kitty', icon: Users },
];

// Specific Event Packages Data
const eventPackages = [
  {
    id: 'ev1',
    title: 'The Royal Wedding Package',
    description:
      'A comprehensive buyout of the property for a grand destination wedding with heritage decor.',
    price: '5,000 / day',
    rating: 5.0,
    reviews: 42,
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
    capacity: '100-500 Guests',
    venue: 'Grand Lawn & Banquet',
    hostVerified: true,
    category: 'weddings',
    badge: 'Most Popular',
  },
  {
    id: 'ev2',
    title: 'Corporate Retreat & Strategy Meet',
    description:
      'All-inclusive residential package for team building, strategy sessions, and networking.',
    price: '1,500 / person',
    rating: 4.8,
    reviews: 85,
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    capacity: '20-80 Guests',
    venue: 'Conference Hall',
    hostVerified: true,
    category: 'corporate',
    badge: 'Business Ready',
  },
  {
    id: 'ev3',
    title: 'Ultimate Bachelor / Bachelorette',
    description:
      'Private pool villa party with DJ setup, bar service, and complete privacy.',
    price: '800 / person',
    rating: 4.95,
    reviews: 120,
    image:
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=800&auto=format&fit=crop',
    capacity: '15-30 Guests',
    venue: 'Poolside Villa',
    hostVerified: true,
    category: 'parties',
    badge: 'Party Vibes',
  },
  {
    id: 'ev4',
    title: 'Golden Jubilee Anniversary',
    description:
      'Elegant sit-down dinner setup with floral arrangements for milestone celebrations.',
    price: '1,200 / person',
    rating: 4.98,
    reviews: 34,
    image:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop',
    capacity: '50-150 Guests',
    venue: 'Heritage Terrace',
    hostVerified: true,
    category: 'weddings',
    badge: 'Premium',
  },
  {
    id: 'ev5',
    title: 'Ladies Kitty Party & High Tea',
    description:
      'Relaxed afternoon sessions with gourmet snacks, games, and dedicated service staff.',
    price: '400 / person',
    rating: 4.85,
    reviews: 210,
    image:
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?q=80&w=800&auto=format&fit=crop',
    capacity: '10-25 Guests',
    venue: 'Garden Gazebo',
    hostVerified: true,
    category: 'social',
    badge: 'Trending',
  },
  {
    id: 'ev6',
    title: 'Milestone Birthday Bash',
    description:
      'Celebrate in style with custom themes, cake cutting ceremony, and music.',
    price: '900 / person',
    rating: 4.92,
    reviews: 156,
    image:
      'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=800&auto=format&fit=crop',
    capacity: '30-100 Guests',
    venue: 'Party Hall',
    hostVerified: true,
    category: 'parties',
    badge: null,
  },
  {
    id: 'ev7',
    title: 'Community Meetup & Mixer',
    description:
      'Open spaces perfect for hobby clubs, book readings, or networking mixers.',
    price: '300 / person',
    rating: 4.75,
    reviews: 90,
    image:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=800&auto=format&fit=crop',
    capacity: '20-50 Guests',
    venue: 'Courtyard',
    hostVerified: false,
    category: 'social',
    badge: 'Community',
  },
];

export default function VicinityEventsPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredEvents =
    activeCategory === 'all'
      ? eventPackages
      : eventPackages.filter((ev) => ev.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <AirbnbHeader />

      {/* Hero Header Banner */}
      <div className="bg-[#0e4962] text-white py-14 px-6 md:px-12 text-center space-y-4">
        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-overline font-semibold uppercase tracking-wider text-blue-100 inline-block">
          FAIR STAY EVENTS
        </span>
        <h1 className="text-display font-bold tracking-tight leading-tight">
          Curated Event Packages &amp; Gatherings
        </h1>
        <p className="text-body-lg text-blue-100/90 max-w-2xl mx-auto font-normal leading-relaxed">
          From intimate birthday bashes to royal destination weddings, discover spaces designed for unforgettable experiences.
        </p>
      </div>

      {/* Sticky Category Nav */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 shadow-xs">
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 xl:px-12 py-4">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
            {eventCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border
                  ${
                    activeCategory === category.id
                      ? 'bg-[#0e4962] text-white border-[#0e4962] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <category.icon className="w-4 h-4 shrink-0" />
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-[1920px] mx-auto px-6 md:px-10 xl:px-12 py-12 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-1">
              {activeCategory === 'all'
                ? 'Featured Event Packages'
                : eventCategories.find((c) => c.id === activeCategory)?.name}
            </h2>
            <p className="text-sm text-gray-500">
              Curated setups for unforgettable gatherings
            </p>
          </div>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
        >
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((ev) => (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-gray-100 shadow-xs group-hover:shadow-xl transition-all duration-300">
                  <Image
                    src={ev.image}
                    alt={ev.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                  <button
                    type="button"
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-rose-600 transition-colors z-20 cursor-pointer"
                    aria-label="Save event"
                  >
                    <Heart className="w-5 h-5" />
                  </button>

                  {/* Dynamic Badges */}
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    {ev.badge && (
                      <span
                        className={`
                          px-3 py-1 rounded-full backdrop-blur-md text-xs font-bold shadow-sm border
                          ${
                            ev.badge === 'Most Popular'
                              ? 'bg-amber-100/90 text-amber-900 border-amber-200'
                              : ev.badge === 'Luxury'
                                ? 'bg-black/80 text-white border-white/20'
                                : 'bg-white/90 text-gray-900 border-gray-200'
                          }
                        `}
                      >
                        {ev.badge === 'Most Popular' && '👑 '}
                        {ev.badge}
                      </span>
                    )}
                  </div>

                  {/* Venue Indicator */}
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ev.venue}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <BadgeCheck className="w-4 h-4 text-blue-600" />
                      <span>Full Service</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md text-gray-900 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{ev.rating}</span>
                      <span className="text-gray-500 font-normal">
                        ({ev.reviews})
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg leading-snug text-gray-900 group-hover:text-[#0e4962] transition-colors line-clamp-2">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed h-9">
                    {ev.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium pt-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{ev.capacity}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">
                        Starting from
                      </span>
                      <span className="font-bold text-base text-gray-900">
                        ₹{ev.price}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-full bg-[#0e4962] text-white hover:bg-[#093447] transition-colors cursor-pointer"
                    >
                      Enquire
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <AirbnbFooter />
    </div>
  );
}
