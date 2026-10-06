'use client';

import React from 'react';
import { MessageSquare, Search, Send, User } from 'lucide-react';

export default function CoHostGlobalMessagesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-overline font-semibold uppercase tracking-wider text-rose-600">
            Co-Host Messaging
          </span>
          <h1 className="text-h2 font-bold text-neutral-900 tracking-tight flex items-center gap-2 mt-0.5">
            <MessageSquare className="w-6 h-6 text-rose-600" /> Guest Inbox & Messages
          </h1>
          <p className="text-body-sm text-neutral-500 mt-1">
            Communicate directly with engaged guests across all your managed properties.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[500px] overflow-hidden">
        {/* INBOX THREADS LIST */}
        <div className="border-r border-neutral-200 p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-caption font-medium outline-none"
            />
          </div>

          <div className="space-y-2">
            {[
              { name: 'Rohan Mehta', prop: 'Sunset Villa', msg: 'Is late check-in available tonight?', time: '10:42 AM', unread: true },
              { name: 'Ananya Singh', prop: 'City Apartment', msg: 'Thank you for sending the WiFi code!', time: 'Yesterday', unread: false },
              { name: 'Vikram Das', prop: 'Mountain View Cottage', msg: 'Can we get extra towels?', time: '14 Sep', unread: false },
            ].map((t, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl border transition cursor-pointer space-y-1 ${
                  i === 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-neutral-100 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-caption text-neutral-900">{t.name}</span>
                  <span className="text-caption text-neutral-500">{t.time}</span>
                </div>
                <p className="text-caption text-neutral-500 line-clamp-1">{t.msg}</p>
                <span className="text-overline font-semibold text-rose-600 block uppercase tracking-wider">{t.prop}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className="md:col-span-2 flex flex-col justify-between p-6 bg-neutral-50/40">
          <div className="pb-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-body">
                R
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 text-body">Rohan Mehta</h4>
                <p className="text-caption text-neutral-500">Guest at <strong>Sunset Villa</strong></p>
              </div>
            </div>
          </div>

          <div className="flex-1 py-6 space-y-4 overflow-y-auto">
            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 max-w-md text-body-sm text-neutral-800 space-y-1 shadow-xs">
              <p className="font-medium">Hello! Is late check-in available tonight around 9 PM?</p>
              <span className="text-caption text-neutral-500 block text-right font-tabular">10:42 AM</span>
            </div>

            <div className="bg-rose-600 text-white p-3.5 rounded-2xl max-w-md ml-auto text-body-sm space-y-1 shadow-xs">
              <p className="font-medium">Hi Rohan! Yes, absolutely. Keys will be inside the lockbox next to the main entrance. Code is 4821.</p>
              <span className="text-caption text-rose-200 block text-right font-tabular">10:45 AM</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your message to guest..."
              className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 rounded-2xl text-body-sm font-medium outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-button font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer">
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
