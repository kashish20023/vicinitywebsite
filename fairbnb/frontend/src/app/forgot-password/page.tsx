'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const payload = { email: identifier.trim() };

      const res = await api.post<{ message: string; resetToken?: string; devResetToken?: string }>('/auth/forgot-password', payload);
      setMessage(res.message);
      const token = res.resetToken || (res as any).devResetToken;
      if (token) {
        setResetToken(token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-neutral-200/60 border border-neutral-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-h2 sm:text-h1 font-bold text-neutral-900 tracking-tight">Forgot Password</h1>
            <p className="text-body-sm text-neutral-500 font-normal mt-2">
              Enter your email or phone number to receive a password reset token
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-body-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2 text-emerald-800 text-body-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span className="font-medium">{message}</span>
              </div>
              {resetToken && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 font-mono text-caption break-all">
                  <p className="text-neutral-500 mb-1 font-sans">Reset Token (for demo/testing):</p>
                  <strong className="text-emerald-700">{resetToken}</strong>
                  <div className="mt-2.5">
                    <Link
                      href={`/reset-password?token=${resetToken}`}
                      className="inline-flex items-center gap-1 text-caption font-semibold text-rose-600 hover:text-rose-700 underline font-sans"
                    >
                      Click here to reset password <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label font-medium text-neutral-700 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@fairbnb.com or 9999999999"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100 outline-none text-body-sm font-normal text-neutral-900 placeholder:text-neutral-400 transition"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-[0.99] text-white font-semibold text-button rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-neutral-700 hover:text-neutral-950 underline transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
