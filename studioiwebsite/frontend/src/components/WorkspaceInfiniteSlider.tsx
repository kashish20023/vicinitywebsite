"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export interface WorkspaceCategory {
  id: string;
  title: string;
  subtitle: string;
  topImg: string;
  bottomImg: string;
}

export const WORKSPACE_CATEGORIES: WorkspaceCategory[] = [
  {
    id: "not-desk",
    title: "NOT DESK",
    subtitle: "Pick your way",
    topImg: "/assets/workspaces/not-desk-top.png",
    bottomImg: "/assets/workspaces/not-desk-bottom.png",
  },
  {
    id: "dedicated-desk",
    title: "DEDICATED DESK",
    subtitle: "Focus. Every day.",
    topImg: "/assets/workspaces/dedicated-desk-top.png",
    bottomImg: "/assets/workspaces/dedicated-desk-bottom.png",
  },
  {
    id: "private-cabin",
    title: "PRIVATE CABIN",
    subtitle: "Your space. Your rules.",
    topImg: "/assets/workspaces/private-cabin-top.png",
    bottomImg: "/assets/workspaces/private-cabin-bottom.png",
  },
  {
    id: "meeting-room",
    title: "MEETING ROOM",
    subtitle: "Collaborate better",
    topImg: "/assets/workspaces/meeting-room-top.png",
    bottomImg: "/assets/workspaces/meeting-room-bottom.png",
  },
  {
    id: "event-space",
    title: "EVENT SPACE",
    subtitle: "For bigger ideas",
    topImg: "/assets/workspaces/event-space-top.png",
    bottomImg: "/assets/workspaces/event-space-bottom.png",
  },
  {
    id: "community",
    title: "COMMUNITY",
    subtitle: "More than work",
    topImg: "/assets/workspaces/community-top.png",
    bottomImg: "/assets/workspaces/community-bottom.png",
  },
];

// Helper to extract translateX in pixels from computed transform
function getTranslateX(el: HTMLElement): number {
  const style = window.getComputedStyle(el);
  const transform = style.transform || (style as unknown as { webkitTransform?: string }).webkitTransform;
  if (!transform || transform === "none") return 0;
  if (transform.startsWith("matrix3d")) {
    const values = transform.slice(9, -1).split(",");
    return parseFloat(values[12]) || 0;
  }
  if (transform.startsWith("matrix")) {
    const values = transform.slice(7, -1).split(",");
    return parseFloat(values[4]) || 0;
  }
  return 0;
}

export default function WorkspaceInfiniteSlider() {
  // Duplicate categories 4 times (24 items) to ensure a seamless infinite track loop
  const infiniteItems = [
    ...WORKSPACE_CATEGORIES,
    ...WORKSPACE_CATEGORIES,
    ...WORKSPACE_CATEGORIES,
    ...WORKSPACE_CATEGORIES,
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const bgTrackRef = useRef<HTMLDivElement>(null);
  const phoneContainerRef = useRef<HTMLDivElement>(null);
  const phoneScreenRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeIndexRef = useRef<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Real-time synchronization loop: tracks active category closest to phone center
  useEffect(() => {
    let rafId: number;

    const syncActiveCategory = () => {
      if (
        bgTrackRef.current &&
        phoneContainerRef.current &&
        containerRef.current
      ) {
        const bgTrack = bgTrackRef.current;
        const bgFirstItem = bgTrack.children[0] as HTMLElement | undefined;

        if (bgFirstItem) {
          const bgItemWidth = bgFirstItem.offsetWidth;
          const bgStyle = window.getComputedStyle(bgTrack);
          const bgGap = parseFloat(bgStyle.gap || bgStyle.columnGap) || 12;
          const bgStep = bgItemWidth + bgGap;

          const containerRect = containerRef.current.getBoundingClientRect();
          const phoneRect = phoneContainerRef.current.getBoundingClientRect();
          const phoneCenterX = phoneRect.left + phoneRect.width / 2 - containerRect.left;

          const trackLeft = bgTrack.offsetLeft;
          const txBg = getTranslateX(bgTrack);
          const currentCenterBg0 = trackLeft + txBg + bgItemWidth / 2;

          // Authoritative active category tracking:
          // Which category is closest to the stationary phone center?
          if (bgStep > 0) {
            const rawIndex = Math.round((phoneCenterX - currentCenterBg0) / bgStep);
            const normalizedIndex =
              ((rawIndex % WORKSPACE_CATEGORIES.length) + WORKSPACE_CATEGORIES.length) %
              WORKSPACE_CATEGORIES.length;

            if (normalizedIndex !== activeIndexRef.current) {
              activeIndexRef.current = normalizedIndex;
              setActiveIndex(normalizedIndex);
            }
          }
        }
      }
      rafId = requestAnimationFrame(syncActiveCategory);
    };

    rafId = requestAnimationFrame(syncActiveCategory);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[1360px] mx-auto select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Edge Smooth Gradient Overlay — subtle fade so images bleed naturally */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-28 bg-gradient-to-r from-white via-white/70 to-transparent z-20 pointer-events-none" />

      {/* Right Edge Smooth Gradient Overlay */}
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-28 bg-gradient-to-l from-white via-white/70 to-transparent z-20 pointer-events-none" />

      {/* Main Relative Container holding both the background track and stationary Phone Frame */}
      <div className="relative w-full flex items-center justify-center min-h-[470px] xs:min-h-[490px] sm:min-h-[580px] md:min-h-[640px] lg:min-h-[690px] pt-2 sm:pt-4 lg:pt-6 pb-12 sm:pb-16 lg:pb-20">
        {/* Stationary Central Mobile Phone (z-30: ON TOP OF SLIDER TRACK) */}
        {/* Sleek, symmetric black iPhone frame matching exact design */}
        <div
          ref={phoneContainerRef}
          className="absolute z-30 pointer-events-none flex flex-col items-center justify-center select-none w-[210px] xs:w-[225px] sm:w-[260px] md:w-[285px] lg:w-[300px]"
          style={{
            aspectRatio: "9 / 18.5",
          }}
        >
          {/* Outer Chassis: Sleek obsidian black bezel with polished rounded corners & subtle depth */}
          <div className="relative w-full h-full rounded-[34px] xs:rounded-[38px] sm:rounded-[46px] md:rounded-[50px] p-[4px] sm:p-[5px] md:p-[6px] bg-[#0c0c0e] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col">
            {/* Physical iPhone Side Hardware Buttons (Titanium Finished) */}
            {/* Left Side: Action Button */}
            <div
              className="hidden sm:block absolute -left-[3.5px] top-[16%] w-[3.5px] h-6 sm:h-7 bg-[#2e2e34] rounded-l-[3px] border-l border-y border-neutral-500/80 shadow-[0_1px_3px_rgba(0,0,0,0.4)] pointer-events-none"
              aria-hidden="true"
            />
            {/* Left Side: Volume Up */}
            <div
              className="hidden sm:block absolute -left-[3.5px] top-[24%] w-[3.5px] h-10 sm:h-12 bg-[#2e2e34] rounded-l-[3px] border-l border-y border-neutral-500/80 shadow-[0_1px_3px_rgba(0,0,0,0.4)] pointer-events-none"
              aria-hidden="true"
            />
            {/* Left Side: Volume Down */}
            <div
              className="hidden sm:block absolute -left-[3.5px] top-[34%] w-[3.5px] h-10 sm:h-12 bg-[#2e2e34] rounded-l-[3px] border-l border-y border-neutral-500/80 shadow-[0_1px_3px_rgba(0,0,0,0.4)] pointer-events-none"
              aria-hidden="true"
            />
            {/* Right Side: Power / Side Button */}
            <div
              className="hidden sm:block absolute -right-[3.5px] top-[26%] w-[3.5px] h-14 sm:h-16 bg-[#2e2e34] rounded-r-[3px] border-r border-y border-neutral-500/80 shadow-[0_1px_3px_rgba(0,0,0,0.4)] pointer-events-none"
              aria-hidden="true"
            />

            {/* Subtle Antenna Band Indicators */}
            <div className="hidden sm:block absolute -left-[1px] top-[8%] w-[2px] h-[3px] bg-neutral-600/40 pointer-events-none" />
            <div className="hidden sm:block absolute -left-[1px] bottom-[8%] w-[2px] h-[3px] bg-neutral-600/40 pointer-events-none" />
            <div className="hidden sm:block absolute -right-[1px] top-[8%] w-[2px] h-[3px] bg-neutral-600/40 pointer-events-none" />
            <div className="hidden sm:block absolute -right-[1px] bottom-[8%] w-[2px] h-[3px] bg-neutral-600/40 pointer-events-none" />

            {/* Inner Screen Aperture Container */}
            <div
              ref={phoneScreenRef}
              className="relative w-full h-full rounded-[30px] xs:rounded-[34px] sm:rounded-[41px] md:rounded-[45px] overflow-hidden bg-white"
            >
              {/* Dynamic Island: Centered modern camera & sensor capsule */}
              <div className="absolute top-2 sm:top-2.5 md:top-3 left-1/2 -translate-x-1/2 w-16 sm:w-24 md:w-28 h-4.5 sm:h-6 md:h-7 bg-black rounded-full z-30 flex items-center justify-between px-2 sm:px-3 shadow-md pointer-events-none">
                <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#111116] border border-white/5" />
                <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#0a0f1d] border border-blue-900/30 ring-1 ring-white/10" />
              </div>

              {/* Layer 1: Smooth Cross-Fading Active Workspace Image */}
              {WORKSPACE_CATEGORIES.map((cat, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={`phone-cat-${cat.id}`}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                    aria-hidden={!isActive}
                  >
                    <div className="relative w-full h-full overflow-hidden">
                      <Image
                        src={cat.topImg}
                        alt={cat.title}
                        fill
                        sizes="(max-width: 640px) 250px, (max-width: 1024px) 350px, 450px"
                        className="object-cover object-center select-none"
                        priority
                      />
                    </div>
                  </div>
                );
              })}

              {/* Layer 2: Soft White Bottom Gradient Fade inside phone screen */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none z-20"
                style={{
                  height: "42%",
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0.92) 85%, #ffffff 100%)",
                }}
              />
            </div>
          </div>

          {/* CTA Button overlapping lower portion of the phone frame */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] sm:bottom-[-22px] md:bottom-[-26px] z-40 pointer-events-auto whitespace-nowrap">
            <Link
              href="#locations"
              className="inline-flex items-center justify-center bg-black hover:bg-neutral-900 text-white font-bold px-6 sm:px-10 md:px-14 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl md:rounded-[22px] text-xs sm:text-sm md:text-base shadow-2xl hover:shadow-[0_24px_45px_rgba(0,0,0,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 border border-neutral-800 tracking-wide"
            >
              Find Your Perfect Workspace
            </Link>
          </div>
        </div>

        {/* Continuous Horizontal Infinite Slider Track (z-10: BEHIND MOBILE FRAME) */}
        <div className="relative z-10 w-full overflow-x-clip py-2 cursor-grab active:cursor-grabbing">
          <div
            ref={bgTrackRef}
            className="animate-infinite-scroll flex gap-2 sm:gap-3 md:gap-3.5 items-center px-2"
            style={{
              animationDuration: "36s",
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {infiniteItems.map((item, index) => {
              const isCurrentActive = index % WORKSPACE_CATEGORIES.length === activeIndex;

              return (
                <div
                  key={`bg-${item.id}-${index}`}
                  className="flex flex-col items-center shrink-0 w-[95px] xs:w-[105px] sm:w-[120px] md:w-[135px] lg:w-[155px] xl:w-[165px]"
                >
                  {/* Column Images Container (Top & Bottom stacked with square sharp corners) */}
                  <div className="flex flex-col gap-1.5 sm:gap-2.5 w-full">
                    {/* Top Image: Sharp square corners (border-radius: 0) */}
                    <div className="relative w-full aspect-square rounded-none overflow-hidden shadow-sm bg-neutral-100">
                      <Image
                        src={item.topImg}
                        alt={`${item.title} top view`}
                        fill
                        sizes="(max-width: 640px) 110px, 140px"
                        className="object-cover rounded-none"
                        priority={index < 6}
                      />
                    </div>

                    {/* Bottom Image: Sharp square corners (border-radius: 0) */}
                    <div className="relative w-full aspect-square rounded-none overflow-hidden shadow-sm bg-neutral-100">
                      <Image
                        src={item.bottomImg}
                        alt={`${item.title} bottom view`}
                        fill
                        sizes="(max-width: 640px) 110px, 140px"
                        className="object-cover rounded-none"
                        priority={index < 6}
                      />
                    </div>
                  </div>

                  {/* Text Description below images */}
                  <div className="mt-2.5 sm:mt-4 text-center px-0.5 sm:px-1">
                    <h3
                      className={`text-[9px] sm:text-[11px] md:text-xs tracking-wider uppercase transition-colors duration-200 ${
                        isCurrentActive ? "text-neutral-950 font-black" : "text-neutral-800 font-bold"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`text-[8px] sm:text-[10px] md:text-[11px] mt-0.5 transition-colors duration-200 ${
                        isCurrentActive ? "text-neutral-800 font-semibold" : "text-neutral-500 font-medium"
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
