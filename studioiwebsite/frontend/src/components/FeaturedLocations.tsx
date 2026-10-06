"use client";

import React from "react";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";

export default function FeaturedLocations() {
  const locations = [
    {
      id: "lehariya",
      title: "A Tower - 1st Floor, Lehariya | KGK Realty",
      subtitle: "Near Jawahar Circle, Malviya Nagar, Jaipur",
      rating: "4.5/5",
      image: "/assets/building-lehariya.png",
      tag: "Flagship Campus",
      slug: "lehariya-jaipur"
    },
    {
      id: "horizon",
      title: "1007-08, 10th Floor, Horizon Tower",
      subtitle: "JLJN Marg, Tonk Road, Jaipur",
      rating: "4.3/5",
      image: "/assets/building-horizon.png",
      tag: "Premium Executive",
      slug: "horizon-jaipur",
    },
  ];

  return (
    <section id="locations" className="py-6 sm:py-10 px-4 sm:px-6 max-w-[1280px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
          >
            {/* Image Container with Zoom effect */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={loc.image}
                alt={loc.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

            </div>

            {/* Bottom Dark Info Bar */}
            <a href={`/workspaces/${loc.slug}`} className="block">
              <div className="bg-black px-4 sm:px-7 py-3.5 sm:py-5 flex items-center justify-between text-white border-t border-neutral-800/80 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-[#0e4962] transition-colors flex items-center gap-1.5 truncate">
                    <span className="truncate">{loc.title}</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#0e4962] shrink-0" />
                    <span className="truncate">{loc.subtitle}</span>
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-neutral-800 shrink-0">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wider">
                    {loc.rating}
                  </span>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
