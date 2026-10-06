"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What workspace options does Studio i offer?",
      answer:
        "Studio i offers a versatile range of workspaces tailored to your workflow, including flexible Hot Desks, Dedicated Desks for everyday focus, fully furnished Private Cabins with 24/7 access, modern Meeting Rooms with high-tech presentation setups, and spacious Event Spaces for company summits.",
    },
    {
      question: "Can I book a desk or private cabin?",
      answer:
        "Yes! You can reserve hot desks and dedicated desks instantly through our app or website. For private cabins, we provide customizable flexible terms ranging from month-to-month to annual executive leases.",
    },
    {
      question: "Are meeting rooms and boardrooms available?",
      answer:
        "All Studio i members and external guests can book our state-of-the-art conference and boardroom facilities by the hour, complete with high-speed fiber internet, 4K wireless casting, and complimentary artisanal refreshments.",
    },
    {
      question: "Can I book a workspace for a day?",
      answer:
        "Absolutely. We offer flexible Day Passes that grant you full access to open ergonomic desks, high-speed WiFi, phone booths, lounge areas, and unlimited specialty coffee from 8 AM to 11 PM.",
    },
    {
      question: "When can I expect progress?",
      answer:
        "Our onboarding is instantaneous. Once you sign up or book a space, you immediately receive mobile keycard access, high-speed WiFi credentials, and workspace credits ready to use on your chosen date.",
    },
    {
      question: "How do we stay connected?",
      answer:
        "You stay connected through the Studio i member community network, weekly networking mixers, our dedicated community managers on-site, and our 24/7 digital concierge support on WhatsApp.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-14 sm:py-20 max-sm:py-8 px-4 sm:px-6 max-w-[1180px] mx-auto">
      {/* Top Tag & Main Headline */}
      <div className="text-center mb-12 sm:mb-16 max-sm:mb-8">
        <span className="text-[#0e4962] font-semibold text-sm tracking-widest uppercase block mb-2">
          Our Testimonial
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
          Got Questions? <br className="hidden sm:inline" />
          We&apos;ve Got <span className="text-[#0e4962]">Answers</span>
        </h2>
        <p className="mt-3 text-neutral-600 text-base max-w-md mx-auto">
          Everything you need to know about working at Studio i.
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-sm:gap-2 sm:gap-12 items-start">
        {/* Left Column: Quick Contact Info */}
        <div className="lg:col-span-4 lg:sticky lg:top-28">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight leading-snug">
            Your Questions <br />
            <span className="text-[#0e4962]">Answered</span>
          </h3>
          <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-sm">
            Quick answers to help you understand Studio i, our spaces, and what you can expect.
          </p>

          <Link
            href="#footer"
            className="inline-flex items-center gap-2 mt-8 text-sm font-bold text-neutral-900 hover:text-[#0e4962] transition-colors group"
          >
            <span>Contact our team</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {/* Right Column: Accordion */}
        <div className="lg:col-span-8 flex flex-col">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="border-t border-neutral-900/90 py-5 max-sm:py-3 sm:py-6 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between gap-4 text-left group focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-[#0e4962] transition-colors leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full bg-neutral-200 group-hover:bg-[#0e4962] group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "bg-[#0e4962] text-white rotate-90" : "text-neutral-800"
                      }`}
                  >
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {/* Animated Accordion Content */}
                {isOpen && (
                  <div className="mt-3.5 pr-10 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed font-normal">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          {/* Bottom border for last item */}
          <div className="border-t border-neutral-900/90" />
        </div>
      </div>
    </section>
  );
}
