'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export interface BookedRange {
  checkIn: string;
  checkOut: string;
}

export interface AirbnbDateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  minNights?: number;
  maxNights?: number;
  locationName?: string;
  isPopover?: boolean;
  onClose?: () => void;
  initialFocusedInput?: 'checkIn' | 'checkOut';
  bookedRanges?: BookedRange[];
  unavailableDates?: (string | Date)[];
}

export function parseDateString(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(str: string, options?: Intl.DateTimeFormatOptions): string {
  const d = parseDateString(str);
  if (!d) return '';
  return d.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isDateBlocked(
  dateStr: string,
  bookedRanges: BookedRange[] = [],
  unavailableDates: (string | Date)[] = [],
): boolean {
  // Check booked ranges (night dateStr is occupied if checkIn <= dateStr < checkOut)
  const isBooked = bookedRanges.some((range) => {
    if (!range.checkIn || !range.checkOut) return false;
    return dateStr >= range.checkIn && dateStr < range.checkOut;
  });
  if (isBooked) return true;

  // Check host unavailable dates
  const isUnavailable = unavailableDates.some((u) => {
    const uStr = u instanceof Date ? formatDateString(u) : String(u).split('T')[0];
    return uStr === dateStr;
  });

  return isUnavailable;
}

export function isRangeBlocked(
  startStr: string,
  endStr: string,
  bookedRanges: BookedRange[] = [],
  unavailableDates: (string | Date)[] = [],
): boolean {
  const start = parseDateString(startStr);
  const end = parseDateString(endStr);
  if (!start || !end || end <= start) return false;

  const cur = new Date(start.getTime());
  while (cur < end) {
    const curStr = formatDateString(cur);
    if (isDateBlocked(curStr, bookedRanges, unavailableDates)) {
      return true;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

export default function AirbnbDateRangePicker({
  checkIn,
  checkOut,
  onChange,
  minNights = 1,
  locationName = 'Manali',
  isPopover = false,
  onClose,
  initialFocusedInput = 'checkIn',
  bookedRanges = [],
  unavailableDates = [],
}: AirbnbDateRangePickerProps) {
  // Focus state: whether user is currently picking check-in or checkout
  const [focusedInput, setFocusedInput] = useState<'checkIn' | 'checkOut'>(initialFocusedInput);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Base month for first displayed calendar (defaults to month of checkIn or current month)
  const initialDate = parseDateString(checkIn) || new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const todayStr = useMemo(() => formatDateString(today), [today]);

  const startDateObj = useMemo(() => parseDateString(checkIn), [checkIn]);
  const endDateObj = useMemo(() => parseDateString(checkOut), [checkOut]);

  // Number of nights
  const nights = useMemo(() => {
    if (!startDateObj || !endDateObj) return 0;
    const diff = endDateObj.getTime() - startDateObj.getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, [startDateObj, endDateObj]);

  // Second month displayed
  const nextMonthDate = useMemo(() => {
    return new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
  }, [currentMonthDate]);

  // Can go previous month?
  const canGoPrev = useMemo(() => {
    const firstDayCurrentMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayCurrentMonth.getTime() > firstDayThisMonth.getTime();
  }, [currentMonthDate, today]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canGoPrev) return;
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleDateClick = (dateStr: string) => {
    const clickedDate = parseDateString(dateStr);
    if (!clickedDate) return;

    // Cannot pick a blocked date
    if (isDateBlocked(dateStr, bookedRanges, unavailableDates)) {
      return;
    }

    if (focusedInput === 'checkIn') {
      // User is picking Check-In
      onChange(dateStr, '');
      setFocusedInput('checkOut');
    } else {
      // User is picking Check-Out
      if (!checkIn) {
        onChange(dateStr, '');
        setFocusedInput('checkOut');
        return;
      }

      const start = parseDateString(checkIn);
      if (!start || clickedDate.getTime() <= start.getTime()) {
        // If clicked date is before or same as check-in, set it as the new check-in
        onChange(dateStr, '');
        setFocusedInput('checkOut');
      } else {
        // Check if the range between checkIn and dateStr crosses any blocked dates
        if (isRangeBlocked(checkIn, dateStr, bookedRanges, unavailableDates)) {
          // Cannot span across booked dates. Reset check-in to this new date.
          onChange(dateStr, '');
          setFocusedInput('checkOut');
        } else {
          onChange(checkIn, dateStr);
          setFocusedInput('checkIn');
        }
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setFocusedInput('checkIn');
    setHoveredDate(null);
  };

  // Helper to build calendar grid for a given month
  const buildMonthGrid = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isBooked: boolean;
      isToday: boolean;
      isStart: boolean;
      isEnd: boolean;
      isInRange: boolean;
      isHoveredRange: boolean;
    }> = [];

    // Empty cells before month start
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        dateStr: `empty-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
        isDisabled: true,
        isBooked: false,
        isToday: false,
        isStart: false,
        isEnd: false,
        isInRange: false,
        isHoveredRange: false,
      });
    }

    // Days of month
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDateString(date);
      const isPast = date.getTime() < today.getTime();
      const isToday = dateStr === todayStr;
      const dateBlocked = isDateBlocked(dateStr, bookedRanges, unavailableDates);
      const isDisabled = isPast || dateBlocked;

      const isStart = checkIn === dateStr;
      const isEnd = checkOut === dateStr;

      let isInRange = false;
      if (checkIn && checkOut) {
        const sTime = startDateObj?.getTime() || 0;
        const eTime = endDateObj?.getTime() || 0;
        const currTime = date.getTime();
        isInRange = currTime > sTime && currTime < eTime;
      }

      let isHoveredRange = false;
      if (checkIn && !checkOut && hoveredDate && focusedInput === 'checkOut') {
        const sTime = startDateObj?.getTime() || 0;
        const hDate = parseDateString(hoveredDate);
        const hTime = hDate ? hDate.getTime() : 0;
        const currTime = date.getTime();
        if (hTime > sTime) {
          // Only show hovered range if no blocked dates in between
          const hasBlock = isRangeBlocked(checkIn, hoveredDate, bookedRanges, unavailableDates);
          if (!hasBlock) {
            isHoveredRange = currTime > sTime && currTime <= hTime;
          }
        }
      }

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isDisabled,
        isBooked: dateBlocked,
        isToday,
        isStart,
        isEnd,
        isInRange,
        isHoveredRange,
      });
    }

    return { monthName, days };
  };

  const month1 = useMemo(() => buildMonthGrid(currentMonthDate), [currentMonthDate, checkIn, checkOut, hoveredDate, focusedInput, today, todayStr, bookedRanges, unavailableDates]);
  const month2 = useMemo(() => buildMonthGrid(nextMonthDate), [nextMonthDate, checkIn, checkOut, hoveredDate, focusedInput, today, todayStr, bookedRanges, unavailableDates]);

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Title calculation
  let headerTitle = 'Select dates';
  let headerSubtitle = `Minimum stay: ${minNights} night${minNights > 1 ? 's' : ''}`;

  if (checkIn && checkOut && nights > 0) {
    headerTitle = `${nights} ${nights === 1 ? 'night' : 'nights'} in ${locationName}`;
    headerSubtitle = `${formatDisplayDate(checkIn)} – ${formatDisplayDate(checkOut)}`;
  } else if (checkIn && !checkOut) {
    headerTitle = 'Select checkout date';
    headerSubtitle = `Minimum stay: ${minNights} night${minNights > 1 ? 's' : ''}`;
  } else if (focusedInput === 'checkIn') {
    headerTitle = 'Select check-in date';
    headerSubtitle = 'Add your travel dates for exact pricing';
  }

  const renderMonth = (monthData: ReturnType<typeof buildMonthGrid>, isLeftMonth: boolean) => (
    <div className="flex-1 w-full max-w-[300px] mx-auto">
      <div className="flex items-center justify-between mb-4 h-9">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className={`p-2 rounded-full hover:bg-neutral-100 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition ${!isLeftMonth ? 'flex sm:hidden' : 'flex'
            }`}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-800" />
        </button>

        <h4 className="text-body font-semibold text-neutral-900 text-center flex-1">
          {monthData.monthName}
        </h4>

        <button
          type="button"
          onClick={handleNextMonth}
          className={`p-2 rounded-full hover:bg-neutral-100 transition ${isLeftMonth ? 'flex sm:hidden' : 'flex'
            }`}
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-neutral-800" />
        </button>
      </div>

      {/* WEEKDAYS */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {weekdays.map((day, idx) => (
          <span key={idx} className="text-overline font-semibold text-neutral-400 py-1">
            {day}
          </span>
        ))}
      </div>

      {/* DAYS GRID */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {monthData.days.map((item, idx) => {
          if (!item.isCurrentMonth) {
            return <div key={`empty-${idx}`} className="h-10 w-full" />;
          }

          const isStartOrEnd = item.isStart || item.isEnd;
          const isSelected = item.isStart || item.isEnd || item.isInRange;
          const isHovered = item.isHoveredRange;

          return (
            <div
              key={item.dateStr}
              className="relative h-10 w-full flex items-center justify-center"
              onMouseEnter={() => !item.isDisabled && setHoveredDate(item.dateStr)}
            >
              {/* RANGE BACKGROUND BAND CONNECTOR */}
              {item.isInRange && (
                <div className="absolute inset-y-0 inset-x-0 bg-neutral-100 z-0" />
              )}
              {isHovered && (
                <div className="absolute inset-y-0 inset-x-0 bg-rose-50/80 z-0" />
              )}
              {item.isStart && (checkOut || hoveredDate) && (
                <div className="absolute inset-y-0 right-0 w-1/2 bg-neutral-100 z-0" />
              )}
              {item.isEnd && checkIn && (
                <div className="absolute inset-y-0 left-0 w-1/2 bg-neutral-100 z-0" />
              )}

              {/* DATE BUTTON */}
              <button
                type="button"
                disabled={item.isDisabled}
                title={item.isBooked ? 'Booked / Unavailable' : item.isDisabled ? 'Past / Unavailable' : item.dateStr}
                onClick={() => !item.isDisabled && handleDateClick(item.dateStr)}
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-caption font-semibold font-tabular transition-all duration-150 ${item.isBooked
                  ? 'text-neutral-400 bg-neutral-100/80 line-through cursor-not-allowed select-none'
                  : item.isDisabled
                    ? 'text-neutral-300 line-through cursor-not-allowed select-none'
                    : isStartOrEnd
                      ? 'bg-neutral-900 text-white shadow-md scale-105 font-bold hover:bg-black'
                      : isHovered
                        ? 'text-rose-600 font-bold hover:border hover:border-rose-500'
                        : item.isInRange
                          ? 'text-neutral-900 font-semibold hover:bg-neutral-200'
                          : 'text-neutral-800 hover:border hover:border-neutral-900'
                  } ${item.isToday && !isSelected ? 'border border-neutral-500 font-bold' : ''}`}
              >
                {item.dayNumber}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white select-none ${isPopover
        ? 'p-6 sm:p-7 rounded-3xl shadow-2xl border border-neutral-200 w-full'
        : 'p-6 sm:p-8 rounded-3xl border border-neutral-200 w-full'
        }`}
      onMouseLeave={() => setHoveredDate(null)}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div>
          <h3 className="text-h3 sm:text-h2 font-bold text-neutral-900 tracking-tight">
            {headerTitle}
          </h3>
          <p className="text-caption sm:text-body-sm text-neutral-500 font-medium mt-0.5">
            {headerSubtitle}
          </p>
        </div>

        {/* INPUT TABS (AIRBNB STYLE PILL) */}
        <div className="inline-flex items-center rounded-xl border border-neutral-300 p-1 bg-neutral-50/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFocusedInput('checkIn')}
            className={`px-3 py-1.5 rounded-lg text-left transition ${focusedInput === 'checkIn'
              ? 'bg-white shadow-sm border border-neutral-300 text-neutral-900'
              : 'text-neutral-600 hover:text-neutral-900'
              }`}
          >
            <span className="block text-overline font-semibold tracking-wider uppercase text-neutral-500">
              CHECK-IN
            </span>
            <span className="text-body-sm font-semibold block whitespace-nowrap">
              {checkIn ? formatDisplayDate(checkIn, { month: 'short', day: 'numeric' }) : 'Add date'}
            </span>
          </button>

          <div className="w-[1px] h-6 bg-neutral-200 mx-1" />

          <button
            type="button"
            onClick={() => setFocusedInput('checkOut')}
            className={`px-3 py-1.5 rounded-lg text-left transition ${focusedInput === 'checkOut'
              ? 'bg-white shadow-sm border border-neutral-300 text-neutral-900'
              : 'text-neutral-600 hover:text-neutral-900'
              }`}
          >
            <span className="block text-overline font-semibold tracking-wider uppercase text-neutral-500">
              CHECKOUT
            </span>
            <span className="text-body-sm font-semibold block whitespace-nowrap">
              {checkOut ? formatDisplayDate(checkOut, { month: 'short', day: 'numeric' }) : 'Add date'}
            </span>
          </button>
        </div>
      </div>

      {/* CALENDARS DISPLAY (2 MONTHS SIDE-BY-SIDE ON DESKTOP, 1 ON MOBILE) */}
      <div className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {renderMonth(month1, true)}
          <div className="hidden sm:block">
            {renderMonth(month2, false)}
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-6 mt-4 border-t border-neutral-100 text-caption">
        <div className="flex items-center gap-2 text-neutral-500">
          <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
          <span>Select start and end dates for your trip</span>
        </div>

        <div className="flex items-center gap-3">
          {(checkIn || checkOut) && (
            <button
              type="button"
              onClick={handleClear}
              className="font-semibold underline text-neutral-900 hover:text-rose-600 transition px-2 py-1 text-button"
            >
              Clear dates
            </button>
          )}

          {isPopover && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-xl font-semibold text-button transition shadow-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
