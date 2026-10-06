'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/PageHeader';
import { Users, Mail, Phone, Building2, ArrowRight, Loader2 } from 'lucide-react';

export default function CoHostHostsPage() {
  const { isAuthenticated } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHosts() {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const data = await api.get<any[]>('/co-host/me/properties');
        setProperties(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHosts();
  }, [isAuthenticated]);

  const hostMap = new Map<string, { host: any; properties: any[] }>();
  properties.forEach((item) => {
    const host = item.hostUser;
    if (host) {
      const existing = hostMap.get(host.id) || { host, properties: [] };
      existing.properties.push(item.property);
      hostMap.set(host.id, existing);
    }
  });

  const hostsList = Array.from(hostMap.values());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-600" /> Hosts You Work With
          </span>
        }
        subtitle="Directory of property owners who have appointed you as a co-host."
        breadcrumbs={[
          { label: 'Co-Host Workspace', href: '/co-host/bookings' },
          { label: 'Hosts Directory' },
        ]}
        badge="Host Relationships"
        actions={
          <span className="px-3.5 py-1.5 bg-rose-50 text-rose-700 text-caption font-medium rounded-full border border-rose-200 w-fit font-tabular">
            Total Hosts: {hostsList.length}
          </span>
        }
      />

      {loading ? (
        <div className="py-20 flex justify-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      ) : hostsList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center max-w-xl mx-auto space-y-2">
          <Users className="w-10 h-10 text-neutral-300 mx-auto" />
          <p className="font-semibold text-neutral-900 text-body">No Hosts Listed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hostsList.map(({ host, properties }) => (
            <div key={host.id} className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white font-bold flex items-center justify-center text-body-lg shadow-sm">
                  {host.name ? host.name.charAt(0).toUpperCase() : 'H'}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-body-lg">{host.name}</h3>
                  <p className="text-caption text-neutral-500 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-neutral-400" /> {host.email}
                  </p>
                  {host.phone && (
                    <p className="text-caption text-neutral-400 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {host.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 text-body-sm">
                <span className="font-semibold text-neutral-700 block uppercase tracking-wider text-overline">
                  Assigned Properties ({properties.length})
                </span>
                <div className="space-y-1">
                  {properties.map((p) => (
                    <div key={p.id} className="flex items-center justify-between font-medium text-neutral-800 text-body-sm">
                      <span className="truncate">{p.title}</span>
                      <span className="text-caption text-neutral-400">{p.city}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
