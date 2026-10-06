'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiRequest } from '@/lib/api';
import { 
  ShieldCheck, MapPin, Calendar, Clock, Wifi, 
  CheckCircle2, ArrowRight, Download, Share2, 
  Building, RefreshCw, AlertCircle, Sparkles, QrCode
} from 'lucide-react';

export default function DigitalPassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const [passData, setPassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check-in simulator state
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);

  const fetchPass = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any>(`/access/pass/${bookingId}`);
      setPassData(data);
    } catch (err: any) {
      setError(err.message || 'Could not load your digital coworking pass');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPass();
  }, [bookingId]);

  const handleSimulateCheckIn = async () => {
    if (!passData?.passToken) return;
    try {
      setCheckingIn(true);
      setCheckInSuccess(null);
      const res = await apiRequest<any>('/access/checkin', {
        method: 'POST',
        body: JSON.stringify({ passToken: passData.passToken }),
      });
      setCheckInSuccess(`Check-in verified at ${new Date(res.checkedInAt).toLocaleTimeString('en-IN')}`);
      fetchPass();
    } catch (err: any) {
      setError(err.message || 'Check-in validation failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSimulateCheckOut = async () => {
    if (!passData?.passToken) return;
    try {
      setCheckingIn(true);
      setCheckInSuccess(null);
      const res = await apiRequest<any>('/access/checkout', {
        method: 'POST',
        body: JSON.stringify({ passToken: passData.passToken }),
      });
      setCheckInSuccess(`Check-out verified at ${new Date(res.checkedOutAt).toLocaleTimeString('en-IN')}`);
      fetchPass();
    } catch (err: any) {
      setError(err.message || 'Check-out validation failed');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#0e4962] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-gray-700">Generating Secure Digital Coworking Pass...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pass Unavailable</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">{error || 'Unable to locate digital pass.'}</p>
          <Link href="/my-bookings" className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full">
            View My Bookings
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const booking = passData.booking;
  const primaryItem = booking.bookingItems?.[0];
  const unit = primaryItem?.unit;
  const workspace = booking.workspace;
  const activeSession = passData.accessSessions?.find((s: any) => !s.checkedOutAt);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#0e4962] selection:text-white">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12 flex-1 w-full flex flex-col items-center">
        {/* Pass Card Container */}
        <div className="w-full bg-linear-to-b from-[#171717] to-[#121212] rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden relative">
          {/* Header Banner */}
          <div className="p-6 bg-[#0e4962] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 block">
                  Digital Coworking Pass
                </span>
                <h2 className="text-lg font-black tracking-tight leading-tight">Studio i Access Pass</h2>
              </div>
            </div>

            <span className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              {passData.status}
            </span>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Campus & Unit Highlights */}
            <div className="flex justify-between items-start border-b border-neutral-800 pb-6">
              <div>
                <p className="text-xs text-neutral-400 font-medium">Campus & Location</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{workspace.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0e4962] shrink-0" />
                  <span>{workspace.address}, {workspace.city}</span>
                </p>
              </div>

              <div className="text-right bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800 shrink-0">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Reserved Seat</span>
                <span className="text-xl font-black text-[#0e4962] tracking-wider block">
                  {unit?.unitCode}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {unit?.floor?.name || '1st Floor'}
                </span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
              <div className="w-48 h-48 bg-neutral-100 rounded-xl p-3 border-2 border-neutral-200 flex items-center justify-center">
                {/* SVG QR Code Simulation with distinct pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corner markers */}
                  <rect x="5" y="5" width="26" height="26" fill="black" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" fill="black" />

                  <rect x="69" y="5" width="26" height="26" fill="black" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" fill="black" />

                  <rect x="5" y="69" width="26" height="26" fill="black" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" fill="black" />

                  {/* QR Interior grid patterns based on token */}
                  <rect x="36" y="10" width="8" height="8" fill="black" />
                  <rect x="48" y="14" width="14" height="6" fill="black" />
                  <rect x="38" y="24" width="6" height="16" fill="black" />
                  <rect x="50" y="26" width="12" height="12" fill="black" />
                  <rect x="12" y="38" width="14" height="6" fill="black" />
                  <rect x="16" y="48" width="12" height="12" fill="black" />
                  <rect x="72" y="38" width="14" height="14" fill="black" />
                  <rect x="40" y="48" width="20" height="8" fill="black" />
                  <rect x="36" y="66" width="14" height="14" fill="black" />
                  <rect x="56" y="62" width="10" height="16" fill="black" />
                  <rect x="72" y="70" width="18" height="8" fill="black" />
                  <rect x="78" y="82" width="12" height="10" fill="black" />
                </svg>
              </div>

              <div>
                <p className="font-mono text-[11px] font-bold text-gray-900 tracking-wider">
                  {passData.passToken}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Scan at front desk turnstile or show to Studio i host
                </p>
              </div>
            </div>

            {/* Wi-Fi & Schedule Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5 mb-1">
                  <Wifi className="w-3.5 h-3.5 text-[#0e4962]" />
                  Member Wi-Fi
                </span>
                <span className="font-mono font-bold text-white block">StudioI_Guest</span>
                <span className="text-[10px] text-neutral-400 font-mono">Pass: Inspire@2026</span>
              </div>

              <div className="bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0e4962]" />
                  Valid Schedule
                </span>
                <span className="font-bold text-white block">
                  {new Date(passData.validFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {new Date(passData.validFrom).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(passData.validTo).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Check-In / Check-Out Actions */}
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              {checkInSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{checkInSuccess}</span>
                </div>
              )}

              {activeSession ? (
                <button
                  onClick={handleSimulateCheckOut}
                  disabled={checkingIn}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {checkingIn ? 'Verifying Exit...' : 'Simulate Reception Check-Out'}
                </button>
              ) : (
                <button
                  onClick={handleSimulateCheckIn}
                  disabled={checkingIn}
                  className="w-full py-3 bg-[#0e4962] hover:bg-[#093447] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {checkingIn ? 'Verifying Entry...' : 'Simulate Reception QR Check-In'}
                </button>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Booking #{booking.bookingNumber}</span>
            <Link href="/my-bookings" className="text-[#0e4962] hover:underline font-semibold flex items-center gap-1">
              View in My Bookings
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
