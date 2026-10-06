'use client';

import React from 'react';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';

function Section({
  number,
  title,
  content,
}: {
  number: string;
  title: string;
  content: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[40px_1fr] gap-4 items-start">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0e4962]/10 text-[#0e4962] text-sm font-bold shrink-0 mt-1">
        {number}
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 leading-relaxed text-sm md:text-base font-light">
          {content}
        </p>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <AirbnbHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20">
        <div className="space-y-4 mb-16 border-b border-gray-200 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-lg font-light">
            Your privacy is important to us. This policy outlines how we handle your data.
          </p>
        </div>

        <div className="space-y-12">
          <Section
            number="1"
            title="Collection of Personal Information"
            content="Fair Stay collects personal information from users to facilitate bookings and payments. Information collected may include name, email, phone number, address, and payment details."
          />

          <Section
            number="2"
            title="Use of Personal Information"
            content="Personal information is used exclusively for booking confirmations, payment processing via Cashfree, customer support, and internal analytics. Fair Stay does not sell or share personal data with third parties, except as required by law or to facilitate payment processing through Cashfree."
          />

          <Section
            number="3"
            title="Data Security"
            content="Fair Stay implements industry-standard security measures to protect user data. While all reasonable steps are taken, Fair Stay cannot guarantee absolute security, particularly concerning third-party services like Cashfree."
          />

          <Section
            number="4"
            title="Third-Party Services"
            content="Transactions on Fair Stay involve third-party payment processors like Cashfree, whose privacy policies apply to data shared during transactions. Users are encouraged to review Cashfree’s privacy policy."
          />

          <Section
            number="5"
            title="Access and Control of Personal Information"
            content="Users have the right to review, modify, or request deletion of their personal information by contacting Fair Stay customer support."
          />

          <Section
            number="6"
            title="Changes to Privacy Policy"
            content="Fair Stay reserves the right to update this privacy policy. Users will be notified of significant changes, and continued use of the platform signifies acceptance of the revised terms."
          />

          <div className="mt-16 p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center">
            <p className="text-sm font-medium text-gray-500 italic">
              By using Fair Stay, users explicitly acknowledge understanding and agreeing to this Privacy Policy.
            </p>
          </div>
        </div>
      </main>
      <AirbnbFooter />
    </div>
  );
}
