'use client';

import React, { useState } from 'react';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';
import {
  Building2,
  MapPin,
  Phone,
  UserCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    website_url: '', // Honeypot field
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        setFormData({
          name: '',
          email: '',
          phone: '',
          reason: '',
          website_url: '',
        });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Something went wrong',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to send message. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot Field - Hidden but accessible to bots */}
      <input
        type="text"
        id="website_url"
        value={formData.website_url}
        onChange={handleChange}
        style={{
          opacity: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          height: 0,
          width: 0,
          zIndex: -1,
        }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700 block">
          Name<span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="Name"
          required
          className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-[#0e4962] focus:ring-1 focus:ring-[#0e4962] transition"
          value={formData.name}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
            Email<span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            required
            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-[#0e4962] focus:ring-1 focus:ring-[#0e4962] transition"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700 block">
            Phone Number<span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="Phone Number"
            required
            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-[#0e4962] focus:ring-1 focus:ring-[#0e4962] transition"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium text-gray-700 block">
          Reason for Contacting<span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          placeholder="Reason for Contacting"
          className="w-full min-h-[120px] p-4 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-[#0e4962] focus:ring-1 focus:ring-[#0e4962] transition resize-none"
          required
          value={formData.reason}
          onChange={handleChange}
        />
      </div>

      {status && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-red-50 border border-red-200 text-red-800'
            }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 text-base font-semibold bg-[#0e4962] hover:bg-[#093447] text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          'Submit'
        )}
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <AirbnbHeader />
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Left Column: Info */}
          <div className="space-y-8 animate-in slide-in-from-left duration-500">
            <div>
              <h1 className="text-2xl font-bold mb-3 text-[#0e4962]">
                Get in Touch
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ready to let your property work for you? Contact us today to
                discuss how we can handle your property while you savour the
                returns.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                  <UserCheck className="w-5 h-5 text-[#0e4962]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Fair Stay Ventures Private Limited
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Company Name</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                  <Phone className="w-5 h-5 text-[#0e4962]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    +91 7877956653
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Direct Line</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                  <MapPin className="w-5 h-5 text-[#0e4962]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Registered Office
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    A 19, ANAND VIHAR, RAILWAY COLONY, TODI RAM JANIPURA,
                    JAGATPURA, JAIPUR , Pin 302017
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                  <Building2 className="w-5 h-5 text-[#0e4962]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Corporate Office
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    4/16, Shivanand Marg, Vidyut Abhiyanta Colony, Sector 4,
                    Malviya Nagar, Jaipur, 302017, Rajasthan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs animate-in slide-in-from-right duration-500">
            <ContactForm />
          </div>
        </div>
      </main>
      <AirbnbFooter />

      {/* Floating Scroll to Top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-transform hover:-translate-y-1"
        aria-label="Scroll to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-gray-800"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
