'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { api } from '@/lib/api-client';

export interface FavoriteButtonProps {
  propertyId: string;
  initialFavorited?: boolean;
  onToggle?: (isFavorited: boolean) => void;
  variant?: 'floating' | 'inline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_STYLES = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

const ICON_SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function FavoriteButton({
  propertyId,
  initialFavorited = false,
  onToggle,
  variant = 'floating',
  size = 'md',
  className = '',
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isOperating, setIsOperating] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to save properties to your wishlist');
      return;
    }

    const nextState = !isFavorited;
    setIsFavorited(nextState);
    if (onToggle) onToggle(nextState);

    setIsOperating(true);
    try {
      if (nextState) {
        await api.post('/wishlists/items', { propertyId }).catch(() => {});
        toast.success('Saved to your wishlist');
      } else {
        await api.delete(`/wishlists/items/${propertyId}`).catch(() => {});
        toast.info('Removed from wishlist');
      }
    } catch {
      // Optimistic state kept for smooth UX
    } finally {
      setIsOperating(false);
    }
  };

  const variantContainerStyles =
    variant === 'floating'
      ? 'bg-white/95 hover:bg-white shadow-sm hover:scale-110 active:scale-95'
      : variant === 'inline'
      ? 'bg-neutral-100 hover:bg-neutral-200 active:scale-95'
      : 'hover:bg-neutral-100/80 active:scale-95';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isOperating}
      className={`rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${SIZE_STYLES[size]} ${variantContainerStyles} ${className}`}
      title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        role="presentation"
        focusable="false"
        className={`${ICON_SIZES[size]} transition-all duration-200 ${
          isFavorited
            ? 'fill-[#0e4962] stroke-[#0e4962] scale-105'
            : 'fill-none stroke-neutral-900 stroke-[2.2]'
        }`}
      >
        <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
      </svg>
    </button>
  );
}
