'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    read?: boolean;
  }>;
}

export function NotificationsPopover({
  isOpen,
  onClose,
  notifications = [],
}: NotificationsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden"
    >
      {/* HEADER TITLE */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-h4 font-bold text-gray-900 tracking-tight">
          Notifications
        </h3>
      </div>

      {/* BODY CONTENT */}
      {notifications.length === 0 ? (
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-1">
            <Bell className="w-7 h-7 text-gray-300 stroke-[1.5]" />
          </div>
          <p className="text-body-sm font-semibold text-gray-700">
            No new notifications
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
              <p className="text-body-sm font-semibold text-gray-900">{n.title}</p>
              <p className="text-caption text-gray-500 mt-0.5">{n.message}</p>
              <span className="text-caption text-gray-400 mt-1 block">{n.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="p-3.5 border-t border-gray-100 text-center bg-gray-50/50">
        <Link
          href="/guest/trips"
          onClick={onClose}
          className="text-button font-medium text-[#0e4962] hover:underline cursor-pointer block"
        >
          View all messages
        </Link>
      </div>
    </div>
  );
}
