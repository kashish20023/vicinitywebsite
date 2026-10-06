'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import { ArrowRight, Star, Home, Users, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <AirbnbHeader />
      <main className="flex-1 w-full overflow-hidden">
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[500px] w-full flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <Image
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
            alt="Luxury Villa at Night"
            fill
            className="object-cover"
            priority
          />
          <div className="relative z-20 text-center space-y-6 px-4 max-w-4xl mx-auto animate-in fade-in-up duration-1000">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium tracking-wider uppercase mb-2">
              Redefining Hospitality
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
              About <span className="text-[#0e4962] bg-white px-4 py-1 rounded-2xl inline-block">Us</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
              Curating exceptional stays and unlocking property potential.
            </p>
          </div>
        </div>

        {/* Introduction */}
        <section className="py-20 md:py-32 bg-white relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <div className="max-w-4xl mx-auto px-6 md:px-10 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              More than just a platform.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-light">
              Fair Stay is a thoughtfully curated short-term rental marketplace that redefines the way people experience travel and the way property owners unlock the true potential of their spaces. We bridge the gap between luxury and comfort.
            </p>
          </div>
        </section>

        {/* Stats Section - Trust Signals */}
        <section className="py-12 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Properties', value: '50+', icon: Home },
              { label: 'Happy Guests', value: '10k+', icon: Users },
              { label: 'Cities', value: '8+', icon: Star },
              { label: 'Secure Stays', value: '100%', icon: ShieldCheck },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2 group">
                <div className="p-3 bg-white rounded-full shadow-xs group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                  <stat.icon className="w-6 h-6 text-[#0e4962]" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* For Guests Section */}
        <section className="py-20 md:py-32 max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[500px] lg:h-[600px] rounded-[2rem] overflow-hidden shadow-2xl group order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"
                alt="Exceptional Guest Experience"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <span className="text-[#0e4962] font-semibold tracking-wider uppercase text-sm">For Guests</span>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Elevate Your <br /> Travel Experience.
                </h2>
              </div>
              <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-light">
                <p>
                  At Fair Stay, every trip deserves more than a standard stay. We carefully curate a portfolio from stylish city apartments to boutique pool villas, heritage homes, and farm retreats—each chosen for character, comfort, and quality.
                </p>
                <p>
                  From on-demand drivers to private chefs and personalized concierge support, we ensure your stay is seamless. Experience the perfect blend of flexibility, privacy, and comfort designed for the modern traveler.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Property Owners Section */}
        <section className="py-20 md:py-32 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[#0e4962] font-semibold tracking-wider uppercase text-sm">For Owners</span>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                    Your Property, <br /> Our Expertise.
                  </h2>
                </div>
                <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-light">
                  <p>
                    Fair Stay serves as a growth partner for property owners, providing a complete ecosystem beyond simple listings. From professional photography and market analysis to revenue optimization and transparent management, we maximize visibility and earnings.
                  </p>
                  <p>
                    Enjoy complete flexibility and transparency while our team handles the details. By combining technology with hospitality, we enable higher occupancy, improved returns, and peace of mind.
                  </p>
                </div>
              </div>
              <div className="relative h-[500px] lg:h-[600px] rounded-[2rem] overflow-hidden shadow-2xl group">
                <Image
                  src="https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=2070&auto=format&fit=crop"
                  alt="Property Management Excellence"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission - Centered & Impactful */}
        <section className="py-24 md:py-32 relative overflow-hidden bg-white">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#0e4962]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

          <div className="max-w-5xl mx-auto px-6 md:px-10 text-center space-y-12 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Our Mission</h2>
            <p className="text-xl md:text-3xl font-light text-gray-600 leading-relaxed">
              "To create a trusted bridge between premium property owners and modern travelers. We simplify short-term rentals into a frictionless, rewarding process for all."
            </p>
            <div className="pt-8">
              <p className="text-lg font-medium text-[#0e4962]">
                With Fair Stay, you don’t just book a stay—you step into a space designed to inspire.
              </p>
            </div>
          </div>
        </section>
      </main>
      <AirbnbFooter />
    </div>
  );
}
