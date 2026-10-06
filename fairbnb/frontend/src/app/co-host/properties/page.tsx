'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import PropertyCard from '@/components/co-host/PropertyCard';
import {
  Building2,
  Search,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function CoHostPropertiesPage() {
  const { user, isAuthenticated } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>('/co-host/me/properties');
      const list = Array.isArray(data) ? data : (data as any).items || [];
      setProperties(list);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProperties();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const filteredProperties = properties.filter((item) => {
    const title = item.property?.title || '';
    const city = item.property?.city || '';
    const hostName = item.hostUser?.name || '';
    const query = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(query) ||
      city.toLowerCase().includes(query) ||
      hostName.toLowerCase().includes(query)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProperties.length / pageSize) || 1;
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const firstName = user?.name ? user.name.split(' ')[0] : 'Co-Host';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* TOP WELCOME BAR & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight">
            Managed Properties
          </h1>
          <p className="text-body text-neutral-500 mt-1">
            Properties you're co-hosting across different property owners.
          </p>
        </div>

        {/* METRIC CHIPS */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neutral-400" />
            <div>
              <span className="text-overline text-neutral-400 font-semibold uppercase block leading-none">Total Managed</span>
              <span className="text-body font-bold font-tabular text-neutral-900 leading-tight">{properties.length}</span>
            </div>
          </div>

          <div className="px-4 py-2 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-overline text-neutral-400 font-semibold uppercase block leading-none">Active Bookings</span>
              <span className="text-body font-bold font-tabular text-neutral-900 leading-tight">
                {properties.reduce((acc, p) => acc + (p.property?.bookings?.length || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Your Listings ({filteredProperties.length})</h3>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search properties or hosts..."
            className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-body-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none w-48 sm:w-64"
          />
        </div>
      </div>

      {/* PROPERTIES GRID */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-3" />
          <p className="text-sm font-medium text-neutral-500">Loading managed properties...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center space-y-2">
          <Building2 className="w-10 h-10 text-neutral-300 mx-auto" />
          <p className="font-bold text-neutral-900 text-sm">No properties found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProperties.map((item) => (
              <PropertyCard key={item.relationshipId} relationship={item} />
            ))}
          </div>

          {/* PAGINATION CONTROL BAR */}
          {totalPages > 1 && (
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-500">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredProperties.length)} of {filteredProperties.length} properties
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-neutral-700 font-bold rounded-xl transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="font-semibold font-tabular text-neutral-900 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-neutral-700 font-bold rounded-xl transition flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
