'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { MessageSquare, ShieldAlert } from 'lucide-react';

export default function CoHostMessagesPage() {
  const { propertyId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await api.get<any>(`/co-host/properties/${propertyId}/messages`);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Access denied: Requires MESSAGE_GUESTS permission.');
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [propertyId]);

  if (loading) return <div className="p-8 text-neutral-400">Loading messages...</div>;
  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-2 max-w-md mx-auto">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <p className="font-bold text-rose-900 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-600" /> Guest Inbox & Messaging
        </h2>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
          Access Granted: MESSAGE_GUESTS
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-neutral-900 text-base font-mono">Guest Messaging Stream Active</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          Connected to backend API route <code className="font-mono">GET /co-host/properties/:id/messages</code>.
        </p>
      </div>
    </div>
  );
}
