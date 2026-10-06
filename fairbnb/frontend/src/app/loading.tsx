import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-neutral-100 border-t-[#0e4962] animate-spin" />
        <Loader2 className="w-5 h-5 text-[#0e4962] absolute" />
      </div>
      <p className="text-body-sm font-medium text-neutral-500 animate-pulse">
        Loading Fairbnb...
      </p>
    </div>
  );
}
