'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, 
  Unlock, DollarSign, Plus, Sparkles, X, Check
} from 'lucide-react';

export default function HostMultiCalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [blockedDates, setBlockedDates] = useState<number[]>([15, 16, 28]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const toggleBlockDate = (day: number) => {
    setBlockedDates(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Calendar & Availability Control</span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Multi-Property Booking Calendar
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage date availability, block maintenance days, and set holiday pricing multipliers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 shadow-xs">
            <button className="p-1 hover:text-[#0e4962] cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3">{selectedMonth}</span>
            <button className="p-1 hover:text-[#0e4962] cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-xs">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-200 pb-3">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const isBlocked = blockedDates.includes(day);
            const isBooked = [5, 6, 7, 12, 18, 19, 23, 24].includes(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`h-24 p-2 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  isBlocked ? 'bg-red-50 border-red-200 text-red-700' :
                  isBooked ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  'bg-neutral-50 border-neutral-200 text-neutral-800 hover:border-[#0e4962] hover:bg-[#edf4f7]/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">{day}</span>
                  {isBlocked && <Lock className="w-3.5 h-3.5 text-red-500" />}
                  {isBooked && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>

                <div className="text-[10px] font-bold">
                  {isBlocked ? <span className="text-red-600 uppercase">Blocked</span> :
                   isBooked ? <span className="text-emerald-700 uppercase">Reserved</span> :
                   <span className="text-neutral-500">₹1,500/nt</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Detail Drawer */}
      {selectedDate !== null && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedDate(null)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962]">Calendar Control</span>
              <h2 className="text-xl font-black text-neutral-900 mt-1">September {selectedDate}, 2026</h2>
            </div>

            <div className="space-y-3 text-xs">
              <button
                onClick={() => toggleBlockDate(selectedDate)}
                className={`w-full py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  blockedDates.includes(selectedDate)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {blockedDates.includes(selectedDate) ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {blockedDates.includes(selectedDate) ? 'Unblock Date for Bookings' : 'Block Date (Host Hold)'}
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-200"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
