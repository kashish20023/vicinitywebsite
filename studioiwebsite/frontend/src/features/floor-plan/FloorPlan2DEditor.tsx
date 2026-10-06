'use client';

import React, { useState, useRef } from 'react';
import { 
  Save, Plus, Trash2, RotateCcw, Undo2, Redo2, 
  Layers, Settings2, Eye, CheckCircle2, AlertCircle,
  Move, Maximize2, ShieldCheck, Sparkles, Building
} from 'lucide-react';
import { OfficeUnit } from './FloorPlan2DViewer';

interface FloorPlan2DEditorProps {
  floorId: string;
  floorName: string;
  initialUnits: OfficeUnit[];
  onSavePublish: (units: OfficeUnit[]) => Promise<void>;
  saving: boolean;
  saveSuccess: string | null;
}

export default function FloorPlan2DEditor({
  floorId,
  floorName,
  initialUnits,
  onSavePublish,
  saving,
  saveSuccess,
}: FloorPlan2DEditorProps) {
  const [units, setUnits] = useState<OfficeUnit[]>(initialUnits);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    initialUnits[0]?.id || null
  );
  const [history, setHistory] = useState<OfficeUnit[][]>([initialUnits]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // New Unit Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnit, setNewUnit] = useState<Partial<OfficeUnit>>({
    unitCode: 'LH-01-D99',
    name: 'Executive Workstation',
    unitType: 'HOT_DESK',
    capacity: 1,
    status: 'AVAILABLE',
    x: 320,
    y: 200,
    width: 70,
    height: 60,
  });

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  // Push to history for undo/redo
  const pushHistory = (newUnits: OfficeUnit[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newUnits);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setUnits(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setUnits(history[historyIndex + 1]);
    }
  };

  const handleUpdateUnit = (field: keyof OfficeUnit, value: any) => {
    if (!selectedUnitId) return;
    const updated = units.map((u) =>
      u.id === selectedUnitId ? { ...u, [field]: value } : u
    );
    setUnits(updated);
    pushHistory(updated);
  };

  const handleAddUnit = () => {
    const unitToAdd: OfficeUnit = {
      id: `unit_${Date.now()}`,
      unitCode: newUnit.unitCode || `LH-U-${Date.now().toString().slice(-4)}`,
      name: newUnit.name || 'New Unit',
      unitType: (newUnit.unitType as any) || 'HOT_DESK',
      capacity: newUnit.capacity || 1,
      status: (newUnit.status as any) || 'AVAILABLE',
      x: newUnit.x || 200,
      y: newUnit.y || 200,
      width: newUnit.width || 70,
      height: newUnit.height || 60,
    };
    const updated = [...units, unitToAdd];
    setUnits(updated);
    pushHistory(updated);
    setSelectedUnitId(unitToAdd.id);
    setShowAddModal(false);
  };

  const handleDeleteUnit = (id: string) => {
    if (!confirm('Are you sure you want to remove this unit from the floor plan?')) return;
    const updated = units.filter((u) => u.id !== id);
    setUnits(updated);
    pushHistory(updated);
    if (selectedUnitId === id) {
      setSelectedUnitId(updated[0]?.id || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-[#0e4962]/20 text-[#0e4962] rounded-full">
              Interactive 2D Layout Editor
            </span>
            <span className="text-xs text-neutral-400 font-mono">Floor ID: {floorId.slice(0, 8)}...</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {floorName} • Office Layout Architecture
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-neutral-300">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 hover:bg-neutral-800 disabled:opacity-30 rounded-lg transition"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 hover:bg-neutral-800 disabled:opacity-30 rounded-lg transition"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0e4962]" />
            Add Desk / Cabin
          </button>

          <button
            onClick={() => onSavePublish(units)}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Publishing Live...' : 'Publish Layout to Members'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Editor Main Canvas & Properties Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual 2D Grid Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-[#141414] p-4 rounded-3xl border border-neutral-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-2">
            <span>Editor Resolution: 1000px × 500px</span>
            <span>Total Units Configured: {units.length}</span>
          </div>

          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-neutral-800 p-2 min-h-[480px] flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-auto max-h-[460px] select-none">
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="1000" height="500" fill="url(#gridPattern)" />

              {/* Floor boundary */}
              <rect x="25" y="25" width="950" height="450" rx="20" fill="#0A0F1A" stroke="#334155" strokeWidth="2" />

              {/* Zones */}
              <line x1="660" y1="35" x2="660" y2="465" stroke="#334155" strokeWidth="2" strokeDasharray="6 6" />
              <text x="675" y="55" fill="#475569" fontSize="11" fontWeight="bold">EXECUTIVE WING</text>
              <text x="50" y="55" fill="#475569" fontSize="11" fontWeight="bold">OPEN DESKS</text>

              {/* Landmarks */}
              <rect x="50" y="400" width="140" height="40" rx="8" fill="#1E293B" stroke="#334155" />
              <text x="120" y="424" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle">RECEPTION</text>

              <rect x="240" y="400" width="180" height="40" rx="8" fill="#1E293B" stroke="#334155" />
              <text x="330" y="424" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle">☕ ESPRESSO BAR</text>

              {/* Units */}
              {units.map((u) => {
                const isSelected = selectedUnitId === u.id;
                let fill = '#10B981';
                let stroke = '#059669';

                if (isSelected) {
                  fill = '#0e4962';
                  stroke = '#FFFFFF';
                } else if (u.status === 'MAINTENANCE') {
                  fill = '#F59E0B';
                  stroke = '#D97706';
                } else if (u.status === 'DISABLED') {
                  fill = '#64748B';
                  stroke = '#475569';
                }

                const isCabin = u.unitType === 'PRIVATE_CABIN';
                const isMeeting = u.unitType === 'MEETING_ROOM';

                return (
                  <g
                    key={u.id}
                    onClick={() => setSelectedUnitId(u.id)}
                    className="cursor-pointer hover:opacity-95"
                  >
                    {(isCabin || isMeeting) && (
                      <rect
                        x={u.x - 4}
                        y={u.y - 4}
                        width={u.width + 8}
                        height={u.height + 8}
                        rx={12}
                        fill="none"
                        stroke={isSelected ? '#0e4962' : '#334155'}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                    )}

                    <rect
                      x={u.x}
                      y={u.y}
                      width={u.width}
                      height={u.height}
                      rx={isCabin || isMeeting ? 10 : 6}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />

                    {/* Chair Indicator */}
                    {!isCabin && !isMeeting && (
                      <path
                        d={`M ${u.x + u.width / 2 - 10} ${u.y - 4} Q ${u.x + u.width / 2} ${u.y - 9} ${u.x + u.width / 2 + 10} ${u.y - 4}`}
                        stroke={isSelected ? '#0e4962' : '#64748B'}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        fill="none"
                      />
                    )}

                    <text
                      x={u.x + u.width / 2}
                      y={u.y + u.height / 2 - 2}
                      fill="#FFFFFF"
                      fontSize={isCabin || isMeeting ? 11 : 9}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {u.unitCode}
                    </text>

                    <text
                      x={u.x + u.width / 2}
                      y={u.y + u.height / 2 + 10}
                      fill="#FFFFFF"
                      fontSize={8}
                      opacity={0.85}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {u.capacity > 1 ? `${u.capacity} Pax` : u.unitType.replace('_', ' ')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Unit Properties Inspector (4 Cols) */}
        <div className="lg:col-span-4 bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#0e4962]" />
              Object Properties Inspector
            </h3>
            {selectedUnit && (
              <button
                onClick={() => handleDeleteUnit(selectedUnit.id)}
                className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          {selectedUnit ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Unit Code</label>
                <input
                  type="text"
                  value={selectedUnit.unitCode}
                  onChange={(e) => handleUpdateUnit('unitCode', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white font-mono font-bold focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Display Name</label>
                <input
                  type="text"
                  value={selectedUnit.name}
                  onChange={(e) => handleUpdateUnit('name', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Inventory Type</label>
                  <select
                    value={selectedUnit.unitType}
                    onChange={(e) => handleUpdateUnit('unitType', e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                  >
                    <option value="HOT_DESK">Hot Desk</option>
                    <option value="DEDICATED_DESK">Dedicated Desk</option>
                    <option value="PRIVATE_CABIN">Private Cabin</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Status</label>
                  <select
                    value={selectedUnit.status}
                    onChange={(e) => handleUpdateUnit('status', e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#0e4962] focus:outline-none"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-neutral-900 rounded-2xl border border-neutral-800">
                <div>
                  <label className="text-[10px] text-neutral-500 font-bold block">X Coordinate</label>
                  <input
                    type="number"
                    value={selectedUnit.x}
                    onChange={(e) => handleUpdateUnit('x', Number(e.target.value))}
                    className="w-full bg-neutral-800 border border-neutral-700 p-1.5 rounded-lg text-white font-mono mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 font-bold block">Y Coordinate</label>
                  <input
                    type="number"
                    value={selectedUnit.y}
                    onChange={(e) => handleUpdateUnit('y', Number(e.target.value))}
                    className="w-full bg-neutral-800 border border-neutral-700 p-1.5 rounded-lg text-white font-mono mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 font-bold block">Width (px)</label>
                  <input
                    type="number"
                    value={selectedUnit.width}
                    onChange={(e) => handleUpdateUnit('width', Number(e.target.value))}
                    className="w-full bg-neutral-800 border border-neutral-700 p-1.5 rounded-lg text-white font-mono mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 font-bold block">Height (px)</label>
                  <input
                    type="number"
                    value={selectedUnit.height}
                    onChange={(e) => handleUpdateUnit('height', Number(e.target.value))}
                    className="w-full bg-neutral-800 border border-neutral-700 p-1.5 rounded-lg text-white font-mono mt-0.5"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500 text-xs">
              Click any unit on the canvas to inspect its geometry and status.
            </div>
          )}
        </div>
      </div>

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171717] border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Office Unit</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Unit Code</label>
                <input
                  type="text"
                  value={newUnit.unitCode}
                  onChange={(e) => setNewUnit({ ...newUnit, unitCode: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Unit Name</label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Category</label>
                  <select
                    value={newUnit.unitType}
                    onChange={(e) => setNewUnit({ ...newUnit, unitType: e.target.value as any })}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white"
                  >
                    <option value="HOT_DESK">Hot Desk</option>
                    <option value="DEDICATED_DESK">Dedicated Desk</option>
                    <option value="PRIVATE_CABIN">Private Cabin</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Capacity (Pax)</label>
                  <input
                    type="number"
                    value={newUnit.capacity}
                    onChange={(e) => setNewUnit({ ...newUnit, capacity: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUnit}
                className="flex-1 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl"
              >
                Place on Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
