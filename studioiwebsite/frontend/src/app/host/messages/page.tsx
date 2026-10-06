'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, Send, Paperclip, CheckCircle2, User, 
  Calendar, Key, Clock, ShieldCheck, Sparkles
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'GUEST' | 'HOST';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  guestName: string;
  propertyTitle: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-101',
    guestName: 'Ananya Verma',
    propertyTitle: 'Lehariya KGK Realty — Cabin 402',
    lastMessage: 'Thank you! Is early check-in available at 1:00 PM today?',
    timestamp: '11:42 AM',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'HOST', text: 'Welcome to Studio i Lehariya KGK Realty! Here is your digital keycard access code: 8841.', timestamp: '10:00 AM' },
      { id: 'm2', sender: 'GUEST', text: 'Thank you! Is early check-in available at 1:00 PM today?', timestamp: '11:42 AM' },
    ],
  },
  {
    id: 'conv-102',
    guestName: 'Vikram Singh',
    propertyTitle: 'Horizon Tower — Executive Dedicated Desk #12',
    lastMessage: 'Got it, looking forward to working from Horizon Tower.',
    timestamp: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm3', sender: 'GUEST', text: 'Hi, does the desk come with 4K HDMI monitor casting?', timestamp: 'Yesterday' },
      { id: 'm4', sender: 'HOST', text: 'Yes! All Executive Dedicated Desks include 27-inch 4K USB-C monitors and high-speed Wi-Fi.', timestamp: 'Yesterday' },
    ],
  },
];

export default function GuestMessagingHubPage() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-101');
  const [inputText, setInputText] = useState('');

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'HOST',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: newMsg.text,
          messages: [...c.messages, newMsg],
        };
      }
      return c;
    }));

    setInputText('');
  };

  const sendQuickSnippet = (snippet: string) => {
    setInputText(snippet);
  };

  return (
    <div className="space-y-6 max-w-7xl text-neutral-900">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0e4962]">Real-Time Communications</span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
          Guest Messaging & Concierge Hub
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Instant WebSocket chat feed with checked-in guests, keyless access codes, and automated check-in snippets.
        </p>
      </div>

      {/* Main Messaging Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs min-h-[580px]">
        {/* Conversations List (4 cols) */}
        <div className="lg:col-span-4 border-r border-neutral-200 p-4 space-y-3 bg-neutral-50/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-2">Active Conversations</span>
          <div className="space-y-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeConvId === c.id ? 'bg-[#edf4f7]/60 border-[#0e4962] shadow-xs' : 'bg-white border-neutral-200 hover:bg-neutral-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-neutral-900">{c.guestName}</span>
                  <span className="text-[10px] text-neutral-400">{c.timestamp}</span>
                </div>
                <div className="text-xs text-neutral-500 truncate mt-1">{c.propertyTitle}</div>
                <div className="text-xs text-neutral-700 truncate mt-2 font-medium">{c.lastMessage}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Feed Window (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6 bg-white">
          {/* Active Guest Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900">{activeConv.guestName}</h2>
              <p className="text-xs text-neutral-500">{activeConv.propertyTitle}</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
              Checked-In Guest
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[380px] px-2">
            {activeConv.messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-md ${m.sender === 'HOST' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'HOST' ? 'bg-[#0e4962] text-white rounded-br-none shadow-xs font-medium' : 'bg-neutral-100 text-neutral-800 rounded-bl-none border border-neutral-200'
                }`}>
                  {m.text}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Snippets & Input Bar */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            {/* Automated Snippets */}
            <div className="flex gap-2 overflow-x-auto text-[11px]">
              <button
                type="button"
                onClick={() => sendQuickSnippet('Welcome! Your digital keycard access code is 8841.')}
                className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 rounded-lg whitespace-nowrap cursor-pointer"
              >
                + Send Access Code
              </button>
              <button
                type="button"
                onClick={() => sendQuickSnippet('Wi-Fi Network: StudioI_Premium (Pass: WorkAtStudioI2026)')}
                className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 rounded-lg whitespace-nowrap cursor-pointer"
              >
                + Send Wi-Fi Details
              </button>
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message to guest..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#0e4962] focus:bg-white"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
