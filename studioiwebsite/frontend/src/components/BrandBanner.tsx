"use client";

import React from "react";
import Image from "next/image";

export default function BrandBanner() {
  return (
    <section className="sm:py-8 px-3 xs:px-4 sm:px-6 max-w-[1180px] mx-auto w-full">
      <div className="relative w-full rounded-2xl sm:rounded-full overflow-hidden shadow-2xl border border-neutral-800/90 bg-black min-h-[52px] xs:min-h-[58px] sm:min-h-[72px] md:min-h-[80px] flex items-center justify-between px-3.5 xs:px-5 sm:px-8 md:px-10 py-2.5 sm:py-3.5 transition-all">
        {/* Background Image: High-res authentic office with ambient dark overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/extracted_images/img_02_X7.jpg"
            alt="Studio i Coworking Office"
            fill
            sizes="(max-width: 768px) 100vw, 1180px"
            className="object-cover object-[center_35%] filter brightness-[0.32]"
            priority
          />
          {/* Subtle gradient vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/85 pointer-events-none" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full flex items-center justify-between gap-2 xs:gap-3 sm:gap-6">
          {/* Left: Studio i Logo */}
          <div className="relative h-6 xs:h-7 sm:h-8 md:h-9 w-22 xs:w-26 sm:w-32 md:w-36 shrink-0 flex items-center">
            <Image
              src="/assets/logo-studioi.png"
              alt="Studio i"
              width={140}
              height={36}
              priority
              className="object-contain object-left h-full w-auto"
            />
          </div>

          {/* Right: Brand Slogan */}
          <span className="text-right text-[11px] xs:text-[13px] sm:text-base md:text-lg lg:text-xl font-bold text-white tracking-tight sm:tracking-normal truncate select-none">
            Your Space. Your Work. Your Way.
          </span>
        </div>
      </div>
    </section>
  );
}
