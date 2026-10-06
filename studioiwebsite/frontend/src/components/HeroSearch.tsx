"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, LayoutGrid, Check } from "lucide-react";

export default function HeroSearch() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSpace, setSelectedSpace] = useState<string>("");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const locations = [
    "Horizon Tower, Jaipur",
    "Lehariya | KGK Realty, Jaipur",
  ];

  const spaces = [
    "Hot Desk",
    "Dedicated Desk",
    "Private Cabin",
    "Meeting Room",
    "Event Space",
  ];

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedLocation) {
      params.set("location", selectedLocation);
    }
    if (selectedSpace) {
      params.set("space", selectedSpace);
    }
    if (selectedDate) {
      params.set("date", selectedDate);
    }
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div id="search-bar" className="w-full max-w-4xl mx-auto px-3 xs:px-4 mt-6 sm:mt-8 relative z-30">
      {/* Click outside backdrop for dropdowns */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* Pill Container (Horizontal on both Mobile and Desktop) */}
      <div className="bg-white rounded-full px-2.5 xs:px-4 sm:px-6 py-1.5 sm:py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-200/90 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative z-40">

        {/* 1. Location Column */}
        <div className="relative flex-1 min-w-0 pr-1 xs:pr-2">
          <div
            onClick={() => toggleDropdown("location")}
            className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 cursor-pointer group py-1"
          >
            <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-slate-400 group-hover:text-[#0e4962] transition-colors shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <span className="block text-[11px] xs:text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-[#0e4962] transition-colors leading-tight">
                Location
              </span>
              <span className="block text-[9px] xs:text-[10px] sm:text-xs text-gray-400 truncate mt-0.5 leading-tight">
                {selectedLocation || "Search co-working..."}
              </span>
            </div>
          </div>

          {activeDropdown === "location" && (
            <div className="absolute top-[calc(100%+12px)] left-0 w-60 xs:w-64 max-w-[85vw] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                Available Campuses
              </div>
              {locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(loc);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0e4962] rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{loc}</span>
                  </span>
                  {selectedLocation === loc && (
                    <Check className="w-3.5 h-3.5 text-[#0e4962] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider 1 */}
        <div className="h-6 xs:h-7 sm:h-9 w-[1px] bg-gray-200 shrink-0" />

        {/* 2. When Column */}
        <div className="relative flex-1 min-w-0 px-1.5 xs:px-2.5 sm:px-3">
          <div
            onClick={() => toggleDropdown("when")}
            className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 cursor-pointer group py-1"
          >
            <Calendar className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-slate-400 group-hover:text-[#0e4962] transition-colors shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <span className="block text-[11px] xs:text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-[#0e4962] transition-colors leading-tight">
                When
              </span>
              <span className="block text-[9px] xs:text-[10px] sm:text-xs text-gray-400 truncate mt-0.5 leading-tight">
                {selectedDate || "Add date"}
              </span>
            </div>
          </div>

          {activeDropdown === "when" && (
            <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-64 xs:w-72 max-w-[88vw] bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
                Select Date
              </div>
              <input
                type="date"
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(
                      new Date(e.target.value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    );
                    setActiveDropdown(null);
                  }
                }}
                className="w-full mt-2 p-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0e4962]"
              />
              <div className="mt-2.5 flex gap-1.5 flex-wrap">
                {["Today", "Tomorrow", "Next Monday"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setSelectedDate(label);
                      setActiveDropdown(null);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-gray-100 hover:bg-[#0e4962] hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider 2 */}
        <div className="h-6 xs:h-7 sm:h-9 w-[1px] bg-gray-200 shrink-0" />

        {/* 3. Space Type Column */}
        <div className="relative flex-1 min-w-0 px-1.5 xs:px-2.5 sm:px-3">
          <div
            onClick={() => toggleDropdown("space")}
            className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 cursor-pointer group py-1"
          >
            <LayoutGrid className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-slate-400 group-hover:text-[#0e4962] transition-colors shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <span className="block text-[11px] xs:text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-[#0e4962] transition-colors leading-tight">
                Space Type
              </span>
              <span className="block text-[9px] xs:text-[10px] sm:text-xs text-gray-400 truncate mt-0.5 leading-tight">
                {selectedSpace || "Choose workspace"}
              </span>
            </div>
          </div>

          {activeDropdown === "space" && (
            <div className="absolute top-[calc(100%+12px)] right-0 w-60 xs:w-64 max-w-[85vw] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                Workspace Options
              </div>
              {spaces.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => {
                    setSelectedSpace(sp);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0e4962] rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <LayoutGrid className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{sp}</span>
                  </span>
                  {selectedSpace === sp && (
                    <Check className="w-3.5 h-3.5 text-[#0e4962] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider 3 */}
        <div className="h-6 xs:h-7 sm:h-9 w-[1px] bg-gray-200 shrink-0" />

        {/* 4. Circular Magenta Search Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSearch();
          }}
          className="w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-11 sm:h-11 rounded-full bg-[#0e4962] hover:bg-[#093447] text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-all duration-200 ml-1.5 xs:ml-2 sm:ml-3 cursor-pointer"
          aria-label="Search Workspace"
        >
          <Search className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
