'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Check, Lock, 
  Clock, AlertCircle, Sparkles, Layers, Users, 
  Coffee, ShieldCheck, ArrowRight, Eye, ChevronUp, ChevronDown
} from 'lucide-react';

export interface OfficeUnit {
  id: string;
  unitCode: string;
  name: string;
  unitType: 'HOT_DESK' | 'DEDICATED_DESK' | 'PRIVATE_CABIN' | 'MEETING_ROOM';
  capacity: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'MAINTENANCE' | 'DISABLED';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  chairSide?: 'top' | 'bottom' | 'left' | 'right';
  zoneName?: string;
  pricePaise?: string;
}

interface FloorPlan2DViewerProps {
  floorName: string;
  units: OfficeUnit[];
  selectedUnit: OfficeUnit | null;
  onSelectUnit: (unit: OfficeUnit) => void;
  onHoldAndContinue: () => void;
  holding: boolean;
  holdError: string | null;
  scheduleSummary: string;
  planTitle: string;
  planRateText: string;
}

export default function FloorPlan2DViewer({
  floorName,
  units,
  selectedUnit,
  onSelectUnit,
  onHoldAndContinue,
  holding,
  holdError,
  scheduleSummary,
  planTitle,
  planRateText,
}: FloorPlan2DViewerProps) {
  // Pan & Zoom Transform State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on background drag
    if ((e.target as HTMLElement).tagName === 'rect' && (e.target as HTMLElement).getAttribute('data-clickable') === 'true') {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => setIsDragging(false);

  // Filtered unit inventory count
  const unitCounts = useMemo(() => {
    return {
      available: units.filter((u) => u.status === 'AVAILABLE').length,
      booked: units.filter((u) => u.status === 'BOOKED').length,
      held: units.filter((u) => u.status === 'HELD').length,
      total: units.length,
    };
  }, [units]);

  const displayedUnits = useMemo(() => {
    if (filterType === 'ALL') return units;
    return units.filter((u) => u.unitType === filterType);
  }, [units, filterType]);

  return (
    <div className="space-y-6">
      {/* 2D Theatre Office Canvas Card */}
      <div className="bg-[#111622] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
        {/* Floor & Canvas Control Header */}
        <div className="p-4 sm:p-5 bg-[#0C101A] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white tracking-wide text-sm">{floorName}</span>
            <span className="text-slate-400 font-mono text-[11px] bg-slate-800/60 px-2 py-0.5 rounded-md">
              {unitCounts.available} of {unitCounts.total} Available
            </span>
          </div>

          {/* Unit Type Filter Pills */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold text-slate-400">
            {['ALL', 'HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_CABIN', 'MEETING_ROOM'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === type
                    ? 'bg-[#0e4962] text-white shadow-xs font-bold'
                    : 'hover:text-white'
                }`}
              >
                {type === 'ALL' ? 'All Seats' : type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Zoom & Fit Toolbar */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-slate-300">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 font-bold text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition cursor-pointer ml-1"
              title="Fit to Floor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Legend Ribbon */}
        <div className="px-5 py-2.5 bg-[#090D15] border-b border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-semibold text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-xs"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0e4962] ring-2 ring-white shadow-xs"></span>
              <span className="text-white font-bold">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 shadow-xs"></span>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500 shadow-xs"></span>
              <span>Held (10m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-600 shadow-xs"></span>
              <span>Maintenance</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-500 italic hidden sm:inline">
            Click green seat to select • Drag background to pan
          </span>
        </div>

        {/* Top-Down Interactive SVG Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full h-[460px] sm:h-[500px] overflow-hidden bg-[#070A10] select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '50% 50%',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <defs>
              {/* Pattern for booked diagonal hatching */}
              <pattern id="bookedHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#7F1D1D" strokeWidth="2" />
              </pattern>
              {/* Glow filter for selected seat */}
              <filter id="magentaGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0e4962" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Office Architectural Floor Envelope */}
            <rect x="25" y="25" width="950" height="450" rx="20" fill="#0A0F1A" stroke="#1E293B" strokeWidth="3" />

            {/* Glass partition dividing Executive Wing */}
            <line x1="660" y1="35" x2="660" y2="465" stroke="#334155" strokeWidth="3" strokeDasharray="6 6" />
            <text x="675" y="55" fill="#475569" fontSize="11" fontWeight="bold" letterSpacing="1">
              EXECUTIVE WING & CABINS
            </text>
            <text x="50" y="55" fill="#475569" fontSize="11" fontWeight="bold" letterSpacing="1">
              OPEN-PLAN ERGONOMIC DESKS
            </text>

            {/* Architectural Landmark: Reception & Front Desk */}
            <g transform="translate(50, 400)">
              <rect width="140" height="40" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
              <text x="70" y="24" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle">
                RECEPTION / HOST
              </text>
            </g>

            {/* Architectural Landmark: Espresso Bar & Pantry */}
            <g transform="translate(240, 400)">
              <rect width="180" height="40" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
              <text x="90" y="24" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle">
                ☕ SPECIALTY COFFEE BAR
              </text>
            </g>

            {/* Architectural Landmark: Outdoor Terrace Entry */}
            <g transform="translate(480, 400)">
              <rect width="140" height="40" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="70" y="24" fill="#64748B" fontSize="9" fontWeight="bold" textAnchor="middle">
                TERRACE DECK
              </text>
            </g>

            {/* Render Workstations, Desks, and Cabins */}
            {displayedUnits.map((unit) => {
              const isSelected = selectedUnit?.id === unit.id;
              const isHovered = hoveredUnitId === unit.id;
              const isAvailable = unit.status === 'AVAILABLE';

              let fillColor = '#10B981'; // Available Emerald
              let strokeColor = '#059669';

              if (isSelected) {
                fillColor = '#0e4962'; // Selected Brand Pink
                strokeColor = '#FFFFFF';
              } else if (unit.status === 'BOOKED') {
                fillColor = '#EF4444'; // Booked Red
                strokeColor = '#DC2626';
              } else if (unit.status === 'HELD') {
                fillColor = '#F59E0B'; // Held Amber
                strokeColor = '#D97706';
              } else if (unit.status === 'MAINTENANCE' || unit.status === 'DISABLED') {
                fillColor = '#475569'; // Gray
                strokeColor = '#334155';
              }

              const isCabin = unit.unitType === 'PRIVATE_CABIN';
              const isMeetingRoom = unit.unitType === 'MEETING_ROOM';

              return (
                <g
                  key={unit.id}
                  onMouseEnter={() => setHoveredUnitId(unit.id)}
                  onMouseLeave={() => setHoveredUnitId(null)}
                  onClick={() => {
                    if (isAvailable) onSelectUnit(unit);
                  }}
                  className={isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  filter={isSelected ? 'url(#magentaGlow)' : undefined}
                >
                  {/* Cabin Room Perimeter Wall (if cabin or meeting room) */}
                  {(isCabin || isMeetingRoom) && (
                    <rect
                      x={unit.x - 6}
                      y={unit.y - 6}
                      width={unit.width + 12}
                      height={unit.height + 12}
                      rx={14}
                      fill="none"
                      stroke={isSelected ? '#0e4962' : '#334155'}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isMeetingRoom ? '4 4' : 'none'}
                    />
                  )}

                  {/* Main Desk / Table Body */}
                  <rect
                    data-clickable="true"
                    x={unit.x}
                    y={unit.y}
                    width={unit.width}
                    height={unit.height}
                    rx={isCabin || isMeetingRoom ? 10 : 7}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all duration-150"
                  />

                  {/* Theatre-Style Ergonomic Chair Orientation Indicator */}
                  {!isCabin && !isMeetingRoom && (
                    <path
                      d={`M ${unit.x + unit.width / 2 - 12} ${unit.y - 6} Q ${unit.x + unit.width / 2} ${unit.y - 12} ${unit.x + unit.width / 2 + 12} ${unit.y - 6}`}
                      stroke={isSelected ? '#0e4962' : '#64748B'}
                      strokeWidth={3}
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}

                  {/* Meeting Room Chairs (Top and Bottom) */}
                  {isMeetingRoom && (
                    <>
                      {/* Top chairs */}
                      <circle cx={unit.x + 40} cy={unit.y - 4} r={4} fill="#475569" />
                      <circle cx={unit.x + unit.width / 2} cy={unit.y - 4} r={4} fill="#475569" />
                      <circle cx={unit.x + unit.width - 40} cy={unit.y - 4} r={4} fill="#475569" />
                      {/* Bottom chairs */}
                      <circle cx={unit.x + 40} cy={unit.y + unit.height + 4} r={4} fill="#475569" />
                      <circle cx={unit.x + unit.width / 2} cy={unit.y + unit.height + 4} r={4} fill="#475569" />
                      <circle cx={unit.x + unit.width - 40} cy={unit.y + unit.height + 4} r={4} fill="#475569" />
                    </>
                  )}

                  {/* Unit Label Code */}
                  <text
                    x={unit.x + unit.width / 2}
                    y={unit.y + unit.height / 2 - 2}
                    fill="#FFFFFF"
                    fontSize={isCabin || isMeetingRoom ? 12 : 10}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {unit.unitCode}
                  </text>

                  {/* Subtitle Capacity / Pax */}
                  <text
                    x={unit.x + unit.width / 2}
                    y={unit.y + unit.height / 2 + 12}
                    fill="#FFFFFF"
                    fontSize={8}
                    opacity={0.85}
                    fontWeight="semibold"
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
      </div>

      {/* Accessible Keyboard List Selector (WCAG Compliant) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#0e4962]" />
            Accessible Floor Seat Directory
          </h4>
          <span className="text-[11px] text-gray-400">
            Click or press Tab/Enter on any seat to reserve
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
          {displayedUnits.map((u) => {
            const isAvail = u.status === 'AVAILABLE';
            const isSel = selectedUnit?.id === u.id;
            return (
              <button
                key={u.id}
                disabled={!isAvail}
                onClick={() => onSelectUnit(u)}
                className={`p-2 rounded-xl text-left border text-xs transition ${
                  isSel
                    ? 'bg-[#0e4962] text-white border-[#0e4962] font-bold shadow-xs'
                    : isAvail
                    ? 'bg-white hover:border-gray-400 border-gray-200 text-gray-800'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="font-bold truncate">{u.unitCode}</div>
                <div className="text-[10px] opacity-80">{u.status}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Selection & 10-Minute Hold Summary Card (Fixed for Mobile & Integrated for Desktop) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e4962] block">
              Selection Summary
            </span>
            <h3 className="text-base font-extrabold text-gray-900">
              {selectedUnit ? `${selectedUnit.unitCode} • ${selectedUnit.name}` : 'No Seat Selected'}
            </h3>
          </div>

          {selectedUnit && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              Eligible for 10-Min Hold
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium">Selected Plan</span>
            <span className="font-bold text-gray-900">{planTitle}</span>
            <span className="text-[11px] text-[#0e4962] block font-semibold">{planRateText}</span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium">Schedule Window</span>
            <span className="font-semibold text-gray-900 block">{scheduleSummary}</span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium">Seat Capacity</span>
            <span className="font-bold text-gray-900">{selectedUnit?.capacity || 1} Person(s)</span>
            <span className="text-[10px] text-gray-400 block">Exclusive Allocation</span>
          </div>
        </div>

        {holdError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{holdError}</span>
          </div>
        )}

        <button
          onClick={onHoldAndContinue}
          disabled={!selectedUnit || holding}
          className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
            selectedUnit && !holding
              ? 'bg-[#0e4962] hover:bg-[#093447] text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {holding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Securing Exclusive 10-Minute Hold...
            </>
          ) : (
            <>
              Hold {selectedUnit ? selectedUnit.unitCode : 'Seat'} & Continue to Checkout
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center">
          🔒 Lock guarantees anti-double-booking. Hold isDERIVED from server timestamp with bounded 10-min duration.
        </p>
      </div>
    </div>
  );
}
