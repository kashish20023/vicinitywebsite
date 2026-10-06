'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface SharePropertyInfo {
  id: string;
  slug?: string;
  title: string;
  category?: string;
  propertyType?: string;
  locality?: string;
  city: string;
  state?: string;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  rating?: number;
  coverImage?: string;
  images?: string[];
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SharePropertyInfo;
}

export function ShareModal({ isOpen, onClose, property }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Format type like "Villa", "Home", "Flat", "Cottage"
  const getTypeName = () => {
    const cat = (property.category || '').toLowerCase();
    const pType = (property.propertyType || '').toLowerCase();
    if (cat.includes('villa') || pType.includes('villa')) return 'Villa';
    if (cat.includes('flat') || cat.includes('apartment') || pType.includes('apartment')) return 'Flat';
    if (cat.includes('cottage')) return 'Cottage';
    if (cat.includes('haveli')) return 'Haveli';
    if (cat.includes('chalet')) return 'Chalet';
    if (property.category && property.category.length < 15) {
      return property.category.charAt(0).toUpperCase() + property.category.slice(1);
    }
    return 'Home';
  };

  const place = property.locality || property.city || 'India';
  const typeName = getTypeName();
  const bedrooms = property.bedrooms || 3;
  const beds = property.beds || bedrooms;
  const bathrooms = property.bathrooms || bedrooms;
  const ratingText = property.rating ? property.rating.toFixed(2) : '4.96';

  const summaryText = `${typeName} in ${place} · ★${ratingText} · ${bedrooms} bedrooms · ${beds} beds · ${bathrooms} bathrooms`;

  const propertyImage =
    property.coverImage ||
    (property.images && property.images.length > 0 ? property.images[0] : '') ||
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Check out this stay on Fair Stay: ${property.title}`);
    const body = encodeURIComponent(
      `Hey,\n\nI found this incredible place on Fair Stay and wanted to share it with you:\n\n${property.title}\n${currentUrl}\n`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleMessages = () => {
    const text = encodeURIComponent(`Check out this place on Fair Stay: ${property.title} - ${currentUrl}`);
    window.open(`sms:?body=${text}`, '_self');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Check out this place on Fair Stay: ${property.title}\n${currentUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleMessenger = () => {
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
        currentUrl
      )}&app_id=291494419107518&redirect_uri=${encodeURIComponent(currentUrl)}`,
      '_blank'
    );
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`Check out this incredible stay on Fair Stay: ${property.title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  const handleEmbed = async () => {
    const embedCode = `<iframe src="${currentUrl}" width="600" height="400" frameborder="0"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleMore = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out ${property.title} on Fairbnb`,
          url: currentUrl,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-[560px] w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TITLE */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">Share this place</h2>

        {/* PROPERTY PREVIEW SNIPPET */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={propertyImage}
            alt={property.title}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover flex-shrink-0 bg-gray-100"
          />
          <p className="text-sm sm:text-base text-gray-900 leading-snug font-normal">
            {summaryText}
          </p>
        </div>

        {/* SHARE OPTIONS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. COPY LINK */}
          <button
            onClick={handleCopyLink}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-gray-900 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
            <span className="text-sm font-semibold text-gray-900">
              {copied ? 'Link Copied!' : 'Copy Link'}
            </span>
          </button>

          {/* 2. EMAIL */}
          <button
            onClick={handleEmail}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-gray-900 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            <span className="text-sm font-semibold text-gray-900">Email</span>
          </button>

          {/* 3. MESSAGES */}
          <button
            onClick={handleMessages}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-gray-900 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="text-sm font-semibold text-gray-900">Messages</span>
          </button>

          {/* 4. WHATSAPP */}
          <button
            onClick={handleWhatsApp}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-900 flex-shrink-0 fill-current">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.08-1.1l-.29-.17-3.04.8 1.05-2.96-.19-.31a8.14 8.14 0 0 1-1.25-4.5c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.76-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.12-.22-.19-.47-.32" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">WhatsApp</span>
          </button>

          {/* 5. MESSENGER */}
          <button
            onClick={handleMessenger}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-900 flex-shrink-0 fill-current">
              <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.727 7.195V22l3.414-1.874c.904.25 1.868.386 2.859.386 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.071 12.445l-2.55-2.72-4.978 2.72 5.474-5.815 2.613 2.72 4.915-2.72-5.474 5.815z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Messenger</span>
          </button>

          {/* 6. FACEBOOK */}
          <button
            onClick={handleFacebook}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-900 flex-shrink-0 fill-current">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Facebook</span>
          </button>

          {/* 7. TWITTER / X */}
          <button
            onClick={handleTwitter}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-900 flex-shrink-0 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Twitter</span>
          </button>

          {/* 8. EMBED */}
          <button
            onClick={handleEmbed}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            {embedCopied ? (
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-gray-900 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            )}
            <span className="text-sm font-semibold text-gray-900">
              {embedCopied ? 'Code Copied!' : 'Embed'}
            </span>
          </button>

          {/* 9. MORE OPTIONS */}
          <button
            onClick={handleMore}
            className="border border-gray-300 rounded-xl p-3.5 flex items-center gap-3 hover:border-black hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-900 flex-shrink-0 fill-current">
              <circle cx="5" cy="12" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="19" cy="12" r="2"></circle>
            </svg>
            <span className="text-sm font-semibold text-gray-900">More options</span>
          </button>
        </div>
      </div>
    </div>
  );
}
