'use client';

import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

export interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSuperhost?: boolean;
  isVerified?: boolean;
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

const SIZE_STYLES = {
  xs: { box: 'w-6 h-6 text-[10px]', badge: 'w-2 h-2 -bottom-0.5 -right-0.5', icon: 'w-2.5 h-2.5' },
  sm: { box: 'w-8 h-8 text-xs', badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5', icon: 'w-3 h-3' },
  md: { box: 'w-10 h-10 text-sm font-semibold', badge: 'w-3 h-3 -bottom-0.5 -right-0.5', icon: 'w-3.5 h-3.5' },
  lg: { box: 'w-12 h-12 text-base font-bold', badge: 'w-3.5 h-3.5 bottom-0 right-0', icon: 'w-4 h-4' },
  xl: { box: 'w-16 h-16 text-xl font-bold', badge: 'w-4.5 h-4.5 bottom-0.5 right-0.5', icon: 'w-5 h-5' },
  '2xl': { box: 'w-20 h-20 text-2xl font-bold', badge: 'w-5 h-5 bottom-1 right-1', icon: 'w-6 h-6' },
};

const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-purple-500 to-violet-700',
  'from-cyan-500 to-blue-600',
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradient(name?: string): string {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export function UserAvatar({
  name = 'User',
  avatarUrl,
  size = 'md',
  isSuperhost = false,
  isVerified = false,
  status,
  className = '',
}: UserAvatarProps) {
  const sizeConfig = SIZE_STYLES[size];
  const initials = getInitials(name);
  const gradient = getGradient(name);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {/* AVATAR BOX */}
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-2xs select-none ${sizeConfig.box} ${
          avatarUrl ? 'bg-neutral-100' : `bg-gradient-to-tr ${gradient}`
        }`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // On image error, hide image and show initials
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* SUPERHOST BADGE */}
      {isSuperhost && (
        <div
          className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 border-2 border-white shadow-xs"
          title="Superhost"
        >
          <Award className={sizeConfig.icon} />
        </div>
      )}

      {/* VERIFIED BADGE (IF NOT SUPERHOST) */}
      {!isSuperhost && isVerified && (
        <div
          className="absolute -bottom-1 -right-1 bg-[#0e4962] text-white rounded-full p-0.5 border-2 border-white shadow-xs"
          title="Verified Profile"
        >
          <ShieldCheck className={sizeConfig.icon} />
        </div>
      )}

      {/* ONLINE STATUS INDICATOR */}
      {status && !isSuperhost && !isVerified && (
        <span
          className={`absolute rounded-full border-2 border-white ${sizeConfig.badge} ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'busy'
              ? 'bg-amber-500'
              : 'bg-neutral-400'
          }`}
        />
      )}
    </div>
  );
}
