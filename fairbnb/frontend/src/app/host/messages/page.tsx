'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { GuestReplyDraftWidget } from '@/features/ai/components/GuestReplyDraftWidget';
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Sparkles,
  Building,
  RefreshCw,
  Search,
} from 'lucide-react';

interface ChatThread {
  otherUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
  property?: {
    id: string;
    title: string;
  } | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  propertyId?: string | null;
}

export default function HostMessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadThreads = async () => {
    try {
      setLoadingThreads(true);
      const data = await api.get<ChatThread[]>('/chat/threads');
      setThreads(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && !selectedThread) {
        setSelectedThread(data[0]);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      setLoadingMessages(true);
      const data = await api.get<ChatMessage[]>(`/chat/user/${otherUserId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread?.otherUser?.id) {
      loadMessages(selectedThread.otherUser.id);
    }
  }, [selectedThread?.otherUser?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedThread || sending) return;

    try {
      setSending(true);
      const payload = {
        receiverId: selectedThread.otherUser.id,
        content: messageInput.trim(),
        propertyId: selectedThread.property?.id,
      };
      await api.post('/chat/send', payload);
      setMessageInput('');
      await loadMessages(selectedThread.otherUser.id);
      loadThreads();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Host Inbox & Messages</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Communicate with guests and respond with assisted AI reply drafts.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[750px]">
        {/* Left: Threads Sidebar */}
        <div className="w-full md:w-80 border-r border-neutral-200 flex flex-col">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-sm font-bold text-neutral-800">Conversations</span>
            <button
              onClick={loadThreads}
              className="p-1 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 border-b border-neutral-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search guest or listing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {loadingThreads ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading conversations...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">No conversations found.</div>
            ) : (
              filteredThreads.map((t) => (
                <button
                  key={t.otherUser.id}
                  onClick={() => setSelectedThread(t)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                    selectedThread?.otherUser.id === t.otherUser.id
                      ? 'bg-[#edf4f7] border-l-4 border-[#0e4962]'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 shrink-0 font-bold text-xs">
                    {t.otherUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 truncate">{t.otherUser.name}</span>
                      {t.unreadCount > 0 && (
                        <span className="bg-[#0e4962] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    {t.property && (
                      <span className="text-[11px] text-[#0e4962] flex items-center gap-1 truncate font-medium">
                        <Building className="w-2.5 h-2.5 shrink-0" /> {t.property.title}
                      </span>
                    )}
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">{t.lastMessage.content}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div className="flex-1 flex flex-col h-full bg-neutral-50/40">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 bg-white border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">{selectedThread.otherUser.name}</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-semibold">
                      {selectedThread.otherUser.role}
                    </span>
                  </div>
                  {selectedThread.property && (
                    <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-[#0e4962]" />
                      <span>{selectedThread.property.title}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center py-12 text-xs text-neutral-400">Loading message thread...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-400">No messages yet. Send a greeting to start.</div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-[#0e4962] text-white rounded-br-xs'
                              : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <span
                            className={`text-[9px] block text-right mt-1 ${
                              isMe ? 'text-white/70' : 'text-neutral-400'
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* AI Draft Widget Container (mounted above input) */}
              {selectedThread.property?.id && (
                <div className="p-3 bg-white border-t border-neutral-200">
                  <GuestReplyDraftWidget
                    propertyId={selectedThread.property.id}
                    guestUserId={selectedThread.otherUser.id}
                    onApplyDraft={(draft) => setMessageInput(draft)}
                  />
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-neutral-200 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message to guest..."
                  className="flex-1 px-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e4962]"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="px-4 py-2 bg-[#0e4962] hover:bg-[#093447] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400">
              <MessageSquare className="w-10 h-10 mb-2 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-600">No conversation selected</p>
              <p className="text-xs text-neutral-400 mt-1">Select an inquiry from the sidebar to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
