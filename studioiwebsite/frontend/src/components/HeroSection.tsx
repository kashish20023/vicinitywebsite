"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import WorkspaceInfiniteSlider from "@/components/WorkspaceInfiniteSlider";

export default function HeroSection() {
  return (
    <section className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-2 sm:px-4 relative overflow-x-clip">
      {/* Container for Headline & Doodles */}
      <div className="max-w-[1100px] mx-auto text-center relative px-4">
        {/* Left Doodle: Some Space New Possibilities with complete arrow */}
        <div className="hidden lg:block absolute -top-4 left-4 xl:left-8 w-36 xl:w-40 pointer-events-none select-none animate-float">
          <Image
            src="/assets/doodle-left-complete.png"
            alt="Some Space New Possibilities"
            width={160}
            height={125}
            priority
            className="object-contain"
          />
        </div>

        {/* Right Doodle: Work & Connect with complete arrow */}
        <div
          className="hidden lg:block absolute -top-4 right-4 xl:right-8 w-28 xl:w-32 pointer-events-none select-none animate-float"
          style={{ animationDelay: "1.5s" }}
        >
          <Image
            src="/assets/doodle-right-complete.png"
            alt="Work & Connect"
            width={110}
            height={110}
            priority
            className="object-contain"
          />
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 leading-[1.15]">
          A Workspace for{" "}
          <span className="text-[#0e4962] italic">
            Every You
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-xs sm:text-sm md:text-base text-neutral-600 max-w-xl mx-auto font-normal leading-relaxed px-2">
          Flexible desks, private cabins, meeting rooms and more — book inspiring coworking spaces
          instantly, anytime, anywhere.
        </p>
      </div>

      {/* Visual Showcase Strip: Continuous Infinite Slider with Central Phone Highlighting */}
      <div className="relative mt-4 sm:mt-6 md:mt-8 lg:mt-10 w-full">
        <WorkspaceInfiniteSlider />
      </div>
    </section>
  );
}
