'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const targetRedirect = redirectUrl || (identifier.toLowerCase().includes('cohost') ? '/co-host' : null);
      await login({ identifier, password }, targetRedirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (emailVal: string, passVal: string) => {
    setIdentifier(emailVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-neutral-200/60 border border-neutral-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-h2 sm:text-h1 font-bold text-neutral-900 tracking-tight">Welcome Back</h1>
            <p className="text-body-sm text-neutral-500 font-normal mt-2">
              Sign in to manage your bookings, listings, or admin actions
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-body-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-label font-medium text-neutral-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-caption text-neutral-600 hover:text-neutral-900 underline font-medium transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100 outline-none text-body-sm font-normal text-neutral-900 placeholder:text-neutral-400 transition"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700 focus:outline-none transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-[0.99] text-white font-semibold text-button rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* QUICK DEMO LOGINS */}
          <div className="mt-6 pt-5 border-t border-neutral-100">
            <div className="flex items-center gap-1.5 text-overline font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Quick Demo Accounts</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('guest@fairbnb.com', 'Password123!')}
                className="px-2 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 text-caption font-medium text-neutral-800 transition text-center"
              >
                Guest
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('host@fairbnb.com', 'Password123!')}
                className="px-2 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 text-caption font-medium text-neutral-800 transition text-center"
              >
                Host
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('demo.cohost@fairbnb.com', 'Password123!')}
                className="px-2 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-caption font-semibold text-rose-700 transition text-center"
              >
                Co-Host
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@fairbnb.com', 'Password123!')}
                className="px-2 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 text-caption font-medium text-neutral-800 transition text-center"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <p className="text-body-sm text-neutral-500 font-normal">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="font-semibold text-rose-600 hover:text-rose-700 underline transition">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 font-medium">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
