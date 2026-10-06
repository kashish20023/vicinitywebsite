'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Star, Image as ImageIcon, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/context/toast-context';

export interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSizeMb?: number;
  label?: string;
  helperText?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

export function ImageUploader({
  images = [],
  onChange,
  maxImages = 15,
  maxFileSizeMb = 5,
  label = 'Property Photos',
  helperText = 'Upload at least 5 photos. First photo is the cover preview.',
  theme = 'light',
  className = '',
}: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDark = theme === 'dark';

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.warning(`You can upload a maximum of ${maxImages} photos.`);
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        continue;
      }
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${maxFileSizeMb}MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Convert to object URLs (or base64/remote URLs in real upload)
    const newImageUrls = validFiles.map((file) => URL.createObjectURL(file));
    onChange([...images, ...newImageUrls]);
    toast.success(`Added ${newImageUrls.length} photo${newImageUrls.length > 1 ? 's' : ''}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) {
      toast.warning(`You can upload a maximum of ${maxImages} photos.`);
      return;
    }

    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      toast.error('Please enter a valid image URL (https://...)');
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Photo URL added');
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const filtered = images.filter((_, idx) => idx !== index);
    onChange([item, ...filtered]);
    toast.info('Cover photo updated');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          {label && (
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {label}
            </h4>
          )}
          {helperText && (
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
              {helperText}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold font-tabular ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
            {images.length}/{maxImages} photos
          </span>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
              isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {showUrlInput ? 'Cancel URL' : '+ Image URL'}
          </button>
        </div>
      </div>

      {/* URL INPUT COLLAPSIBLE */}
      {showUrlInput && (
        <div className="flex items-center gap-2 animate-in fade-in duration-200">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL (https://...)"
            className={`flex-1 px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
              isDark
                ? 'bg-[#131b2e] border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
                : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-[#0e4962]'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              isDark
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                : 'bg-[#0e4962] text-white hover:bg-[#093447]'
            }`}
          >
            Add
          </button>
        </div>
      )}

      {/* DRAG & DROP ZONE */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? isDark
              ? 'border-amber-400 bg-amber-400/10'
              : 'border-[#0e4962] bg-[#0e4962]/5'
            : isDark
            ? 'border-slate-800 hover:border-slate-700 bg-[#0c1222]/60 hover:bg-[#0c1222]'
            : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/70 hover:bg-neutral-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-slate-800 text-amber-400' : 'bg-neutral-100 text-[#0e4962]'
            }`}
          >
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Click to browse or drag photos here
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
              PNG, JPG, or WEBP up to {maxFileSizeMb}MB
            </p>
          </div>
        </div>
      </div>

      {/* PREVIEWS GRID */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-2xs transition-all duration-200 ${
                isDark ? 'border-slate-800 bg-[#131b2e]' : 'border-neutral-200 bg-white'
              }`}
            >
              <img
                src={img}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* COVER PHOTO BADGE */}
              {idx === 0 ? (
                <span
                  className={`absolute top-2 left-2 text-overline font-bold px-2 py-0.5 rounded-md shadow-xs ${
                    isDark ? 'bg-amber-400 text-slate-950' : 'bg-[#0e4962] text-white'
                  }`}
                >
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetCover(idx)}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-black/70 hover:bg-black text-white text-overline font-semibold px-2 py-0.5 rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer"
                  title="Make cover photo"
                >
                  <Star className="w-2.5 h-2.5" />
                  <span>Set Cover</span>
                </button>
              )}

              {/* REMOVE BUTTON */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
