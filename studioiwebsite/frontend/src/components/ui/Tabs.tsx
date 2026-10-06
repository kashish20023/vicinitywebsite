'use client';
import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({
  tabs,
  defaultTabId,
  className = '',
}: {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultTabId || tabs[0]?.id);

  return (
    <div className={`w-full ${className}`}>
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-3.5 px-1 border-b-2 font-bold text-xs sm:text-sm transition-colors cursor-pointer
                  ${isActive
                    ? 'border-[#0e4962] text-[#0e4962]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'}
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="py-6">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
