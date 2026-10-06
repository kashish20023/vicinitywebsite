'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Wrench, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function CoHostTasksPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-rose-600" /> Maintenance & Cleaning Tasks
          </span>
        }
        subtitle="Manage cleaning schedules and property repair tasks for your assigned listings."
        breadcrumbs={[
          { label: 'Co-Host Workspace', href: '/co-host/bookings' },
          { label: 'Maintenance & Tasks' },
        ]}
        badge="Co-Host Operations"
        actions={
          <button className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-button font-medium transition flex items-center gap-1.5 shadow-xs w-fit cursor-pointer">
            <Plus className="w-4 h-4" /> Create Maintenance Task
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'AC Maintenance Check', property: 'Sunset Villa', priority: 'HIGH', status: 'IN_PROGRESS', date: 'Today' },
          { title: 'Turnover Deep Cleaning', property: 'City Apartment', priority: 'MEDIUM', status: 'PENDING', date: 'Tomorrow' },
          { title: 'Pool Filter Service', property: 'Beach House', priority: 'LOW', status: 'COMPLETED', date: '14 Sep' },
        ].map((t, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-rose-600 uppercase bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                {t.property}
              </span>
              <span className={`px-2 py-0.5 text-overline font-semibold rounded-md ${
                t.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-neutral-100 text-neutral-700'
              }`}>
                {t.priority}
              </span>
            </div>

            <h4 className="font-semibold text-neutral-900 text-body">{t.title}</h4>
            <div className="flex items-center justify-between text-caption text-neutral-500 pt-2 border-t border-neutral-100 font-medium">
              <span>{t.date}</span>
              <span className="font-semibold text-neutral-800">{t.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
