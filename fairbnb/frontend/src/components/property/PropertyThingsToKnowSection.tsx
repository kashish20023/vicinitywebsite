'use client';

import React from 'react';

interface PropertyThingsToKnowSectionProps {
  maxGuests: number;
  cancellationPolicy: string;
}

export function PropertyThingsToKnowSection({
  maxGuests,
  cancellationPolicy,
}: PropertyThingsToKnowSectionProps) {
  return (
    <div className="py-8 border-b border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-5">Things to know</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
        {/* House Rules Column */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 text-base">House Rules</h4>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong className="font-medium text-gray-900">Check-in:</strong> &nbsp;14:00
            </p>
            <p>
              <strong className="font-medium text-gray-900">Check-out:</strong> &nbsp;11:00
            </p>
            <p>
              <strong className="font-medium text-gray-900">Guests:</strong> &nbsp;{maxGuests} max
            </p>
          </div>
        </div>

        {/* Cancellation Policy Column */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 text-base">Cancellation Policy</h4>
          <div className="space-y-2 text-gray-700">
            <p className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900">
                {cancellationPolicy === 'STRICT'
                  ? 'Strict'
                  : cancellationPolicy === 'MODERATE'
                    ? 'Moderate'
                    : 'Flexible'}
              </span>
              <button
                onClick={() => alert('Cancellation Details: Full refund if cancelled 24 hours prior to check-in.')}
                className="underline text-gray-800 hover:text-black text-xs font-semibold ml-1"
              >
                Details
              </button>
            </p>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Full refund if cancelled at least 24 hours before check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
