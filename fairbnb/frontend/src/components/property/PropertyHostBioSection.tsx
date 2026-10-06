'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

interface PropertyHostBioSectionProps {
  hostName: string;
}

export function PropertyHostBioSection({ hostName }: PropertyHostBioSectionProps) {
  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Host Avatar */}
        <div className="w-16 h-16 rounded-full bg-[#0f4c5c] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-xs">
          {hostName.charAt(0).toUpperCase()}
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900">Hosted by {hostName}</h3>
          <p className="text-sm text-gray-700 font-normal">Hi, I&apos;m {hostName}!</p>

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
            <span>Joined in 2023</span>
            <span>·</span>
            <span>Response rate: 100%</span>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => alert(`Starting direct chat with ${hostName}...`)}
              className="bg-[#0f4c5c] hover:bg-[#0a3844] active:bg-[#06242c] text-white text-sm font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2.5 transition shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Message host</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
