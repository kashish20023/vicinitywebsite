'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiRequest, getStoredUser } from '@/lib/api';
import {
  MapPin, Star, Wifi, Coffee, Clock, ShieldCheck,
  Calendar, CheckCircle2, AlertCircle, ArrowRight,
  Layers, Users, Info, Sparkles, ChevronRight
} from 'lucide-react';

interface Unit {
  id: string;
  unitCode: string;
  name: string;
  unitType: string;
  capacity: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'MAINTENANCE' | 'DISABLED';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface FloorAvailability {
  floorId: string;
  floorName: string;
  schedule: { start: string; end: string };
  activeLayout: {
    canvasWidth: number;
    canvasHeight: number;
  };
  units: Unit[];
}

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected schedule & plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(8);
  const [selectedMonths, setSelectedMonths] = useState<number>(2);

  // Floor selection & units
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [floorData, setFloorData] = useState<FloorAvailability | null>(null);
  const [floorLoading, setFloorLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Hold creation state
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  // 1. Fetch Workspace Details
  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        const data = await apiRequest<any>(`/workspaces/${slug}`);
        setWorkspace(data);

        // Auto select first floor & first plan
        const firstFloor = data.buildings?.[0]?.floors?.[0];
        if (firstFloor) {
          setSelectedFloorId(firstFloor.id);
        }
        if (data.bookingPlans?.length > 0) {
          setSelectedPlanId(data.bookingPlans[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load workspace');
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [slug]);

  // Compute selected schedule
  const currentPlan = useMemo(() => {
    return workspace?.bookingPlans?.find((p: any) => p.id === selectedPlanId) || null;
  }, [workspace, selectedPlanId]);

  const scheduleInterval = useMemo(() => {
    if (!currentPlan) return null;

    if (currentPlan.planType === 'HOURLY') {
      const start = new Date(`${bookingDate}T10:00:00.000Z`);
      const end = new Date(start.getTime() + selectedDurationHours * 3600000);
      return { start: start.toISOString(), end: end.toISOString() };
    }

    if (currentPlan.planType === 'DAILY') {
      const start = new Date(`${bookingDate}T09:00:00.000Z`);
      const end = new Date(`${bookingDate}T19:00:00.000Z`);
      return { start: start.toISOString(), end: end.toISOString() };
    }

    if (currentPlan.planType === 'MONTHLY') {
      const months = Math.max(currentPlan.minCommitmentMonths || 1, selectedMonths);
      const start = new Date(`${bookingDate}T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      return { start: start.toISOString(), end: end.toISOString() };
    }

    const start = new Date(`${bookingDate}T09:00:00.000Z`);
    const end = new Date(start.getTime() + 8 * 3600000);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [currentPlan, bookingDate, selectedDurationHours, selectedMonths]);

  // 2. Fetch Floor Availability when floor or schedule changes
  useEffect(() => {
    if (!selectedFloorId || !scheduleInterval) return;

    async function loadFloorAvailability() {
      try {
        setFloorLoading(true);
        const data = await apiRequest<FloorAvailability>(
          `/workspaces/floors/${selectedFloorId}/availability?startTime=${encodeURIComponent(
            scheduleInterval!.start
          )}&endTime=${encodeURIComponent(scheduleInterval!.end)}`
        );
        setFloorData(data);

        // Reset selected unit if it's no longer available
        if (selectedUnit) {
          const fresh = data.units.find((u) => u.id === selectedUnit.id);
          if (!fresh || fresh.status !== 'AVAILABLE') {
            setSelectedUnit(null);
          }
        }
      } catch (err) {
        console.error('Failed to load floor availability', err);
      } finally {
        setFloorLoading(false);
      }
    }

    loadFloorAvailability();
  }, [selectedFloorId, scheduleInterval]);

  // 3. Handle Hold & Proceed to Checkout
  const handleHoldAndCheckout = async () => {
    setHoldError(null);
    const user = getStoredUser();
    if (!user) {
      // Trigger login prompt
      const authBtn = document.getElementById('navbar-auth-btn');
      if (authBtn) authBtn.click();
      setHoldError('Please log in with Member or Admin credentials to reserve a seat.');
      return;
    }

    if (!selectedUnit) {
      setHoldError('Please select an available desk or cabin from the floor plan.');
      return;
    }

    if (!currentPlan) {
      setHoldError('Please select a valid booking plan.');
      return;
    }

    try {
      setHolding(true);
      const hold = await apiRequest<any>('/bookings/hold', {
        method: 'POST',
        body: JSON.stringify({
          unitId: selectedUnit.id,
          startDateTime: scheduleInterval?.start,
          endDateTime: scheduleInterval?.end,
          startTime: scheduleInterval?.start,
          endTime: scheduleInterval?.end,
        }),
      });

      // Redirect to checkout with hold and plan IDs
      router.push(
        `/checkout?holdId=${hold.id}&planId=${currentPlan.id}&workspaceId=${workspace.id}&unitId=${selectedUnit.id}&startDateTime=${encodeURIComponent(scheduleInterval?.start || '')}&endDateTime=${encodeURIComponent(scheduleInterval?.end || '')}`
      );
    } catch (err: any) {
      setHoldError(err.message || 'This seat was just held by another member. Please select another seat.');
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-gray-700">Loading Studio i Campus Details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Workspace Not Found</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">{error || 'The requested coworking campus does not exist.'}</p>
          <Link href="/explore" className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full">
            Back to Explore
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const heroMedia = workspace.media?.find((m: any) => m.isHero) || workspace.media?.[0];
  const otherMedia = workspace.media?.filter((m: any) => m.id !== heroMedia?.id) || [];
  const floors = workspace.buildings?.[0]?.floors || [];

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 flex flex-col">
      <Navbar />

      {/* Breadcrumb Header */}
      <div className="bg-white pt-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/explore" className="hover:text-black">Campuses</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-semibold truncate">{workspace.name}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
        {/* Title & Key Specs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0e4962] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Studio i Flagship Campus
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0e4962] shrink-0" />
              <span>{workspace.address}, {workspace.city} - {workspace.pincode}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-2.5 rounded-2xl border border-gray-200 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl shadow-xs font-bold text-sm">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{workspace.rating}</span>
              <span className="text-xs font-normal text-gray-400">({workspace.reviewCount} verified reviews)</span>
            </div>
            <div className="text-xs text-gray-600 font-medium px-2">
              Timezone: <span className="font-semibold text-gray-900">{workspace.timezone}</span>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl overflow-hidden max-h-[460px]">
          <div className="md:col-span-2 relative h-72 md:h-[460px] bg-gray-100">
            <Image
              src={heroMedia?.url || '/assets/building-lehariya.png'}
              alt={workspace.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-[460px]">
            {otherMedia.slice(0, 2).map((m: any, idx: number) => (
              <div key={idx} className="relative flex-1 bg-gray-100 rounded-2xl overflow-hidden">
                <Image src={m.url} alt={m.caption || workspace.name} fill className="object-cover" />
              </div>
            ))}
            {otherMedia.length === 0 && (
              <div className="relative flex-1 bg-gray-100 rounded-2xl overflow-hidden">
                <Image src="/assets/property-lehariya.png" alt={workspace.name} fill className="object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Main Grid: Plans & Floor Plan Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Floor Plan & Seat Selection (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Floor & Schedule Picker */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#0e4962]" />
                    Interactive Floor Plan & Seat Reservation
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select a floor, pick your reserved desk or cabin, and lock it in real-time.
                  </p>
                </div>

                {/* Floor Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-full text-xs font-semibold">
                  {floors.map((fl: any) => (
                    <button
                      key={fl.id}
                      onClick={() => setSelectedFloorId(fl.id)}
                      className={`px-3 py-1.5 rounded-full transition ${selectedFloorId === fl.id
                        ? 'bg-black text-white shadow-xs'
                        : 'text-gray-600 hover:text-black'
                        }`}
                    >
                      {fl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Date & Duration Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200/80 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Reservation Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                  />
                </div>

                {currentPlan?.planType === 'HOURLY' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Duration (Hours)</label>
                    <select
                      value={selectedDurationHours}
                      onChange={(e) => setSelectedDurationHours(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                    >
                      {[1, 2, 4, 6, 8, 10].map((h) => (
                        <option key={h} value={h}>{h} Hours</option>
                      ))}
                    </select>
                  </div>
                )}

                {currentPlan?.planType === 'MONTHLY' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Commitment (Months)
                    </label>
                    <select
                      value={selectedMonths}
                      onChange={(e) => setSelectedMonths(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                    >
                      {[2, 3, 6, 12].map((m) => (
                        <option key={m} value={m}>
                          {m} Months {m === 2 ? '(Min Commitment)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col justify-end">
                  <div className="text-[11px] text-gray-500 bg-white p-2 rounded-xl border border-gray-200 text-center font-mono">
                    {scheduleInterval ? (
                      <span>
                        {new Date(scheduleInterval.start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        {' • '}
                        {new Date(scheduleInterval.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : 'Select date'}
                  </div>
                </div>
              </div>

              {/* Floor Plan Legend */}
              <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-gray-600 px-2 py-1 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#0e4962]"></span>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500"></span>
                  <span>Booked / Reserved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500"></span>
                  <span>Held (10m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-gray-300"></span>
                  <span>Maintenance</span>
                </div>
              </div>

              {/* 2D Interactive Floor Layout Canvas */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-gray-800 p-4 min-h-[380px] flex items-center justify-center">
                {floorLoading ? (
                  <div className="text-white text-xs font-semibold flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0e4962] border-t-transparent rounded-full animate-spin"></div>
                    Checking real-time seat availability...
                  </div>
                ) : !floorData || floorData.units.length === 0 ? (
                  <div className="text-gray-400 text-xs">No unit layout published for this floor yet.</div>
                ) : (
                  <div className="relative w-full overflow-x-auto py-2">
                    <svg
                      viewBox="0 0 1000 480"
                      className="w-full h-auto max-h-[420px] select-none"
                    >
                      {/* Floor Outline & Grid */}
                      <rect x="20" y="20" width="960" height="440" rx="16" fill="#0F172A" stroke="#1E293B" strokeWidth="3" />

                      {/* Zones / Walls representation */}
                      <rect x="680" y="80" width="260" height="340" rx="12" fill="#1E293B" opacity="0.4" />
                      <text x="700" y="65" fill="#64748B" fontSize="12" fontWeight="bold">Executive Wing & Cabins</text>
                      <text x="100" y="65" fill="#64748B" fontSize="12" fontWeight="bold">Ergonomic Open Desks</text>

                      {/* Units */}
                      {floorData.units.map((unit) => {
                        const isSelected = selectedUnit?.id === unit.id;
                        const isAvailable = unit.status === 'AVAILABLE';

                        let fillColor = '#10B981'; // Emerald
                        let strokeColor = '#059669';

                        if (isSelected) {
                          fillColor = '#0e4962';
                          strokeColor = '#093447';
                        } else if (unit.status === 'BOOKED') {
                          fillColor = '#EF4444'; // Red
                          strokeColor = '#DC2626';
                        } else if (unit.status === 'HELD') {
                          fillColor = '#F59E0B'; // Amber
                          strokeColor = '#D97706';
                        } else if (unit.status === 'MAINTENANCE' || unit.status === 'DISABLED') {
                          fillColor = '#64748B'; // Gray
                          strokeColor = '#475569';
                        }

                        return (
                          <g
                            key={unit.id}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedUnit(unit);
                                setHoldError(null);
                              }
                            }}
                            className={isAvailable ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-60'}
                          >
                            <rect
                              x={unit.x}
                              y={unit.y}
                              width={unit.width}
                              height={unit.height}
                              rx={unit.unitType === 'PRIVATE_CABIN' || unit.unitType === 'MEETING_ROOM' ? 10 : 6}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? 3 : 1.5}
                            />
                            {/* Code Label */}
                            <text
                              x={unit.x + unit.width / 2}
                              y={unit.y + unit.height / 2 - 2}
                              fill="#FFFFFF"
                              fontSize={unit.unitType === 'HOT_DESK' ? 10 : 12}
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {unit.unitCode}
                            </text>
                            <text
                              x={unit.x + unit.width / 2}
                              y={unit.y + unit.height / 2 + 12}
                              fill="#FFFFFF"
                              fontSize={8}
                              opacity="0.9"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {unit.capacity > 1 ? `${unit.capacity} Pax` : unit.unitType.replace('_', ' ')}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>

              {/* Accessible Keyboard List Alternative */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Accessible Unit Selector
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                  {floorData?.units.map((u) => {
                    const isAvail = u.status === 'AVAILABLE';
                    const isSel = selectedUnit?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        disabled={!isAvail}
                        onClick={() => {
                          setSelectedUnit(u);
                          setHoldError(null);
                        }}
                        className={`p-2 rounded-xl text-left border text-xs transition ${isSel
                          ? 'bg-[#0e4962] text-white border-[#0e4962] font-bold shadow-xs'
                          : isAvail
                            ? 'bg-white hover:border-gray-400 border-gray-200 text-gray-800'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <div className="font-bold truncate">{u.unitCode}</div>
                        <div className="text-[10px] opacity-80">{u.status}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Campus Amenities & Guidelines */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Included Coworking Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {workspace.amenities?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#0e4962] shrink-0" />
                    <span className="font-semibold text-gray-800">{item.amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Plan Selection & Real-Time Checkout Hold (5 Cols) */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/90 shadow-lg space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">
                  Step 2: Choose Plan & Lock Seat
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">Select Membership Plan</h3>
              </div>

              {/* Plans Radio List */}
              <div className="space-y-3">
                {workspace.bookingPlans?.map((plan: any) => {
                  const isSelected = selectedPlanId === plan.id;
                  const rateRupees = Number(plan.ratePaise) / 100;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start justify-between ${isSelected
                        ? 'border-[#0e4962] bg-[#edf4f7]/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{plan.title}</span>
                          {plan.minCommitmentMonths > 0 && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                              {plan.minCommitmentMonths}-Mo Min
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <div className="font-extrabold text-base text-gray-900">
                          ₹{rateRupees.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          /{plan.planType.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Unit Summary */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Selected Unit:</span>
                  <span className="font-bold text-gray-900">
                    {selectedUnit ? `${selectedUnit.unitCode} (${selectedUnit.name})` : 'None (Click a green seat)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Floor:</span>
                  <span className="font-bold text-gray-900">
                    {floors.find((f: any) => f.id === selectedFloorId)?.name || '1st Floor'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Hold Window:</span>
                  <span className="font-bold text-emerald-600">10 Minutes Guaranteed</span>
                </div>
              </div>

              {/* Error Message */}
              {holdError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{holdError}</span>
                </div>
              )}

              {/* Hold & Reserve Action Button */}
              <button
                onClick={handleHoldAndCheckout}
                disabled={holding || !selectedUnit}
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${selectedUnit && !holding
                  ? 'bg-[#0e4962] hover:bg-[#093447] text-white cursor-pointer hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {holding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Securing 10-Minute Hold...
                  </>
                ) : (
                  <>
                    Hold Seat & Continue to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Instant confirmation. Guaranteed anti-double-booking locks with transactional verification.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
