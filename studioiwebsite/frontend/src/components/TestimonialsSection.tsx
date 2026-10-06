"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Play, Star } from "lucide-react";
import { InstagramIcon, LinkedinIcon, FacebookIcon, XTwitterIcon } from "./SocialIcons";

export default function TestimonialsSection() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  const testimonials = [
    {
      id: 1,
      title: "Game-changer for our tech team",
      quote:
        "Studio i provided our engineering team with gigabit fiber, 24/7 power backup, and top-tier meeting rooms. Our sprint velocity doubled within weeks of moving in.",
      author: "Rahul Singh",
      role: "CEO, TPL Solutions",
      avatar: "/assets/avatar-rahul.jpg",
    },
    {
      id: 2,
      title: "Best creative workspace in Jaipur",
      quote:
        "The ergonomic seating, specialty artisan coffee, and vibrant community networking sessions make working from Studio i an absolute daily pleasure.",
      author: "Priya Sharma",
      role: "Creative Director, StudioFlux",
      avatar: "/assets/avatar-priya.jpg",
    },
    {
      id: 3,
      title: "Seamless booking & flexible desks",
      quote:
        "Being able to book private suites and hot desks on demand with instant digital passes is unmatched for traveling founders and remote teams.",
      author: "Amit Verma",
      role: "Head of Engineering, HyperScale",
      avatar: "/assets/avatar-amit.jpg",
    },
    {
      id: 4,
      title: "World-class client impressions",
      quote:
        "Every client meeting in the 4K video boardroom leaves a stellar impression. Horizon Tower and Lehariya are Jaipur's finest business addresses.",
      author: "Neha Gupta",
      role: "Managing Partner, Apex Advisory",
      avatar: "/assets/avatar-neha.jpg",
    },
  ];

  const leftCards = testimonials.slice(0, 2);
  const rightCards = testimonials.slice(2, 4);

  return (
    <section id="experience" className="py-10 sm:py-16 px-4 sm:px-6 max-w-[1180px] mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-12">
        <span className="text-[#0e4962] font-bold text-xs sm:text-sm tracking-widest uppercase block mb-1.5">
          Our Testimonials
        </span>
        <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
          See what our <span className="text-[#0e4962]">Users are saying</span>
        </h2>
      </div>

      {/* 3-Column Layout: Left (2 cards) | Center Reel (1 video card) | Right (2 cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Left 2 Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
          {leftCards.map((card) => (
            <TestimonialCard key={card.id} card={card} />
          ))}
        </div>

        {/* Center Video Reel Card */}
        <div className="lg:col-span-4 flex justify-center order-1 lg:order-2">
          <div className="relative w-full max-w-[270px] xs:max-w-[285px] sm:max-w-[310px] aspect-[9/14.5] rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/90 group cursor-pointer bg-neutral-950 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(14, 73, 98,0.2)]">
            {/* High-res clean portrait image without baked-in margins */}
            <Image
              src="/assets/extracted_images/img_31_X95.jpg"
              alt="Rahul Singh Studio i Member Story"
              fill
              sizes="(max-width: 640px) 290px, 320px"
              className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

            {/* Interactive Play Button Hotspot */}
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-black shadow-2xl flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all duration-300 z-20 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#0e4962]/50"
              aria-label="Play Member Video Story"
            >
              <Play className="w-7 h-7 fill-black ml-1 text-black" />
            </button>

            {/* Bottom Card Content: Follow on Social Media Button */}
            <div className="absolute inset-x-4 bottom-5 z-20 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(true)}
                className="w-full py-3.5 px-4 rounded-full bg-[#0e4962] hover:bg-[#093447] text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-[0_10px_25px_rgba(14, 73, 98,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer tracking-wide"
              >
                Follow us on Social Media
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6 order-3">
          {rightCards.map((card) => (
            <TestimonialCard key={card.id} card={card} />
          ))}
        </div>
      </div>

      {/* Video Reel Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-neutral-950 rounded-3xl p-6 sm:p-8 border border-neutral-800 text-white shadow-2xl text-center">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 bg-[#0e4962]/20 text-[#0e4962] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Studio i Member Stories</h3>
            <p className="text-sm text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Watch Rahul Singh (CEO of TPL) and over 500+ founders explain why Studio i is Jaipur&apos;s most inspiring workspace ecosystem.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#0e4962] hover:bg-[#093447] text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media Links Modal */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-neutral-950 rounded-3xl p-6 sm:p-8 border border-neutral-800 text-white shadow-2xl text-center">
            <button
              type="button"
              onClick={() => setIsSocialModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black tracking-tight">Join Our Community</h3>
            <p className="text-sm text-neutral-400 mt-2">
              Follow Studio i on your favorite platform for events, networking and campus updates:
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-[#0e4962] transition-all text-sm font-semibold group"
              >
                <span className="flex items-center gap-3">
                  <InstagramIcon className="w-5 h-5" /> Instagram
                </span>
                <span className="text-xs text-neutral-400 group-hover:text-white">@studioi_cowork</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-[#0e4962] transition-all text-sm font-semibold group"
              >
                <span className="flex items-center gap-3">
                  <LinkedinIcon className="w-5 h-5" /> LinkedIn
                </span>
                <span className="text-xs text-neutral-400 group-hover:text-white">Studio i Workspaces</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-[#0e4962] transition-all text-sm font-semibold group"
              >
                <span className="flex items-center gap-3">
                  <FacebookIcon className="w-5 h-5" /> Facebook
                </span>
                <span className="text-xs text-neutral-400 group-hover:text-white">Studio i Community</span>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-[#0e4962] transition-all text-sm font-semibold group"
              >
                <span className="flex items-center gap-3">
                  <XTwitterIcon className="w-5 h-5" /> X (Twitter)
                </span>
                <span className="text-xs text-neutral-400 group-hover:text-white">@studioi_hq</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TestimonialCard({
  card,
}: {
  card: {
    id: number;
    title: string;
    quote: string;
    author: string;
    role: string;
    avatar: string;
  };
}) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-gray-300 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Rating Stars */}
        <div className="flex items-center gap-1 mb-2.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>

        <h4 className="text-sm sm:text-base font-bold text-neutral-900 mb-2 leading-snug">
          {card.title}
        </h4>
        <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal">
          &ldquo;{card.quote}&rdquo;
        </p>
      </div>

      {/* Author Footer */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200 shrink-0 relative bg-neutral-100">
            <Image
              src={card.avatar}
              alt={card.author}
              fill
              className="object-cover scale-110"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-neutral-900 truncate">{card.author}</div>
            <div className="text-[10px] text-neutral-500 font-medium truncate">{card.role}</div>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#0e4962] bg-[#0e4962]/10 px-2.5 py-0.5 rounded-full shrink-0 ml-2">
          Verified
        </span>
      </div>
    </div>
  );
}
