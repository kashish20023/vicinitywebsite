'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, ShieldCheck, Calendar, Users, MessageSquare, 
  Wrench, CheckCircle2, ArrowRight, Eye, Sparkles
} from 'lucide-react';

interface AssignedProperty {
  id: string;
  title: string;
  city: string;
  address: string;
  primaryHost: string;
  presetPackage: 'FULL_ACCESS' | 'OPERATIONS' | 'CALENDAR_MESSAGING';
  grantedPermissionsCount: number;
  splitSummary: string;
  activeBookings: number;
  image: string;
}

const MOCK_ASSIGNED_PROPERTIES: AssignedProperty[] = [
  {
    id: 'prop-101',
    title: 'Lehariya KGK Realty — Executive Coworking Floor',
    city: 'Jaipur',
    address: 'Near Jawahar Circle, Malviya Nagar, Jaipur',
    primaryHost: 'Shyam Media Group',
    presetPackage: 'OPERATIONS',
    grantedPermissionsCount: 7,
    splitSummary: '15% Revenue Split',
    activeBookings: 8,
    image: '/assets/building-lehariya.png',
  },
  {
    id: 'prop-102',
    title: 'Horizon Tower — Executive Private Cabins',
    city: 'Jaipur',
    address: 'JLN Marg, Tonk Road, Jaipur',
    primaryHost: 'Priya Mehta',
    presetPackage: 'FULL_ACCESS',
    grantedPermissionsCount: 18,
    splitSummary: '20% Revenue Split',
    activeBookings: 5,
    image: '/assets/building-horizon.png',
  },
];

export default function CoHostPropertiesDirectoryPage() {
  const [properties, setProperties] = useState<AssignedProperty[]>(MOCK_ASSIGNED_PROPERTIES);

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Delegated Portfolio</span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
          Assigned Properties Workspace Directory
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Access properties where you hold operational delegation grants and permission-gated workspaces.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((p) => (
          <div key={p.id} className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="h-44 bg-neutral-100 relative overflow-hidden">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black rounded-full bg-[#0e4962] text-white uppercase shadow-xs">
                  {p.presetPackage.replace('_', ' ')}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-black rounded-full bg-white/90 text-neutral-900 border border-neutral-200 shadow-xs">
                  {p.splitSummary}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-neutral-900">{p.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{p.address}</p>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs flex justify-between items-center">
                  <span className="text-neutral-500">Primary Property Host</span>
                  <span className="font-bold text-neutral-900">{p.primaryHost}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#0e4962]" />
                  <span>{p.grantedPermissionsCount} of 18 Permission Flags Granted</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-2">
              <Link
                href={`/co-host/properties/${p.id}`}
                className="flex-1 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Eye className="w-4 h-4" /> Open Workspace Hub
              </Link>
              <Link
                href={`/co-host/calendar`}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
              >
                <Calendar className="w-4 h-4 text-[#0e4962]" /> Calendar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
