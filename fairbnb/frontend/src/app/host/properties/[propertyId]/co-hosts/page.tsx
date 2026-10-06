'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CoHostCard } from './components/CoHostCard';
import { InviteCoHostModal } from './components/InviteCoHostModal';
import { UserPlus, ArrowLeft, Users, ShieldAlert, Loader2, Building2, CheckCircle2, Clock, Percent } from 'lucide-react';

export default function PropertyCoHostsPage() {
  const { propertyId } = useParams();
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [coHosts, setCoHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const propData = await api.get<any>(`/properties/${propertyId}`);
      setProperty(propData);

      const coHostData = await api.get<any[]>(`/properties/${propertyId}/co-hosts`);
      setCoHosts(coHostData);
    } catch (err: any) {
      setError(err.message || 'Failed to load property co-hosts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && propertyId) {
      fetchData();
    }
  }, [isAuthenticated, propertyId]);

  const totalCount = coHosts.length;
  const activeCount = coHosts.filter((ch) => ch.status === 'ACTIVE').length;
  const pendingCount = coHosts.filter((ch) => ch.status === 'PENDING_INVITE' || ch.isInvitation).length;
  const payoutConfiguredCount = coHosts.filter((ch) => ch.payoutRules && ch.payoutRules.length > 0).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-16 space-y-8 select-none">
      {/* BREADCRUMB & TOP BAR */}
      <PageHeader
        title={property?.title || 'Property Co-Hosts'}
        subtitle="Invite trusted team members, assign granular permission packages, and manage automated revenue payout splits for this property."
        breadcrumbs={[
          { label: 'Host Dashboard', href: '/host/dashboard' },
          { label: 'Listings', href: '/host/listings' },
          { label: 'Co-Hosts' },
        ]}
        badge="Co-Host Governance"
        action={
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-2xl font-semibold transition flex items-center gap-2 text-button shadow-md hover:shadow-lg active:scale-[0.98] w-fit cursor-pointer border border-neutral-800"
          >
            <UserPlus className="w-4.5 h-4.5 text-rose-400" /> Invite Co-Host
          </button>
        }
      />

      {/* SUMMARY STATS ROW */}
      {!loading && !error && coHosts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Team"
            value={totalCount}
            icon={Users}
            variant="default"
          />

          <StatCard
            title="Active Co-Hosts"
            value={activeCount}
            icon={CheckCircle2}
            variant="emerald"
          />

          <StatCard
            title="Pending Invites"
            value={pendingCount}
            icon={Clock}
            variant="blue"
          />

          <StatCard
            title="Payout Setup"
            value={payoutConfiguredCount}
            icon={Percent}
            variant="rose"
          />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-3" />
          <p className="text-sm font-medium text-neutral-500">Loading co-host directory...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-2">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-base">Unable to Access Co-Hosts</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        </div>
      ) : coHosts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">No Co-Hosts Assigned Yet</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Invite trusted partners to manage guest bookings, calendar, cleaning schedules, and maintenance for this property.
            </p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-rose-400" /> Send First Invitation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coHosts.map((coHost) => (
            <CoHostCard key={coHost.id} coHost={coHost} onRefresh={fetchData} />
          ))}
        </div>
      )}

      {/* INVITE MODAL */}
      <InviteCoHostModal
        propertyId={propertyId as string}
        propertyTitle={property?.title || ''}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
