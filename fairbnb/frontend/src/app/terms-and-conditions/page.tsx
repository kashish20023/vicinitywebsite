'use client';

import React from 'react';
import { AirbnbHeader } from '@/components/layout/AirbnbHeader';
import { AirbnbFooter } from '@/components/layout/AirbnbFooter';

function RuleItem({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-3 font-bold text-lg text-foreground">

        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0e4962]/10 text-[#0e4962] text-sm font-bold">
          {number}
        </span>
        {title}
      </h3>
      <div className="text-sm text-gray-600 pl-11 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <AirbnbHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20">
        <div className="space-y-4 mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 text-lg">
            Please read these terms carefully before using our platform.
          </p>
        </div>

        <div className="space-y-12">
          {/* Payment & Platform Terms */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#0e4962] border-b border-gray-200 pb-2">
              Payment Processing &amp; Policies
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-lg">
                  Payment Processing
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  All transactions conducted through Fair Stay are processed via
                  a secure third-party payment gateway. By initiating a
                  booking, users consent to the payment gateway’s terms of
                  service and privacy policy. Fair Stay shall not be held
                  liable for any technical failures, transactional errors, or
                  other issues caused directly by the payment gateway.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-lg">
                  Transaction Security
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The third-party payment gateway employed by Fair Stay
                  incorporates robust security features including encryption
                  protocols, fraud prevention mechanisms, and PCI-DSS
                  compliance. While Fair Stay ensures the secure handling of
                  payment data, any security breach or data lapse attributable
                  to the payment gateway is outside Fair Stay’s liability.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-lg">
                  Payment Confirmation and Receipt
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Upon successful payment, users will receive an automated
                  confirmation email from Fair Stay. Any errors or concerns
                  regarding the transaction must be reported within 24 hours.
                  It is recommended that users retain the payment gateway’s
                  receipt for reference and dispute resolution.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-lg">
                  Cancellation and Refund Policy
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  All cancellations and refunds are governed by Fair Stay refund
                  policy. Approved refunds will be processed to the original
                  payment method via the third-party payment gateway within
                  7–14 business days. Processing durations are subject to the
                  policies of both the payment gateway and the user’s bank.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl space-y-4 mt-6">
              <h3 className="font-medium text-gray-900 text-base">
                Additional Financial Terms
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                <li>
                  <strong>Dispute Resolution:</strong> In the event of any
                  transaction-related disputes, users must first notify Fair
                  Stay. Fair Stay will collaborate with the payment gateway to
                  facilitate resolution.
                </li>
                <li>
                  <strong>Fees and Charges:</strong> Additional fees or
                  transaction charges may be applied by the third-party payment
                  gateway, which will be transparently disclosed at checkout.
                </li>
                <li>
                  <strong>User Responsibilities:</strong> Users are responsible
                  for ensuring the accuracy of all payment and booking details
                  submitted during the transaction. Fair Stay will not be
                  liable for losses resulting from user-provided inaccuracies.
                </li>
              </ul>
            </div>
          </section>

          {/* Liability & General Terms */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#0e4962] border-b border-gray-200 pb-2">
              Liability &amp; Usage
            </h2>
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <p>
                <strong>Limitation of Liability – Payment Gateway:</strong> Fair
                Stay’s liability with respect to payment processing is strictly
                limited to facilitating communications and support between the
                user and the third-party payment gateway. Fair Stay shall not
                be liable for any indirect, incidental, or consequential
                damages arising from payment-related issues.
              </p>
              <p>
                <strong>Shared Property Bookings:</strong> Certain listings on
                Fair Stay offer shared accommodations. Availability, pricing,
                and terms of such bookings may vary based on the selected
                configuration. Users are advised to review specific terms
                associated with each unit before confirming a booking.
              </p>
            </div>
          </section>

          {/* Termination & Amendments */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#0e4962] border-b border-gray-200 pb-2">
              Account &amp; Legal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 leading-relaxed">
              <div>
                <strong className="block text-gray-900 mb-1">
                  Termination of Use
                </strong>
                Fair Stay reserves the right to terminate any user’s account or
                access to the platform at its sole discretion, without prior
                notice, for violations of Terms, abusive behavior, or
                fraudulent activities.
              </div>
              <div>
                <strong className="block text-gray-900 mb-1">
                  Amendments to Terms
                </strong>
                Fair Stay reserves the right to update or modify these Terms and
                Conditions at any time. Substantial changes will be
                communicated to users and will take effect immediately upon
                publication.
              </div>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
              <strong className="text-gray-900">
                Governing Law and Jurisdiction:
              </strong>{' '}
              These Terms and Conditions shall be governed in accordance with
              the laws of India. Any disputes shall fall under the exclusive
              jurisdiction of the courts of Jaipur, Rajasthan.
            </div>
            <p className="text-center italic text-gray-500 text-sm mt-4">
              By accessing and transacting on Fair Stay, users explicitly
              acknowledge that they have read, understood, and agreed to all of
              the above Terms and Conditions.
            </p>
          </section>

          {/* Guest Rules Section */}
          <section className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8 uppercase tracking-wider">
              Rules and Regulations for Guests
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
              <RuleItem number="1" title="Check-in / Check-out">
                <ul className="list-disc list-inside space-y-1">
                  <li>Check-in Time: 2:00 PM</li>
                  <li>Check-out Time: 11:00 AM</li>
                  <li>
                    All Guests must present a valid Government-issued ID &amp;
                    Address Proof (Passport, Driving License, Aadhaar Card, or
                    Voter ID).
                  </li>
                  <li>
                    For Non-Indian Nationals, each Guest must carry a passport
                    with a valid Indian visa.
                  </li>
                </ul>
              </RuleItem>
              <RuleItem number="2" title="Security Deposit">
                A refundable security deposit is payable prior to check-in. It
                may be adjusted against extra guests, chargeable amenities,
                damages, or food services.
              </RuleItem>
              <RuleItem number="3" title="Property Care & Conduct">
                Guests shall ensure no damage is caused to the villa, interiors,
                or fittings. Any damage or loss will be chargeable in full.
                Guests must comply with House Rules.
              </RuleItem>
              <RuleItem number="4" title="Caretaker Services">
                A caretaker is available for basic cleaning and assistance.
                Continuous, round-the-clock service is not guaranteed.
              </RuleItem>
              <RuleItem number="5" title="Occupancy Limit">
                The number of staying Guests must not exceed the number agreed
                upon at the time of booking.
              </RuleItem>
              <RuleItem number="6" title="Visitors & Outsiders">
                Non-registered visitors are not permitted without prior written
                approval from Fair Stay Ventures.
              </RuleItem>
              <RuleItem number="7" title="Safety & Prohibitions">
                Carrying flammable, explosive, or illegal substances is
                prohibited. Caution advised during monsoons (slippery surfaces)
                and for insects/animals in nature locations.
              </RuleItem>
              <RuleItem number="8" title="Liability Disclaimer">
                Fair Stay Ventures, the property owner, and staff shall not be
                liable for any injury, accident, loss, theft, or disruptions
                due to power outages or acts of God.
              </RuleItem>
              <RuleItem number="9" title="Swimming Pool (If Applicable)">
                <ul className="list-disc list-inside space-y-1">
                  <li>Timings: 10:00 AM – 8:00 PM.</li>
                  <li>
                    Proper swimwear is mandatory. No food/drinks near pool.
                  </li>
                  <li>
                    No lifeguard provided. Usage is entirely at Guests’ own
                    risk.
                  </li>
                </ul>
              </RuleItem>
              <RuleItem number="10" title="Electricity & Utilities">
                The property may experience intermittent power cuts/load
                shedding. Guests are expected to cooperate.
              </RuleItem>
            </div>

            <div className="mt-12 p-8 border-2 border-dashed border-gray-300 rounded-2xl text-gray-900">
              <h3 className="text-xl font-bold mb-4 text-center">
                Acknowledgement &amp; Indemnity
              </h3>
              <p className="mb-6 text-center text-gray-500 text-sm">
                (Digital Representation of Check-in Agreement)
              </p>
              <p className="mb-4 text-sm leading-relaxed font-medium">
                I, on behalf of all Guests, hereby confirm that we:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 text-sm text-gray-600">
                <li>Have read and agreed to these terms &amp; conditions.</li>
                <li>
                  Shall jointly and severally indemnify and hold harmless Fair
                  Stay Ventures, the property owner, and staff against all
                  third-party claims, damages, or expenses arising from our
                  stay.
                </li>
                <li>
                  Accept that violation of rules may result in penalties,
                  eviction, or cancellation without refund.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      <AirbnbFooter />
    </div>
  );
}
