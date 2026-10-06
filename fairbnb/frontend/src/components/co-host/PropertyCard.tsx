'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, MapPin, ArrowRight, Info, X } from 'lucide-react';
import { getAccessSentence } from '@/lib/permissions/groupPermissions';
import AccessSummary from './AccessSummary';
import type { CoHostRelationship } from '@/types';

interface PropertyCardProps {
  relationship: CoHostRelationship;
}

export default function PropertyCard({ relationship }: PropertyCardProps) {
  const prop = relationship.property;
  const host = relationship.hostUser || prop?.host;
  const rawPerms = relationship.permissions || [];
  const permissions = rawPerms.map((p) => (typeof p === 'string' ? p : p.permission));
  const sentence = getAccessSentence(permissions);
  const [showAccessModal, setShowAccessModal] = useState(false);

  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-5 hover:border-neutral-300 transition flex flex-col justify-between space-y-4 shadow-xs">
      <div className="space-y-3">
        {/* COVER IMAGE & OWNER BADGE */}
        <div className="h-40 bg-neutral-100 rounded-2xl overflow-hidden relative">
          {prop?.images?.[0] ? (
            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <Building2 className="w-8 h-8" />
            </div>
          )}
          {host?.name && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-xs text-white text-overline font-semibold uppercase tracking-wider rounded-xl">
              Host: {host.name}
            </span>
          )}
        </div>

        {/* TITLE & LOCATION */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-neutral-900 text-h4 line-clamp-1">{prop?.title}</h4>
            <button
              onClick={() => setShowAccessModal(true)}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition shrink-0"
              title="My Access Summary"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-caption text-neutral-500 font-medium flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {prop?.city}, {prop?.state}
          </p>
        </div>

        {/* ACCESS SENTENCE & ALLOWED CHIPS ONLY (RULES #2 & #3) */}
        <AccessSummary permissions={permissions} showSentence={true} compactChips={true} />
      </div>

      {/* FOOTER & SINGLE OPEN BUTTON */}
      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-caption font-semibold font-tabular text-neutral-500">
          {prop?.bookings?.length || 0} stays
        </span>
        <Link
          href={`/co-host/properties/${prop?.id}`}
          className="px-4 py-2 bg-[#0e4962] hover:bg-[#1a6585] text-white rounded-xl text-button font-medium transition flex items-center gap-1.5"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* MY ACCESS MODAL */}
      {showAccessModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 text-h4">My Access</h3>
              <button
                onClick={() => setShowAccessModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-neutral-900 text-body-sm">{prop?.title}</p>
              <p className="text-caption text-neutral-500 mt-1">{sentence}</p>
            </div>
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-overline font-semibold uppercase tracking-wider text-neutral-400 mb-2">Active Features</p>
              <AccessSummary permissions={permissions} showSentence={false} compactChips={false} />
            </div>
            <button
              onClick={() => setShowAccessModal(false)}
              className="w-full py-2 bg-neutral-100 text-neutral-800 font-medium rounded-xl text-button hover:bg-neutral-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
