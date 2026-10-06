"use client";

import React from "react";
import Link from "next/link";
import { InstagramIcon, FacebookIcon, LinkedinIcon, XTwitterIcon } from "./SocialIcons";

export default function Footer() {
  const quickLinks = [
    { name: "About Us", href: "#" },
    { name: "Service", href: "#services" },
    { name: "Co - Working Space", href: "#locations" },
    { name: "Business Profile", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Term & Conditions", href: "#" },
    { name: "Contact Us", href: "#" },
  ];

  return (
    <footer id="footer" className="bg-[#0e4962] text-white pt-16 pb-8 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Main 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 pb-14 border-b border-white/20">
          {/* Column 1: Brand & About Us */}
          <div className="md:col-span-5 lg:col-span-5 flex flex-col gap-4">
            {/* White Studio i Logo */}
            <Link href="/" className="inline-flex items-center gap-1 group">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline">
                Studio
                <span className="relative ml-1 inline-flex flex-col items-center">
                  <span className="w-2.5 h-2.5 bg-white rounded-full mb-0.5" />
                  <span className="w-2.5 h-5 bg-white rounded-sm" />
                </span>
              </span>
            </Link>

            <h4 className="text-base font-bold text-white mt-1">About Us</h4>
            <p className="text-sm leading-relaxed text-white/90 max-w-md font-normal">
              We don&apos;t just offer services—we create growth engines. Our team combines design,
              marketing, and data to help brands scale faster, smarter, and more profitably in
              today&apos;s digital world.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-all duration-200 border border-white/20"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-all duration-200 border border-white/20"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-all duration-200 border border-white/20"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X / Twitter"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-all duration-200 border border-white/20"
              >
                <XTwitterIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="text-base font-bold text-white mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/90">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-white hover:underline transition-all underline-offset-4"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Location */}
          <div className="md:col-span-4 lg:col-span-4">
            <h4 className="text-base font-bold text-white mb-4">Flagship Location</h4>
            <div className="flex flex-col gap-3 text-sm text-white/90">
              <p className="leading-relaxed">
                A Tower - 1st Floor, Lehariya | KGK Realty, Near Jawahar Circle, Malviya Nagar, Jaipur
                <br />
                Rajasthan, 302017, India
              </p>
              <p className="font-semibold text-white">Available Daily: 8am - 11pm</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Icons */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/90">
          <p>© 2026 Shyam Media Group All rights reserved</p>

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-colors"
            >
              <InstagramIcon className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-colors"
            >
              <FacebookIcon className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-colors"
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X / Twitter"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white text-white hover:text-[#0e4962] flex items-center justify-center transition-colors"
            >
              <XTwitterIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
