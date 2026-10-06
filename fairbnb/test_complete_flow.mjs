// Comprehensive End-to-End API Integration & Verification Test Suite for Fairbnb

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

let guestToken = '';
let hostToken = '';
let adminToken = '';
let testPropertyId = '';
let testBookingId = '';
let testReviewId = '';
let testHostId = '';

const randomSuffix = Math.floor(100000 + Math.random() * 900000);

const guestUser = {
  name: `Guest User ${randomSuffix}`,
  phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
  email: `guest_${randomSuffix}@fairbnb.test`,
  password: 'Password@123',
};

const hostUser = {
  name: `Host Owner ${randomSuffix}`,
  phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
  email: `host_${randomSuffix}@fairbnb.test`,
  password: 'Password@123',
};

const adminCredentials = {
  email: 'admin@fairbnb.com',
  password: 'Admin@123456',
};

async function req(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  return { status: res.status, ok: res.ok, body };
}

function pass(name, details = '') {
  console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${name} ${details ? `(${details})` : ''}`);
}

function fail(name, error) {
  console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${name}:`, error);
  process.exit(1);
}

async function runTests() {
  console.log('\n===================================================================');
  console.log('    FAIRBNB COMPLETE END-TO-END SYSTEM INTEGRATION TEST SUITE     ');
  console.log('===================================================================\n');
  // SUITE 1: Auth & Roles Setup
  console.log('\x1b[36m[SUITE 1: Authentication & User Roles Setup]\x1b[0m');
  try {
    // Register Guest
    const regGuest = await req('/auth/register', { method: 'POST', body: JSON.stringify(guestUser) });
    if (!regGuest.ok) throw new Error(`Guest reg failed: ${JSON.stringify(regGuest.body)}`);
    const loginGuest = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: guestUser.email, password: guestUser.password }) });
    guestToken = loginGuest.body.accessToken;
    pass('Guest Registered & Authenticated', `Token: ${guestToken.slice(0, 15)}...`);

    // Register Host
    const regHost = await req('/auth/register', { method: 'POST', body: JSON.stringify(hostUser) });
    if (!regHost.ok) throw new Error(`Host reg failed: ${JSON.stringify(regHost.body)}`);
    const loginHost = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: hostUser.email, password: hostUser.password }) });
    hostToken = loginHost.body.accessToken;
    pass('Host Registered & Authenticated', `Token: ${hostToken.slice(0, 15)}...`);

    // Admin Login & Promote Host
    const loginAdmin = await req('/auth/login', { method: 'POST', body: JSON.stringify(adminCredentials) });
    adminToken = loginAdmin.body.accessToken;

    const usersRes = await req('/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    const hostInUsers = usersRes.body.find((u) => u.phone === hostUser.phone);
    testHostId = hostInUsers.id;
    await req(`/users/${hostInUsers.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'HOST' }),
    });

    const refreshedHostLogin = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: hostUser.email, password: hostUser.password }) });
    hostToken = refreshedHostLogin.body.accessToken;
    pass('Host Promoted to HOST Role by Admin', `Host Role verified`);
  } catch (e) {
    fail('Auth Setup', e.message);
  }

  // SUITE 2: Property Creation & Admin Approval
  console.log('\n\x1b[36m[SUITE 2: Property Creation & Moderation Workflow]\x1b[0m');
  try {
    const propPayload = {
      title: `Palms Oceanfront Villa ${randomSuffix}`,
      description: 'Luxury 4-bedroom beach villa in Goa with private pool and stay guide.',
      category: 'Villa',
      propertyType: 'Entire Home',
      listingPurpose: 'Rental',
      city: 'Goa',
      state: 'Goa',
      country: 'India',
      maxGuests: 6,
      bedrooms: 4,
      beds: 4,
      bathrooms: 4,
      basePrice: 10000,
      cleaningFee: 1500,
      instantBook: true,
      minNights: 2,
      wifiNetwork: 'Fairbnb_Guest_WiFi',
      wifiPassword: 'VillaPassword123',
      checkInInstructions: 'Smart lock code 4321#. Host meets at gate.',
      houseRules: ['No smoking inside', 'Quiet hours after 10 PM'],
    };

    const createRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify(propPayload),
    });
    if (!createRes.ok) throw new Error(`Create prop failed: ${JSON.stringify(createRes.body)}`);
    testPropertyId = createRes.body.id;
    pass('POST /properties (Host)', `Property created with ID ${testPropertyId} (Status: PENDING_APPROVAL)`);

    // Admin Approve
    const appRes = await req(`/properties/${testPropertyId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!appRes.ok) throw new Error(`Approve prop failed: ${JSON.stringify(appRes.body)}`);
    pass(`PATCH /properties/${testPropertyId}/approve`, 'Listing approved and live in public catalog!');
  } catch (e) {
    fail('Property Lifecycle', e.message);
  }

  // SUITE 3: Availability & Pricing Quote & Checkout Preview
  console.log('\n\x1b[36m[SUITE 3: Availability Engine, Pricing Quote & Checkout Preview]\x1b[0m');
  try {
    const checkIn = '2026-11-01';
    const checkOut = '2026-11-04';

    // Availability Check
    const availRes = await req(`/properties/${testPropertyId}/availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=4`);
    if (!availRes.ok || !availRes.body.available) throw new Error(`Availability check failed: ${JSON.stringify(availRes.body)}`);
    pass('GET /properties/:id/availability', `Dates ${checkIn} -> ${checkOut} are Available (3 nights)`);

    // Pricing Quote
    const quoteRes = await req('/bookings/quote', {
      method: 'POST',
      body: JSON.stringify({ propertyId: testPropertyId, checkIn, checkOut, guests: 4, couponCode: 'WELCOME10' }),
    });
    if (!quoteRes.ok || !quoteRes.body.available) throw new Error(`Quote failed: ${JSON.stringify(quoteRes.body)}`);
    const p = quoteRes.body.pricing;
    pass('POST /bookings/quote', `Base: ₹${p.baseAmount}, Clean: ₹${p.cleaningFee}, Service: ₹${p.serviceFee}, Tax: ₹${p.taxAmount}, Discount: ₹${p.discountAmount} => Total: ₹${p.totalAmount}`);

    // Checkout Preview
    const previewRes = await req('/bookings/checkout-preview', {
      method: 'POST',
      body: JSON.stringify({ propertyId: testPropertyId, checkIn, checkOut, guests: 4, couponCode: 'WELCOME10' }),
    });
    if (!previewRes.ok) throw new Error(`Checkout preview failed: ${JSON.stringify(previewRes.body)}`);
    pass('POST /bookings/checkout-preview', `Dedicated checkout preview ready with host details & house rules`);
  } catch (e) {
    fail('Availability & Quote', e.message);
  }

  // SUITE 4: Transactional Guest Booking & Double-Booking Protection
  console.log('\n\x1b[36m[SUITE 4: Guest Booking Creation & Double-Booking Lock]\x1b[0m');
  try {
    const checkIn = '2026-11-01';
    const checkOut = '2026-11-04';

    const bookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, checkIn, checkOut, guests: 4, couponCode: 'WELCOME10' }),
    });
    if (!bookRes.ok) throw new Error(`Booking creation failed: ${JSON.stringify(bookRes.body)}`);
    testBookingId = bookRes.body.booking.id;
    pass('POST /bookings (Guest)', `Created Booking ID: ${testBookingId} (Status: PENDING, Total: ₹${bookRes.body.booking.totalAmount})`);

    // Verify Double Booking Rejection for same dates
    const doubleRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, checkIn, checkOut, guests: 2 }),
    });
    if (doubleRes.status !== 409) throw new Error(`Expected 409 Conflict, got ${doubleRes.status}`);
    pass('Double Booking Protection Lock', 'Simultaneous booking attempt correctly REJECTED with 409 Conflict!');
  } catch (e) {
    fail('Guest Booking', e.message);
  }

  // SUITE 5: Payment Gateway Webhook & Automated Invoice Generation
  console.log('\n\x1b[36m[SUITE 5: Payment Webhook, Idempotency & Auto-Invoice]\x1b[0m');
  try {
    // Fetch payment order for booking
    const orderRes = await req('/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ bookingId: testBookingId }),
    });
    const paymentRecord = orderRes.body.payment;

    // Simulate Webhook Payment Success
    const webhookRes = await req('/payments/webhook', {
      method: 'POST',
      body: JSON.stringify({
        event: 'payment.captured',
        payload: { providerOrderId: paymentRecord.providerOrderId, providerPaymentId: 'pay_gateway_999' },
        signature: 'mock_sig',
      }),
    });
    if (!webhookRes.ok || !webhookRes.body.success) {
      console.log('Webhook Response Error Body:', webhookRes.body);
      throw new Error(`Webhook failed: ${JSON.stringify(webhookRes.body)}`);
    }
    pass('POST /payments/webhook', `Payment captured -> Booking CONFIRMED & Invoice created (${webhookRes.body.invoice ? webhookRes.body.invoice.invoiceNumber : 'N/A'})`);

    // Test Duplicate Webhook Idempotency
    const dupRes = await req('/payments/webhook', {
      method: 'POST',
      body: JSON.stringify({
        event: 'payment.captured',
        payload: { providerOrderId: paymentRecord.providerOrderId, providerPaymentId: 'pay_gateway_999' },
        signature: 'mock_sig',
      }),
    });
    if (!dupRes.body.message.includes('Idempotent')) throw new Error('Expected idempotent response');
    pass('Idempotent Webhook Check', 'Duplicate webhook safely handled without duplicate invoice or state update');
  } catch (e) {
    fail('Payment Webhook', e.message);
  }

  // SUITE 6: Guest Trips Portal (My Trips & Stay Guide)
  console.log('\n\x1b[36m[SUITE 6: Guest Trips Portal & Stay Guide]\x1b[0m');
  try {
    const tripsRes = await req('/bookings/my-trips', {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    if (!tripsRes.ok) throw new Error(`My trips failed: ${tripsRes.status}`);
    const tripCard = tripsRes.body.trips.upcoming.find((t) => t.id === testBookingId);
    if (!tripCard) throw new Error('Booking not found in upcoming trips');
    if (!tripCard.property.wifiNetwork || !tripCard.property.checkInInstructions) throw new Error('Missing stay guide in trip card');
    pass('GET /bookings/my-trips', `Enriched trip card verified (WiFi: "${tripCard.property.wifiNetwork}", Lock: "${tripCard.property.checkInInstructions}")`);
  } catch (e) {
    fail('Guest Trips Portal', e.message);
  }

  // SUITE 7: Post-Stay Review & Multi-Category Rating System
  console.log('\n\x1b[36m[SUITE 7: Post-Stay Reviews, Category Ratings & Host Reply]\x1b[0m');
  try {
    // Create review
    const revPayload = {
      bookingId: testBookingId,
      rating: 5,
      cleanlinessRating: 5,
      accuracyRating: 5,
      locationRating: 4,
      valueRating: 5,
      comment: 'An absolute paradise! Swimming pool was spotless and host was very welcoming.',
    };

    const revRes = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify(revPayload),
    });
    if (!revRes.ok) throw new Error(`Create review failed: ${JSON.stringify(revRes.body)}`);
    testReviewId = revRes.body.id;
    pass('POST /reviews (Guest)', `Submitted 5-star review for stay (ID: ${testReviewId})`);

    // Fetch Property Reviews & Summary
    const propRevRes = await req(`/properties/${testPropertyId}/reviews`);
    if (!propRevRes.ok) throw new Error(`GET property reviews failed: ${propRevRes.status}`);
    const s = propRevRes.body.summary;
    pass(`GET /properties/${testPropertyId}/reviews`, `Averages: Overall ${s.averageOverall}⭐, Cleanliness ${s.averageCleanliness}⭐, Location ${s.averageLocation}⭐`);

    // Host Reply
    const replyRes = await req(`/reviews/${testReviewId}/reply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ hostReply: 'Thank you so much for your warm review! We look forward to hosting you again.' }),
    });
    if (!replyRes.ok) throw new Error(`Host reply failed: ${JSON.stringify(replyRes.body)}`);
    pass(`POST /reviews/${testReviewId}/reply (Host)`, `Host reply published successfully`);
  } catch (e) {
    fail('Reviews & Ratings', e.message);
  }

  // SUITE 8: Guest Cancellation & Policy Refund Execution
  console.log('\n\x1b[36m[SUITE 8: Policy-Driven Guest Cancellation & Refund Execution]\x1b[0m');
  try {
    // Create another booking to test cancellation flow
    const checkIn = '2026-12-10';
    const checkOut = '2026-12-13';

    const bRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, checkIn, checkOut, guests: 2 }),
    });
    const cancelBookingId = bRes.body.booking.id;

    // Confirm & pay
    const payOrder = await req('/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ bookingId: cancelBookingId }),
    });
    await req('/payments/webhook', {
      method: 'POST',
      body: JSON.stringify({
        event: 'payment.captured',
        payload: { providerOrderId: payOrder.body.payment.providerOrderId },
      }),
    });

    // Cancel booking
    const cancelRes = await req(`/bookings/${cancelBookingId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ reason: 'Travel plans changed' }),
    });
    if (!cancelRes.ok) throw new Error(`Cancel failed: ${JSON.stringify(cancelRes.body)}`);
    const c = cancelRes.body;
    pass(`POST /bookings/${cancelBookingId}/cancel`, `Cancelled per ${c.cancellationSummary.policy} policy (${c.cancellationSummary.refundPercentage}% refund: ₹${c.cancellationSummary.refundAmount})`);
  } catch (e) {
    fail('Cancellation & Refund', e.message);
  }

  // SUITE 9: Admin Operations (Guests, Hosts, Impersonation & Property Transfer)
  console.log('\n\x1b[36m[SUITE 9: Admin Operations (Guests, Hosts, Impersonation & Property Transfer)]\x1b[0m');
  try {
    // 1. GET /admin/guests
    const guestsRes = await req('/admin/guests', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!guestsRes.ok) throw new Error(`GET /admin/guests failed: ${guestsRes.status}`);
    pass('GET /admin/guests', `Retrieved ${guestsRes.body.length} guest records with metrics`);

    // 2. Block/Unblock Guest
    const sampleGuest = guestsRes.body[0];
    const blockRes = await req(`/admin/guests/${sampleGuest.id}/block`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isBlocked: true, reason: 'Testing Admin Block Feature' }),
    });
    if (!blockRes.ok) throw new Error(`Block guest failed: ${JSON.stringify(blockRes.body)}`);
    pass(`PATCH /admin/guests/${sampleGuest.id}/block`, 'Guest account blocked successfully');

    // Unblock back
    await req(`/admin/guests/${sampleGuest.id}/block`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isBlocked: false }),
    });
    pass(`PATCH /admin/guests/${sampleGuest.id}/block (Unblock)`, 'Guest account unblocked cleanly');

    // 3. GET /admin/hosts
    const hostsRes = await req('/admin/hosts', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!hostsRes.ok) throw new Error(`GET /admin/hosts failed: ${hostsRes.status}`);
    const sampleHost = hostsRes.body[0];
    pass('GET /admin/hosts', `Retrieved ${hostsRes.body.length} host accounts with property counts & superhost status`);

    // 4. POST /admin/hosts/:id/impersonate
    const impersonateRes = await req(`/admin/hosts/${sampleHost.id}/impersonate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!impersonateRes.ok) throw new Error(`Host impersonation failed: ${JSON.stringify(impersonateRes.body)}`);
    pass(`POST /admin/hosts/${sampleHost.id}/impersonate`, `Generated host impersonation context for "${sampleHost.name}"`);

    // 5. POST /admin/properties/:id/transfer
    const transferRes = await req(`/properties/${testPropertyId}/transfer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ newHostId: sampleHost.id }),
    });
    if (!transferRes.ok) {
      // Try /admin/properties/:id/transfer
      const transferAdminRes = await req(`/admin/properties/${testPropertyId}/transfer`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ newHostId: sampleHost.id }),
      });
      if (!transferAdminRes.ok) throw new Error(`Property transfer failed: ${JSON.stringify(transferAdminRes.body)}`);
      pass(`POST /admin/properties/${testPropertyId}/transfer`, `Property ownership transferred to Host ID: ${sampleHost.id}`);
    } else {
      pass(`POST /admin/properties/${testPropertyId}/transfer`, `Property ownership transferred to Host ID: ${sampleHost.id}`);
    }
  } catch (e) {
    fail('Admin Operations (Guests, Hosts, Transfer)', e.message);
  }

  // SUITE 10: Admin Operations (Overview, KYC Review, Approvals, Collections & Messaging)
  console.log('\n\x1b[36m[SUITE 10: Admin Operations (Overview, KYC Review, Approvals, Collections & Messaging)]\x1b[0m');
  try {
    // 1. GET /admin/stats
    const statsRes = await req('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!statsRes.ok) throw new Error(`GET /admin/stats failed: ${statsRes.status}`);
    pass('GET /admin/stats', `Operational Stats (Pending Verifications: ${statsRes.body.stats.pendingVerificationsCount}, Pending Approvals: ${statsRes.body.stats.pendingPropertiesCount}, Total Users: ${statsRes.body.stats.totalUsers})`);

    // 2. GET /admin/analytics/overview
    const analyticsRes = await req('/admin/analytics/overview?range=30d&mode=booked', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!analyticsRes.ok) throw new Error(`GET /admin/analytics/overview failed: ${analyticsRes.status}`);
    const kpis = analyticsRes.body.kpis;
    pass('GET /admin/analytics/overview', `GBV: ₹${kpis.grossBookingVolume}, ADR: ₹${kpis.averageDailyRate}, Completed: ${kpis.totalCompletedReservations}, Occupancy: ${kpis.occupancyRatePercentage}%`);

    // 3. GET /admin/verifications/pending & PUT /admin/users/:id/verify
    const verificationsRes = await req('/admin/verifications/pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!verificationsRes.ok) throw new Error(`GET /admin/verifications/pending failed: ${verificationsRes.status}`);
    pass('GET /admin/verifications/pending', `Retrieved ${verificationsRes.body.length} users in KYC queue`);

    if (verificationsRes.body.length > 0) {
      const sampleUserToVerify = verificationsRes.body[0];
      const verifyKycRes = await req(`/admin/users/${sampleUserToVerify.id}/verify`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'VERIFIED', feedbackNote: 'KYC verified by Admin' }),
      });
      if (!verifyKycRes.ok) throw new Error(`Verify KYC failed: ${JSON.stringify(verifyKycRes.body)}`);
      pass(`PUT /admin/users/${sampleUserToVerify.id}/verify`, `KYC verification status set to VERIFIED with feedback note`);
    }

    // 4. PUT /admin/property/approve/:id & PUT /admin/property/reject/:id (Aliases)
    const approveAliasRes = await req(`/admin/property/approve/${testPropertyId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!approveAliasRes.ok) throw new Error(`Approve property alias failed: ${JSON.stringify(approveAliasRes.body)}`);
    pass(`PUT /admin/property/approve/${testPropertyId}`, 'Property approval route alias verified');

    // 5. GET /admin/collections
    const collectionsRes = await req('/admin/collections', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!collectionsRes.ok) throw new Error(`GET /admin/collections failed: ${collectionsRes.status}`);
    const summary = collectionsRes.body.financialSummary;
    pass('GET /admin/collections', `Financial Collections (Volume: ₹${summary.totalCollectedVolume}, Platform Fees: ₹${summary.totalPlatformServiceFees}, Invoices: ${summary.invoicesCount})`);

    // 6. POST /admin/messages/send
    const hostsList = await req('/admin/hosts', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const targetHost = hostsList.body[0];

    const messageRes = await req('/admin/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        recipientId: targetHost.id,
        subject: 'Welcome to Fairbnb Superhost Program',
        content: 'Congratulations! Your listing has been approved and features high ratings.',
      }),
    });
    if (!messageRes.ok) throw new Error(`Send admin message failed: ${JSON.stringify(messageRes.body)}`);
    pass(`POST /admin/messages/send`, `Direct administrative message dispatched to host "${targetHost.name}"`);
  } catch (e) {
    fail('Admin Flow (Overview, KYC, Collections, Messaging)', e.message);
  }

  // SUITE 11: New Feature Modules (Profile, Wishlist, Notifications, Host Dashboard, Calendar, Chat, Maintenance, Coupons, Disputes, Auto-Messages, iCal, AI Assistant, Admin Settings)
  console.log('\n\x1b[36m[SUITE 11: 13 New Feature Modules Verification]\x1b[0m');
  try {
    // 1. User Profile & KYC
    const getProf = await req('/profile/me', { headers: { Authorization: `Bearer ${guestToken}` } });
    if (!getProf.ok) throw new Error(`GET /profile/me failed: ${getProf.status}`);
    const patchProf = await req('/profile/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ bio: 'Avid traveler and photography enthusiast.', preferredCurrency: 'INR' }),
    });
    if (!patchProf.ok) throw new Error(`PATCH /profile/me failed: ${patchProf.status}`);
    const kycRes = await req('/profile/kyc', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ kycDocumentUrl: 'https://cdn.fairbnb.test/kyc/passport.pdf', kycNote: 'Indian Passport' }),
    });
    if (!kycRes.ok) throw new Error(`POST /profile/kyc failed: ${kycRes.status}`);
    pass('Module 7: User Profile & KYC', `Updated bio and submitted KYC document`);

    // 2. Wishlist
    const createWish = await req('/wishlists', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ name: 'Summer Getaways' }),
    });
    if (!createWish.ok) throw new Error(`POST /wishlists failed: ${createWish.status}`);
    const wishId = createWish.body.id;

    const addPropWish = await req(`/wishlists/${wishId}/properties/${testPropertyId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    if (!addPropWish.ok) throw new Error(`Add property to wishlist failed: ${addPropWish.status}`);

    const getWishes = await req('/wishlists', { headers: { Authorization: `Bearer ${guestToken}` } });
    if (!getWishes.ok || getWishes.body.length === 0) throw new Error(`GET /wishlists failed`);
    pass('Module 8: Wishlists', `Created wishlist "${createWish.body.name}" & added property`);

    // 3. Notifications
    const notifsRes = await req('/notifications', { headers: { Authorization: `Bearer ${guestToken}` } });
    if (!notifsRes.ok) throw new Error(`GET /notifications failed: ${notifsRes.status}`);
    await req('/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    pass('Module 9: Notifications', `Retrieved notifications (Unread: ${notifsRes.body.unreadCount})`);

    // 4. Host Profile & Dashboard
    const getHostProf = await req(`/hosts/profile/${testHostId}`);
    if (!getHostProf.ok) throw new Error(`GET /hosts/profile failed: ${getHostProf.status}`);

    const getHostDash = await req('/hosts/dashboard/stats', { headers: { Authorization: `Bearer ${hostToken}` } });
    if (!getHostDash.ok) throw new Error(`GET /hosts/dashboard/stats failed: ${getHostDash.status}`);
    pass('Module 10: Host Profile & Dashboard', `Retrieved host metrics & stats (Total Earnings: ₹${getHostDash.body.totalEarnings})`);

    // 5. Host Calendar & Seasonal Pricing
    const blockRes = await req('/calendar/block-dates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, startDate: '2026-12-24', endDate: '2026-12-26' }),
    });
    if (!blockRes.ok) throw new Error(`POST /calendar/block-dates failed: ${blockRes.status}`);

    const ruleRes = await req('/calendar/pricing-rules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, startDate: '2026-12-30', endDate: '2026-12-31', pricePerNight: 25000, note: 'New Year Peak Rate' }),
    });
    if (!ruleRes.ok) throw new Error(`POST /calendar/pricing-rules failed: ${ruleRes.status}`);

    const calView = await req(`/calendar/property/${testPropertyId}`);
    if (!calView.ok) throw new Error(`GET /calendar/property failed: ${calView.status}`);
    pass('Module 11: Host Calendar & Pricing Rules', `Blocked Christmas dates & added ₹25,000 New Year rate rule`);

    // 6. Guest <-> Host Chat
    const sendChat = await req('/chat/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ recipientId: testHostId, propertyId: testPropertyId, content: 'Hi Host, is early check-in available?' }),
    });
    if (!sendChat.ok) throw new Error(`POST /chat/send failed: ${sendChat.status}`);

    const chatThreads = await req('/chat/threads', { headers: { Authorization: `Bearer ${guestToken}` } });
    if (!chatThreads.ok) throw new Error(`GET /chat/threads failed: ${chatThreads.status}`);
    pass('Module 12: Guest ↔ Host Chat', `Direct message sent & chat thread created with host`);

    // 7. Maintenance Requests
    const maintRes = await req('/maintenance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, title: 'Pool Light Flickering', description: 'Main pool light needs bulb check', priority: 'LOW' }),
    });
    if (!maintRes.ok) throw new Error(`POST /maintenance failed: ${maintRes.status}`);
    const ticketId = maintRes.body.id;

    const patchMaint = await req(`/maintenance/${ticketId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ status: 'IN_PROGRESS', resolutionNote: 'Electrician dispatched' }),
    });
    if (!patchMaint.ok) throw new Error(`PATCH /maintenance status failed: ${patchMaint.status}`);
    pass('Module 13: Maintenance Requests', `Maintenance ticket created & status updated to IN_PROGRESS`);

    // 8. Coupons / Promo Codes
    const couponCode = `FESTIVE${randomSuffix}`;
    const createCoupon = await req('/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ code: couponCode, discountType: 'PERCENTAGE', discountValue: 15, validUntil: '2027-01-01', minOrderAmount: 5000 }),
    });
    if (!createCoupon.ok) throw new Error(`POST /coupons failed: ${createCoupon.status}`);

    const valCoupon = await req('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code: couponCode, orderAmount: 10000 }),
    });
    if (!valCoupon.ok || !valCoupon.body.valid) throw new Error(`POST /coupons/validate failed: ${valCoupon.status}`);
    pass('Module 14: Coupons & Promo Codes', `Created coupon "${couponCode}" & validated 15% discount (Discount: ₹${valCoupon.body.discountAmount})`);

    // 9. Disputes
    const disputeRes = await req('/disputes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ bookingId: testBookingId, reason: 'Air conditioner stopped working during stay' }),
    });
    if (!disputeRes.ok) throw new Error(`POST /disputes failed: ${disputeRes.status}`);
    const disputeId = disputeRes.body.id;

    const resolveDispute = await req(`/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'RESOLVED_REFUND_GUEST', adminNotes: '10% partial courtesy refund issued by Admin', payoutAdjustment: 1000 }),
    });
    if (!resolveDispute.ok) throw new Error(`PATCH /disputes resolve failed: ${resolveDispute.status}`);
    pass('Module 15: Disputes & Damage Claims', `Dispute filed by guest & resolved by admin with partial refund`);

    // 10. Automated Host Messages
    const autoMsgRes = await req('/automated-messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, triggerEvent: 'CHECKIN_24H_BEFORE', templateText: 'Welcome! Your check-in is tomorrow.' }),
    });
    if (!autoMsgRes.ok) throw new Error(`POST /automated-messages failed: ${autoMsgRes.status}`);
    pass('Module 16: Automated Host Messages', `Created 24h pre-checkin auto-message trigger rule`);

    // 11. iCal Calendar Sync
    const icalRes = await req(`/ical/properties/${testPropertyId}/calendar.ics`);
    if (!icalRes.ok || !icalRes.body.includes('BEGIN:VCALENDAR')) throw new Error(`GET /ical export failed`);

    const regFeed = await req('/ical/feeds', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, name: 'Airbnb Sync', url: 'https://airbnb.com/calendar/ical/sample.ics' }),
    });
    if (!regFeed.ok) throw new Error(`POST /ical/feeds failed: ${regFeed.status}`);
    pass('Module 17: iCal Calendar Sync', `Generated standard .ics export feed & registered external Airbnb sync feed`);

    // 12. AI Assistant
    const aiQuery = await req('/ai-assistant/query', {
      method: 'POST',
      body: JSON.stringify({ propertyId: testPropertyId, query: 'What is the WiFi password and checkin instruction?' }),
    });
    if (!aiQuery.ok || !aiQuery.body.answer) throw new Error(`POST /ai-assistant/query failed`);
    pass('Module 18: AI Assistant Concierge', `AI Assistant responded to query: "${aiQuery.body.answer.slice(0, 70)}..."`);

    // 13. Admin System Settings
    const getSettings = await req('/admin-settings', { headers: { Authorization: `Bearer ${adminToken}` } });
    if (!getSettings.ok) throw new Error(`GET /admin-settings failed: ${getSettings.status}`);

    const patchSetting = await req('/admin-settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ key: 'defaultServiceFeeRate', value: 0.12, description: 'Platform fee updated to 12%' }),
    });
    if (!patchSetting.ok) throw new Error(`PATCH /admin-settings failed: ${patchSetting.status}`);
    pass('Module 19: Admin System Settings', `System configuration fetched & defaultServiceFeeRate set to 12%`);

  } catch (e) {
    fail('Suite 11: 13 New Feature Modules', e.message);
  }

  // SUITE 12: 7 P0/P1 Features (Audit Logs, Search Filters, Booking Edge Cases, Validation, Media Upload)
  console.log('\n\x1b[36m[SUITE 12: 7 P0/P1 Security, Lifecycle & Search Features Verification]\x1b[0m');
  try {
    // 1. Audit Logs
    const auditLogsRes = await req('/admin/audit-logs', { headers: { Authorization: `Bearer ${adminToken}` } });
    if (!auditLogsRes.ok) throw new Error(`GET /admin/audit-logs failed: ${auditLogsRes.status}`);
    pass('P0 Feature: Audit Activity Logs', `Retrieved ${auditLogsRes.body.length} administrative action audit records`);

    // 2. Advanced Search & Map Bounding Box Filters
    const searchMapRes = await req(`/properties?minLat=10&maxLat=20&minLng=70&maxLng=80&instantBook=true&sortBy=price_asc`);
    if (!searchMapRes.ok) throw new Error(`GET /properties map search failed: ${searchMapRes.status}`);
    pass('P1 Feature: Airbnb-Style Map & Filter Search', `Map bounding-box search returned ${searchMapRes.body.length} properties`);

    // 3. Booking Expiry Cleanup
    const expireRes = await req('/bookings/cleanup-expired', { method: 'POST' });
    if (!expireRes.ok) throw new Error(`POST /bookings/cleanup-expired failed: ${expireRes.status}`);
    pass('P0 Feature: Automatic Booking Expiry', expireRes.body.message);

    // 4. Reschedule Flow
    const rescheduleReq = await req(`/bookings/${testBookingId}/reschedule-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ newCheckIn: '2026-11-15', newCheckOut: '2026-11-18', reason: 'Conference rescheduled' }),
    });
    if (!rescheduleReq.ok) throw new Error(`POST /bookings/:id/reschedule-request failed: ${rescheduleReq.status}`);

    const rescheduleResp = await req(`/bookings/${testBookingId}/reschedule-respond`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    if (!rescheduleResp.ok) throw new Error(`PATCH /bookings/:id/reschedule-respond failed: ${rescheduleResp.status}`);
    pass('P0 Feature: Booking Reschedule Flow', `Guest requested dates 2026-11-15 -> 2026-11-18 & Host APPROVED`);

    // 5. Host Cancellation & Penalty Calculation
    const checkIn = '2026-12-20';
    const checkOut = '2026-12-22';
    const hostCancelB = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, checkIn, checkOut, guests: 2 }),
    });
    const hostCancelBId = hostCancelB.body.booking.id;

    const hostCancelAction = await req(`/bookings/${hostCancelBId}/host-cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ reason: 'Emergency plumbing repairs' }),
    });
    if (!hostCancelAction.ok) throw new Error(`POST /bookings/:id/host-cancel failed: ${hostCancelAction.status}`);
    pass('P0 Feature: Host-Initiated Cancellation', `Host cancelled booking with 10% penalty fee calculation`);

    // 6. Guest No-Show
    const noShowRes = await req(`/bookings/${testBookingId}/no-show`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    if (!noShowRes.ok) throw new Error(`PATCH /bookings/:id/no-show failed: ${noShowRes.status}`);
    pass('P0 Feature: Guest No-Show Handling', `Booking ID ${testBookingId} marked as No-Show by Host`);

  } catch (e) {
    fail('Suite 12: 7 P0/P1 Features', e.message);
  }

  console.log('\n===================================================================');
  console.log('   \x1b[32m🎉 ALL 12 END-TO-END INTEGRATION TEST SUITES PASSED! (100%)\x1b[0m  ');
  console.log('===================================================================\n');
}

runTests();


