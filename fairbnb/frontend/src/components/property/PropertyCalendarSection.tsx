'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyCalendarSectionProps {
  basePrice: number;
  bookedRanges?: Array<{ checkIn: string; checkOut: string }>;
  unavailableDates?: string[];
  checkIn: string;
  checkOut: string;
  onSelect: (ci: string, co: string) => void;
}

function fmt(str: string) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isBlocked(
  dateKey: string,
  bookedRanges: Array<{ checkIn: string; checkOut: string }> = [],
  unavailableDates: string[] = [],
  today: Date,
) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date < todayMidnight) return 'past';
  for (const range of bookedRanges) {
    const ci = fmt(range.checkIn);
    const co = fmt(range.checkOut);
    if (date >= ci && date < co) return 'booked';
  }
  for (const ud of unavailableDates) {
    if (String(ud).startsWith(dateKey)) return 'blocked';
  }
  return false;
}

export function PropertyCalendarSection({
  basePrice,
  bookedRanges = [],
  unavailableDates = [],
  checkIn,
  checkOut,
  onSelect,
}: PropertyCalendarSectionProps) {
  const today = useMemo(() => new Date(), []);
  const [leftYear, setLeftYear] = useState(today.getFullYear());
  const [leftMonth, setLeftMonth] = useState(today.getMonth());
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<'checkIn' | 'checkOut'>(checkIn ? 'checkOut' : 'checkIn');

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  function prevPair() {
    if (leftMonth === 0) {
      setLeftYear(y => y - 1);
      setLeftMonth(11);
    } else {
      setLeftMonth(m => m - 1);
    }
  }

  function nextPair() {
    if (leftMonth === 11) {
      setLeftYear(y => y + 1);
      setLeftMonth(0);
    } else {
      setLeftMonth(m => m + 1);
    }
  }

  function handleDayClick(key: string) {
    const blocked = isBlocked(key, bookedRanges, unavailableDates, today);
    if (blocked === 'past' || blocked === 'booked' || blocked === 'blocked') return;

    if (phase === 'checkIn' || !checkIn) {
      onSelect(key, '');
      setPhase('checkOut');
    } else {
      if (key > checkIn) {
        onSelect(checkIn, key);
        setPhase('checkIn');
      } else if (key < checkIn) {
        onSelect(key, '');
        setPhase('checkOut');
      }
    }
  }

  function inRange(key: string) {
    const end = checkOut || hoverKey;
    if (!checkIn || !end) return false;
    const d = fmt(key);
    const ci = fmt(checkIn);
    const co = fmt(end);
    if (ci <= co) return d > ci && d < co;
    return false;
  }

  function renderMonth(year: number, month: number, isRight: boolean) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const todayKey = toKey(today);

    return (
      <div className={`flex-1 ${isRight ? 'hidden md:block md:pl-6' : 'pr-0 md:pr-6'}`}>
        <div className="text-center text-sm font-semibold text-gray-900 mb-4">
          {MONTHS[month]} {year}
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-xs text-gray-500 py-1 font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="h-12" />;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const blocked = isBlocked(key, bookedRanges, unavailableDates, today);
            const isStart = key === checkIn;
            const isEnd = key === checkOut;
            const isToday = key === todayKey;
            const inRng = inRange(key);
            const isDisabled = blocked === 'past' || blocked === 'booked' || blocked === 'blocked';

            let dotColor = '';
            if (blocked === 'booked') dotColor = 'bg-blue-500';
            else if (blocked === 'blocked') dotColor = 'bg-gray-300';

            return (
              <div
                key={key}
                className={`relative flex flex-col items-center justify-center h-12 text-xs transition-all cursor-pointer select-none
                  ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:rounded-full hover:bg-gray-200/60'}
                  ${isStart || isEnd ? '!rounded-full !bg-[#0e4962] !text-white' : ''}
                  ${inRng ? 'bg-sky-100/60' : ''}
                `}
                onClick={() => handleDayClick(key)}
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey(null)}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full font-medium leading-none ${
                    isToday && !isStart && !isEnd ? 'bg-black text-white font-bold' : ''
                  }`}
                >
                  {day}
                </span>
                {!isDisabled ? (
                  <span className={`text-overline font-normal font-tabular leading-none mt-0.5 ${isStart || isEnd ? 'text-white/80' : 'text-gray-500'}`}>
                    ₹{basePrice.toLocaleString('en-IN')}
                  </span>
                ) : dotColor ? (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div id="availability-section" className="py-8 border-b border-gray-200 scroll-mt-28">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Availability &amp; Prices</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevPair}
            className="w-8 h-8 rounded-full hover:bg-gray-200/60 flex items-center justify-center text-gray-800 transition"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextPair}
            className="w-8 h-8 rounded-full hover:bg-gray-200/60 flex items-center justify-center text-gray-800 transition"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Side by side months */}
      <div className="flex">
        {renderMonth(leftYear, leftMonth, false)}
        <div className="hidden md:block w-px bg-gray-200/80 self-stretch" />
        {renderMonth(rightYear, rightMonth, true)}
      </div>

      {/* Legend Row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-xs text-gray-700 font-medium">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          Booked
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block border border-amber-500/30" />
          Limited
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
          Blocked
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-black inline-block" />
          Today
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-gray-400 inline-block" />
          Available
        </span>
      </div>
    </div>
  );
}
