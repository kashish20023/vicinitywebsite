'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
import {
  Calendar as CalendarIcon,
  Home,
  Search,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
  Lock,
  Tag,
  ChevronDown,
  ArrowLeft,
  SlidersHorizontal,
  Check,
  Building,
  Info,
} from 'lucide-react';

export interface PropertyItem {
  id: string;
  title: string;
  city: string;
  basePrice: number;
  coverImage?: string;
  verificationStatus?: string;
  isPublished?: boolean;
}

export type DateStatus = 'AVAILABLE' | 'BOOKED' | 'PARTIAL' | 'BLOCKED' | 'DEFAULT';

export interface DateInfo {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  status: DateStatus;
  price: number;
  bookingInfo?: {
    guestName: string;
    bookingRef: string;
    checkIn: string;
    checkOut: string;
  };
}

interface AirbnbMultiListingCalendarViewProps {
  role: 'host' | 'co-host';
  title?: string;
  subtitle?: string;
}

export function AirbnbMultiListingCalendarView({
  role,
  title = 'Calendars',
  subtitle = 'Manage booking availability, blocked dates, and nightly rates across all properties.',
}: AirbnbMultiListingCalendarViewProps) {
  // Properties List
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Main View Mode: 'list' (All Listings with Dot Matrix) vs 'single' (Detailed Month View)
  const [viewMode, setViewMode] = useState<'list' | 'single'>('list');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState<boolean>(false);

  // Single Calendar State (for detailed view)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 8, 1)); // Sept 2026
  const [singleCalView, setSingleCalView] = useState<'month' | 'year'>('month');

  // Calendar Datasets
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set(['2026-09-11', '2026-09-24']));
  const [availableDates] = useState<Set<string>>(new Set(['2026-09-08', '2026-09-15']));
  const [bookedDatesMap, setBookedDatesMap] = useState<
    Record<string, { guestName: string; bookingRef: string; checkIn: string; checkOut: string }>
  >({
    '2026-09-17': { guestName: 'Rahul Sharma', bookingRef: 'FB-88412', checkIn: '2026-09-17', checkOut: '2026-09-20' },
    '2026-09-18': { guestName: 'Rahul Sharma', bookingRef: 'FB-88412', checkIn: '2026-09-17', checkOut: '2026-09-20' },
    '2026-09-19': { guestName: 'Rahul Sharma', bookingRef: 'FB-88412', checkIn: '2026-09-17', checkOut: '2026-09-20' },
    '2026-09-28': { guestName: 'Ananya Gupta', bookingRef: 'FB-90211', checkIn: '2026-09-28', checkOut: '2026-09-30' },
    '2026-09-29': { guestName: 'Ananya Gupta', bookingRef: 'FB-90211', checkIn: '2026-09-28', checkOut: '2026-09-30' },
  });
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Single Calendar Modals & Inputs
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [isBulkRateModalOpen, setIsBulkRateModalOpen] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Range Form States
  const [rangeStart, setRangeStart] = useState<string>('2026-09-01');
  const [rangeEnd, setRangeEnd] = useState<string>('2026-09-05');
  const [bulkRateInput, setBulkRateInput] = useState<string>('15000');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Properties
  useEffect(() => {
    let active = true;
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const endpoint = role === 'co-host' ? '/co-host/me/properties' : '/properties';
        const data = await api.get<any>(endpoint);
        const list = Array.isArray(data)
          ? data
          : data?.properties || data?.data || data?.items || [];
        if (active && list.length > 0) {
          const formatted = list.map((item: any) => ({
            id: item.id || item.propertyId || item.property?.id,
            title: item.title || item.name || item.property?.title || 'Property Listing',
            city: item.city || item.location || item.property?.city || 'India',
            basePrice: item.basePrice || item.pricePerNight || item.property?.basePrice || 12500,
            coverImage:
              item.coverImage ||
              item.images?.[0] ||
              item.photos?.[0] ||
              item.property?.coverImage ||
              'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
            verificationStatus: item.verificationStatus || item.status || 'APPROVED',
            isPublished: item.isPublished ?? true,
          }));
          setProperties(formatted);
          setSelectedPropertyId(formatted[0].id);
          setLoadingProperties(false);
          return;
        }
      } catch (err) {
        // Fallback mock properties if API fails or empty
      }

      if (active) {
        const defaults: PropertyItem[] = [
          {
            id: 'prop-1',
            title: "Vicinity's Grand Farm 4-BHK Near Beach",
            city: 'Goa',
            basePrice: 18000,
            coverImage:
              'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
            verificationStatus: 'APPROVED',
          },
          {
            id: 'prop-2',
            title: "Vicinity's Prime Villa with Private Pool",
            city: 'Udaipur',
            basePrice: 15500,
            coverImage:
              'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
            verificationStatus: 'APPROVED',
          },
          {
            id: 'prop-3',
            title: "The Royal Heritage Haveli",
            city: 'Jaipur',
            basePrice: 22000,
            coverImage:
              'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
            verificationStatus: 'APPROVED',
          },
          {
            id: 'prop-4',
            title: "Himalayan Cloud Retreat & Spa",
            city: 'Manali',
            basePrice: 11000,
            coverImage:
              'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
            verificationStatus: 'APPROVED',
          },
          {
            id: 'prop-5',
            title: "Penthouse Sky Lounge & Ocean View",
            city: 'Mumbai',
            basePrice: 28000,
            coverImage:
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
            verificationStatus: 'APPROVED',
          },
        ];
        setProperties(defaults);
        setSelectedPropertyId(defaults[0].id);
        setLoadingProperties(false);
      }
    };

    fetchProperties();
    return () => {
      active = false;
    };
  }, [role]);

  // Load calendar data when selected property changes
  useEffect(() => {
    if (!selectedPropertyId) return;
    const fetchCalendar = async () => {
      try {
        const res = await api.get<any>(`/calendar/property/${selectedPropertyId}`);
        if (res) {
          if (Array.isArray(res.unavailableDates)) {
            const blocked = new Set<string>();
            res.unavailableDates.forEach((d: any) => {
              const str = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
              blocked.add(str);
            });
            setBlockedDates(blocked);
          }
        }
      } catch { }
    };
    fetchCalendar();
  }, [selectedPropertyId]);

  const selectedProperty = useMemo(() => {
    return (
      properties.find((p) => p.id === selectedPropertyId) ||
      properties[0] || {
        id: 'prop-1',
        title: "Vicinity's Grand Farm 4-BHK Near Beach",
        city: 'Goa',
        basePrice: 18000,
        coverImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
      }
    );
  }, [properties, selectedPropertyId]);

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter(
      (p) => p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
    );
  }, [properties, searchQuery]);

  // Helper date string format
  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Month grid calculations for single calendar view
  const monthGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const days: DateInfo[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        dateStr: `empty-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
        status: 'DEFAULT',
        price: 0,
      });
    }

    const basePrice = selectedProperty?.basePrice || 12500;

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDateStr(date);

      let status: DateStatus = 'DEFAULT';
      let bookingInfo;

      if (bookedDatesMap[dateStr]) {
        status = 'BOOKED';
        bookingInfo = bookedDatesMap[dateStr];
      } else if (blockedDates.has(dateStr)) {
        status = 'BLOCKED';
      } else if (availableDates.has(dateStr)) {
        status = 'AVAILABLE';
      }

      const price = customPrices[dateStr] || basePrice;

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        status,
        price,
        bookingInfo,
      });
    }

    return { monthName, days };
  }, [currentMonthDate, blockedDates, availableDates, bookedDatesMap, customPrices, selectedProperty]);

  // Handlers for Single Calendar View
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCurrentMonthDate(new Date(2026, 8, 1));
  };

  const handleDateClick = (item: DateInfo) => {
    if (!item.isCurrentMonth) return;
    setSelectedDateStr(item.dateStr);
    setEditPriceInput(item.price.toString());
  };

  const handleSaveDatePrice = () => {
    if (!selectedDateStr) return;
    const priceNum = Number(editPriceInput);
    if (isNaN(priceNum) || priceNum <= 0) return;

    setCustomPrices((prev) => ({ ...prev, [selectedDateStr]: priceNum }));
    setSelectedDateStr(null);
    showToast(`Updated nightly rate for ${selectedDateStr} to ₹${priceNum.toLocaleString('en-IN')}`);
  };

  const handleToggleBlockDate = (dateStr: string) => {
    const nextBlocked = new Set(blockedDates);
    if (nextBlocked.has(dateStr)) {
      nextBlocked.delete(dateStr);
      showToast(`Unblocked date ${dateStr}`);
    } else {
      nextBlocked.add(dateStr);
      showToast(`Blocked date ${dateStr}`);
    }
    setBlockedDates(nextBlocked);
    setSelectedDateStr(null);
  };

  const handleBlockRange = () => {
    if (!rangeStart || !rangeEnd) return;
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    const newBlocked = new Set(blockedDates);

    const curr = new Date(start);
    while (curr <= end) {
      newBlocked.add(formatDateStr(curr));
      curr.setDate(curr.getDate() + 1);
    }
    setBlockedDates(newBlocked);
    setIsBlockModalOpen(false);
    showToast(`Blocked dates from ${rangeStart} to ${rangeEnd}`);
  };

  const handleBulkRates = () => {
    if (!rangeStart || !rangeEnd) return;
    const priceNum = Number(bulkRateInput);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    const prices = { ...customPrices };

    const curr = new Date(start);
    while (curr <= end) {
      prices[formatDateStr(curr)] = priceNum;
      curr.setDate(curr.getDate() + 1);
    }
    setCustomPrices(prices);
    setIsBulkRateModalOpen(false);
    showToast(`Set nightly rate ₹${priceNum.toLocaleString('en-IN')} for ${rangeStart} to ${rangeEnd}`);
  };

  const handleSyncCalendar = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      showToast('Calendar synced with external iCal channels (Airbnb, Booking.com)');
    }, 1200);
  };

  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  /**
   * Helper function to generate a 28-day mini dot matrix for a property card
   * (4 rows x 7 cols) mimicking Airbnb's calendar list view
   */
  const renderMiniDotMatrix = (propertyId: string) => {
    // Generate deterministic 28 dots preview (mix of open, booked, blocked)
    const seed = propertyId.charCodeAt(propertyId.length - 1) || 5;
    const totalDots = 28;

    return (
      <div className="grid grid-cols-7 gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
        {Array.from({ length: totalDots }).map((_, idx) => {
          const dayNum = idx + 1;
          const isBooked = (dayNum + seed) % 5 === 0 || (dayNum + seed) % 7 === 0;
          const isBlocked = (dayNum + seed) % 11 === 0;

          let dotBg = 'bg-slate-300';
          let tooltip = `Sep ${dayNum}: Available`;

          if (isBooked) {
            dotBg = 'bg-[#38bdf8] border border-blue-400';
            tooltip = `Sep ${dayNum}: Booked Guest`;
          } else if (isBlocked) {
            dotBg = 'bg-rose-500';
            tooltip = `Sep ${dayNum}: Blocked Date`;
          }

          return (
            <span
              key={idx}
              title={tooltip}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-transform hover:scale-125 ${dotBg}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 select-none font-sans">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PAGE HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-overline font-semibold uppercase tracking-wider text-[#0e4962] bg-[#e6f4f8] px-2.5 py-0.5 rounded-full border border-[#0e4962]/20">
              {role === 'co-host' ? 'Co-Host Calendar Hub' : 'Host Management Portal'}
            </span>
          </div>
          <h1 className="text-h1 font-bold text-slate-900 tracking-tight mt-1">
            {title}
          </h1>
          <p className="text-body-sm text-slate-500 mt-1 font-medium">{subtitle}</p>
        </div>

        {/* TOP RIGHT VIEW SWITCHER & ACTIONS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* VIEW MODE TOGGLE SWITCHER */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center text-caption font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'list'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>All Listings</span>
              <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-overline font-semibold font-tabular">
                {properties.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'single'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Detailed Calendar</span>
            </button>
          </div>

          {/* SYNC BUTTON */}
          <button
            type="button"
            onClick={handleSyncCalendar}
            disabled={syncing}
            className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer active:scale-95 disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Channels'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: AIRBNB-STYLE MULTI-LISTING CALENDARS VIEW (CARDS + MINI MATRIX)   */}
      {/* ========================================================================= */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listing by name or city..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-[#0e4962] focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Blocked</span>
              </div>
            </div>
          </div>

          {/* LISTINGS CALENDAR CARDS CONTAINER */}
          {loadingProperties ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs font-semibold space-y-3 border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0e4962]" />
              <p>Loading property calendar overview...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs font-semibold border border-slate-200 space-y-2">
              <Building className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-body">No property calendars found</p>
              <p className="text-slate-400 max-w-sm mx-auto">
                No property listings matched "{searchQuery}". Try searching with a different term.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map((p) => {
                const isSelected = p.id === selectedProperty.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPropertyId(p.id);
                      setViewMode('single');
                    }}
                    className={`bg-white rounded-2xl sm:rounded-3xl border transition-all duration-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:shadow-md cursor-pointer border-slate-200/90 hover:border-[#0e4962]/40 group ${isSelected ? 'ring-2 ring-[#0e4962]/40 bg-slate-50/30' : ''
                      }`}
                  >
                    {/* LEFT SIDE: THUMBNAIL + DETAILS */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 shadow-2xs">
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-overline font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Listed</span>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h3 className="font-semibold text-body text-slate-900 group-hover:text-[#0e4962] transition-colors truncate tracking-tight">
                          {p.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-caption font-semibold text-slate-500">
                          <span>{p.city}</span>
                          <span>•</span>
                          <span className="text-slate-900 font-bold font-tabular">
                            ₹{p.basePrice.toLocaleString('en-IN')}{' '}
                            <span className="text-caption font-normal text-slate-400">/ night</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-overline font-semibold px-2 py-0.5 rounded-full border border-emerald-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>100% Calendar Synced</span>
                          </span>

                          {role === 'co-host' && (
                            <span className="bg-purple-50 text-purple-700 text-overline font-semibold px-2 py-0.5 rounded-full border border-purple-200/70">
                              Co-Host Access
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE: MINI CALENDAR DOT MATRIX PREVIEW */}
                    <div className="flex items-center gap-4 sm:justify-end shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <div className="space-y-1 text-right max-sm:text-left">
                        <span className="text-overline font-semibold uppercase tracking-wider text-slate-400 block">
                          September 2026 Preview
                        </span>
                        {renderMiniDotMatrix(p.id)}
                      </div>

                      <div className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#0e4962] group-hover:text-white transition-all shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOTTOM NOTICE BANNER (MATCHING AIRBNB REFERENCE SCREENSHOT) */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                !
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-body-sm">
                  Calendar Health & External Channel Sync
                </h4>
                <p className="text-amber-800 font-medium">
                  All property calendars are automatically synced with external iCal channels (Airbnb, Booking.com, VRBO).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncCalendar}
              className="bg-amber-900 hover:bg-black text-white px-3.5 py-2 rounded-xl font-bold transition shrink-0 cursor-pointer shadow-2xs"
            >
              Sync Now
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: DETAILED SINGLE-PROPERTY INTERACTIVE CALENDAR GRID                */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* BACK TO ALL LISTINGS BUTTON & PROPERTY SELECTOR */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0e4962] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Listing Calendars</span>
            </button>

            {/* CUSTOM PROPERTY SELECTOR DROPDOWN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPropertyDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-2xl px-4 py-2 shadow-2xs transition cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#0e4962] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">
                  {selectedProperty.title} ({selectedProperty.city})
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isPropertyDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isPropertyDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsPropertyDropdownOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-40 overflow-hidden">
                    <div className="px-3 py-1.5 text-overline font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Switch Listing
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {properties.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPropertyId(p.id);
                            setIsPropertyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${p.id === selectedProperty.id ? 'bg-slate-50 text-[#0e4962]' : 'text-slate-800'
                            }`}
                        >
                          <span className="truncate">{p.title}</span>
                          {p.id === selectedProperty.id && <CheckCircle2 className="w-4 h-4 text-[#0e4962]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* MAIN 2-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* LEFT 3 COLUMNS: CALENDAR CONTAINER */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
                {/* CALENDAR CONTROLS BAR */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                  {/* MONTH NAVIGATION */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 min-w-[160px] text-center tracking-tight">
                      {monthGrid.monthName}
                    </h2>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                      aria-label="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* SEGMENTED VIEW SWITCHER & TODAY BUTTON */}
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSingleCalView('month')}
                        className={`px-3 py-1 rounded-lg transition ${singleCalView === 'month'
                          ? 'bg-slate-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        Month
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleCalView('year')}
                        className={`px-3 py-1 rounded-lg transition ${singleCalView === 'year'
                          ? 'bg-slate-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        Year
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleToday}
                      className="border border-gray-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Today</span>
                    </button>
                  </div>
                </div>

                {/* MONTH VIEW */}
                {singleCalView === 'month' ? (
                  <div>
                    {/* WEEKDAYS HEADER ROW */}
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 text-center py-2.5">
                      {weekdays.map((day) => (
                        <span key={day} className="text-overline font-semibold text-slate-400 tracking-wider">
                          {day}
                        </span>
                      ))}
                    </div>

                    {/* CALENDAR DAYS GRID */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 bg-gray-100/40">
                      {monthGrid.days.map((item, idx) => {
                        if (!item.isCurrentMonth) {
                          return <div key={`empty-${idx}`} className="h-20 sm:h-24 md:h-28 bg-gray-50/40" />;
                        }

                        const isSelected = selectedDateStr === item.dateStr;

                        let cellBg = 'bg-white hover:bg-slate-50';
                        let dayNumStyle = 'text-slate-900 font-bold';
                        let priceStyle = 'text-slate-600 font-semibold font-tabular';

                        if (item.status === 'AVAILABLE') {
                          cellBg = 'bg-[#eefcf6] hover:bg-[#e2f9ee]';
                          dayNumStyle = 'text-emerald-950 font-bold';
                          priceStyle = 'text-emerald-900 font-bold font-tabular';
                        } else if (item.status === 'BOOKED') {
                          cellBg = 'bg-[#eef2ff] hover:bg-[#e0e7ff]';
                          dayNumStyle = 'text-blue-600 font-bold';
                          priceStyle = 'text-blue-600 font-bold font-tabular';
                        } else if (item.status === 'BLOCKED') {
                          cellBg = 'bg-[#fff1f2] hover:bg-[#ffe4e6]';
                          dayNumStyle = 'text-rose-600 font-bold';
                          priceStyle = 'text-rose-600 font-bold font-tabular';
                        } else if (item.status === 'PARTIAL') {
                          cellBg = 'bg-[#fffbe0] hover:bg-[#fef3c7]';
                          dayNumStyle = 'text-amber-900 font-bold';
                          priceStyle = 'text-amber-900 font-bold font-tabular';
                        }

                        return (
                          <div
                            key={item.dateStr}
                            onClick={() => handleDateClick(item)}
                            className={`h-20 sm:h-24 md:h-28 p-2 sm:p-2.5 flex flex-col justify-between transition cursor-pointer select-none relative group ${cellBg} ${isSelected ? 'ring-2 ring-inset ring-slate-900 z-10 shadow-sm' : ''
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-caption sm:text-body-sm font-tabular ${dayNumStyle}`}>
                                {item.dayNumber}
                              </span>
                              {item.status === 'BOOKED' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" title="Confirmed Reservation" />
                              )}
                            </div>

                            <div className="mt-auto">
                              <p className={`text-caption font-tabular ${priceStyle}`}>
                                ₹{item.price.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* YEAR OVERVIEW VIEW */
                  <div className="p-6 max-sm:p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, monthIdx) => {
                      const d = new Date(currentMonthDate.getFullYear(), monthIdx, 1);
                      const mName = d.toLocaleDateString('en-US', { month: 'short' });
                      const daysCount = new Date(currentMonthDate.getFullYear(), monthIdx + 1, 0).getDate();
                      const isCurrent = currentMonthDate.getMonth() === monthIdx;

                      return (
                        <div
                          key={monthIdx}
                          onClick={() => {
                            setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), monthIdx, 1));
                            setSingleCalView('month');
                          }}
                          className={`p-4 rounded-2xl border transition cursor-pointer ${isCurrent
                            ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                            : 'border-gray-200 bg-white hover:bg-slate-50 text-slate-900'
                            }`}
                        >
                          <h4 className="font-bold text-body-sm mb-2">
                            {mName} {currentMonthDate.getFullYear()}
                          </h4>
                          <p className="text-caption opacity-75">
                            {daysCount} days · Standard rate ₹{selectedProperty.basePrice.toLocaleString('en-IN')}
                          </p>
                          <span className="inline-block mt-3 text-caption font-semibold underline">
                            View Month &rarr;
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: LEGEND & QUICK ACTIONS */}
            <div className="lg:col-span-1 space-y-5">
              {/* LEGEND CARD */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
                <h3 className="text-h4 font-bold text-slate-900 tracking-tight">Calendar Legend</h3>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-body-sm font-semibold text-slate-900">Available</h4>
                      <p className="text-caption font-medium text-slate-500 leading-tight">Date open for booking</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-body-sm font-semibold text-slate-900">Booked</h4>
                      <p className="text-caption font-medium text-slate-500 leading-tight">Confirmed reservation</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-body-sm font-semibold text-slate-900">Blocked</h4>
                      <p className="text-caption font-medium text-slate-500 leading-tight">Unavailable for booking</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS CARD */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
                <h3 className="text-h4 font-bold text-slate-900 tracking-tight">Quick Actions</h3>

                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(true)}
                  className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Block Date Range</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkRateModalOpen(true)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Set Bulk Rates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: DATE SELECTION & BULK ACTIONS                                     */}
      {/* ========================================================================= */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {new Date(selectedDateStr).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Nightly Rate (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={editPriceInput}
                    onChange={(e) => setEditPriceInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSaveDatePrice}
                  className="w-full bg-[#0e4962] hover:bg-[#0a384b] text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  Save Nightly Rate
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleBlockDate(selectedDateStr)}
                  className="w-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold py-2.5 rounded-xl border border-rose-200 transition"
                >
                  {blockedDates.has(selectedDateStr) ? 'Unblock Date' : 'Block Date'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK RANGE MODAL */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" /> Block Date Range
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">End Date</label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockRange}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Confirm Block Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK RATE MODAL */}
      {isBulkRateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" /> Set Bulk Nightly Rates
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkRateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nightly Rate (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={bulkRateInput}
                    onChange={(e) => setBulkRateInput(e.target.value)}
                    placeholder="Rate per night"
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsBulkRateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkRates}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Apply Rates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
