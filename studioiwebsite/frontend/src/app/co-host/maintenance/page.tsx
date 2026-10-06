'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Wrench, CheckSquare, Plus, AlertCircle, 
  CheckCircle2, Clock, Upload, X, Filter
} from 'lucide-react';

interface Ticket {
  id: string;
  property: string;
  title: string;
  category: 'MAINTENANCE' | 'CLEANING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTo: string;
  reportedDate: string;
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-501',
    property: 'Lehariya KGK Realty — Cabin 402',
    title: 'AC Cooling Fan Repair & Filter Replacement',
    category: 'MAINTENANCE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: 'Rajesh Sharma (Co-Host)',
    reportedDate: '2026-09-23 10:15 AM',
  },
  {
    id: 'TCK-502',
    property: 'Horizon Tower — Executive Desk Suite',
    title: 'Post-Checkout Deep Sanitation & Linen Change',
    category: 'CLEANING',
    priority: 'MEDIUM',
    status: 'OPEN',
    assignedTo: 'Cleaning Crew Alpha',
    reportedDate: '2026-09-23 11:45 AM',
  },
  {
    id: 'TCK-503',
    property: 'Rathore Bhawan Alwar — Conference Room',
    title: 'HDMI Projector Cable & Casting Dongle Check',
    category: 'MAINTENANCE',
    priority: 'LOW',
    status: 'RESOLVED',
    assignedTo: 'Rajesh Sharma (Co-Host)',
    reportedDate: '2026-09-22 03:00 PM',
  },
];

export default function CoHostMaintenanceTaskBoardPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MAINTENANCE' | 'CLEANING'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newCategory, setNewCategory] = useState<'MAINTENANCE' | 'CLEANING'>('MAINTENANCE');

  const filteredTickets = tickets.filter(t => activeCategory === 'ALL' || t.category === activeCategory);

  const updateStatus = (id: string, nextStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: Ticket = {
      id: `TCK-${Math.floor(500 + Math.random() * 500)}`,
      property: 'Lehariya KGK Realty — Cabin 402',
      title: newTitle,
      category: newCategory,
      priority: newPriority,
      status: 'OPEN',
      assignedTo: 'Co-Host Operator',
      reportedDate: new Date().toLocaleString(),
    };
    setTickets([created, ...tickets]);
    setShowModal(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-8 max-w-6xl text-neutral-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Co-Host Operations Board</span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 mt-1">
            Maintenance & Cleaning Task Board
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Log repair tickets, track check-in sanitation checklists, set priority levels, and attach completion proofs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Log Maintenance / Cleaning Ticket
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 pb-3">
        {(['ALL', 'MAINTENANCE', 'CLEANING'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === cat ? 'bg-[#0e4962] text-white shadow-xs' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-[#edf4f7]/40'
            }`}
          >
            {cat} Tasks
          </button>
        ))}
      </div>

      {/* Kanban / Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* OPEN Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between font-bold text-xs text-amber-700 uppercase tracking-wider border-b border-neutral-200 pb-2">
            <span>Open Tickets ({filteredTickets.filter(t => t.status === 'OPEN').length})</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          {filteredTickets.filter(t => t.status === 'OPEN').map((t) => (
            <div key={t.id} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0e4962]">{t.id}</span>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase border ${
                  t.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {t.priority} Priority
                </span>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{t.title}</h4>
                <p className="text-[11px] text-neutral-500 mt-1">{t.property}</p>
              </div>
              <button
                onClick={() => updateStatus(t.id, 'IN_PROGRESS')}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Mark In Progress →
              </button>
            </div>
          ))}
        </div>

        {/* IN_PROGRESS Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between font-bold text-xs text-blue-700 uppercase tracking-wider border-b border-neutral-200 pb-2">
            <span>In Progress ({filteredTickets.filter(t => t.status === 'IN_PROGRESS').length})</span>
            <Clock className="w-4 h-4" />
          </div>
          {filteredTickets.filter(t => t.status === 'IN_PROGRESS').map((t) => (
            <div key={t.id} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0e4962]">{t.id}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {t.priority}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{t.title}</h4>
                <p className="text-[11px] text-neutral-500 mt-1">{t.property}</p>
              </div>
              <button
                onClick={() => updateStatus(t.id, 'RESOLVED')}
                className="w-full py-2 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                ✓ Complete & Resolve
              </button>
            </div>
          ))}
        </div>

        {/* RESOLVED Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between font-bold text-xs text-emerald-700 uppercase tracking-wider border-b border-neutral-200 pb-2">
            <span>Resolved ({filteredTickets.filter(t => t.status === 'RESOLVED').length})</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          {filteredTickets.filter(t => t.status === 'RESOLVED').map((t) => (
            <div key={t.id} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3 shadow-xs opacity-80">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-400">{t.id}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  RESOLVED
                </span>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{t.title}</h4>
                <p className="text-[11px] text-neutral-500 mt-1">{t.property}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTicket} className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4962]">Co-Host Desk</span>
              <h2 className="text-xl font-black text-neutral-900 mt-1">Log Operation Ticket</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Issue / Task Description</label>
                <input
                  type="text"
                  placeholder="e.g. AC Repair or Sanitation Checklist"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
                  >
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="CLEANING">Sanitation / Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:border-[#0e4962] focus:bg-white"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Log Ticket to Board
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition border border-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
