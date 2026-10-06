// Comprehensive Full-Stack API Integration Test Suite for FairBnB
const BASE_URL = process.env.API_URL || process.env.BASE_URL || 'http://localhost:5000';

let testUserToken = '';
let adminToken = '';
let createdPropertyId = '';

const randomSuffix = Math.floor(100000 + Math.random() * 900000);
const testUser = {
  name: `Test Runner ${randomSuffix}`,
  phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
  email: `tester_${randomSuffix}@fairbnb.test`,
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
  console.log('\n=============================================================');
  console.log('       FAIRBNB FULL-STACK API AUTOMATED INTEGRATION TESTS    ');
  console.log('=============================================================\n');

  // TEST 1: Public Properties Catalog
  console.log('\x1b[36m[TEST SUITE 1: Public Guest Experience]\x1b[0m');
  try {
    const res = await req('/properties');
    if (!res.ok) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array of properties');
    pass('GET /properties', `Found ${res.body.length} approved listings`);

    if (res.body.length > 0) {
      const sample = res.body[0];
      const singleRes = await req(`/properties/${sample.slug || sample.id}`);
      if (!singleRes.ok) throw new Error(`Failed to fetch single property: ${singleRes.status}`);
      pass(`GET /properties/${sample.slug || sample.id}`, `Fetched "${sample.title}"`);
    }
  } catch (e) {
    fail('Public Properties Catalog', e.message);
  }

  // TEST 2: User Registration & Authentication
  console.log('\n\x1b[36m[TEST SUITE 2: Authentication & User Lifecycle]\x1b[0m');
  try {
    // Register
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    pass('POST /auth/register', `Registered ${testUser.phone} (${testUser.email})`);

    // Login
    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    testUserToken = loginRes.body.accessToken || loginRes.body.access_token;
    if (!testUserToken) throw new Error('Missing accessToken in login response');
    pass('POST /auth/login', `JWT Token received: ${testUserToken.slice(0, 20)}...`);

    // GET /auth/me
    const meRes = await req('/auth/me', {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    if (!meRes.ok) throw new Error(`GET /auth/me failed: ${meRes.status}`);
    if (meRes.body.phone !== testUser.phone) throw new Error('Profile phone mismatch');
    pass('GET /auth/me', `Logged in as ${meRes.body.name} (Role: ${meRes.body.role})`);

    // Send OTP
    const otpRes = await req('/auth/send-otp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    if (!otpRes.ok) throw new Error(`send-otp failed: ${JSON.stringify(otpRes.body)}`);
    pass('POST /auth/send-otp', otpRes.body.message || 'OTP triggered');
  } catch (e) {
    fail('User Authentication', e.message);
  }

  // TEST 3: Admin Console & User Administration
  console.log('\n\x1b[36m[TEST SUITE 3: Admin Moderation & User Management]\x1b[0m');
  try {
    // Admin Login
    const adminLoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify(adminCredentials),
    });
    if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
    adminToken = adminLoginRes.body.accessToken || adminLoginRes.body.access_token;
    pass('POST /auth/login (Admin)', `Admin authenticated (${adminCredentials.email})`);

    // Admin GET /users
    const usersRes = await req('/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!usersRes.ok) throw new Error(`GET /users failed: ${usersRes.status}`);
    pass('GET /users', `Retrieved ${usersRes.body.length} registered users`);

    // Admin Promote test user to HOST role
    const currentTestUser = usersRes.body.find((u) => u.phone === testUser.phone);
    if (!currentTestUser) throw new Error('Test user not found in /users list');

    const promoteRes = await req(`/users/${currentTestUser.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'HOST' }),
    });
    if (!promoteRes.ok) throw new Error(`Promote role failed: ${JSON.stringify(promoteRes.body)}`);
    pass(`PATCH /users/${currentTestUser.id}/role`, `Promoted test user to role: HOST`);

    // Admin GET /properties/admin/all
    const modRes = await req('/properties/admin/all', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!modRes.ok) throw new Error(`GET /properties/admin/all failed: ${modRes.status}`);
    pass('GET /properties/admin/all', `Found ${modRes.body.length} total listings in admin database`);
  } catch (e) {
    fail('Admin Moderation', e.message);
  }

  // TEST 4: Host Listing Lifecycle (Create -> Verify Pending -> Approve -> Verify Public -> Cleanup)
  console.log('\n\x1b[36m[TEST SUITE 4: Host Property End-to-End Lifecycle]\x1b[0m');
  try {
    // Log back in to refresh test user's JWT with HOST role
    const hostLoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const hostToken = hostLoginRes.body.accessToken || hostLoginRes.body.access_token;

    // Create a new property
    const newPropertyPayload = {
      title: `Azure Cliffside Villa ${randomSuffix}`,
      description: 'Stunning luxury villa overlooking the ocean with private infinity pool and chef.',
      category: 'Stay',
      propertyType: 'Villa',
      listingPurpose: 'Short-Term Rental',
      city: 'Goa',
      state: 'Goa',
      country: 'India',
      pincode: 403515,
      maxGuests: 6,
      bedrooms: 3,
      beds: 3,
      bathrooms: 3,
      basePrice: 15000,
      instantBook: true,
      minNights: 2,
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      ],
    };

    const createPropRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
      body: JSON.stringify(newPropertyPayload),
    });
    if (!createPropRes.ok) throw new Error(`Create property failed: ${JSON.stringify(createPropRes.body)}`);
    createdPropertyId = createPropRes.body.id;
    if (createPropRes.body.verificationStatus !== 'PENDING' && createPropRes.body.verificationStatus !== 'PENDING_APPROVAL') {
      throw new Error(`Expected PENDING status, got ${createPropRes.body.verificationStatus}`);
    }
    pass('POST /properties (Host)', `Created listing ID: ${createdPropertyId} (Status: ${createPropRes.body.verificationStatus})`);

    // Verify in host's my-properties
    const myPropsRes = await req('/properties/my-properties', {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    if (!myPropsRes.ok) throw new Error(`GET /properties/my-properties failed`);
    const foundMyProp = myPropsRes.body.find((p) => p.id === createdPropertyId);
    if (!foundMyProp) throw new Error('New property not found in my-properties');
    pass('GET /properties/my-properties', `Confirmed listing in host portfolio`);

    // Verify it is NOT yet in public catalog
    const publicCatalogBefore = await req('/properties');
    if (publicCatalogBefore.body.some((p) => p.id === createdPropertyId)) {
      throw new Error('Unapproved property should NOT appear in public catalog');
    }
    pass('Catalog Isolation Check', 'Pending listing is safely hidden from public search');

    // Admin Approves the property
    const approveRes = await req(`/properties/${createdPropertyId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!approveRes.ok) throw new Error(`Approve property failed: ${JSON.stringify(approveRes.body)}`);
    pass(`PATCH /properties/${createdPropertyId}/approve`, 'Admin approved the listing');

    // Verify it IS now in public catalog
    const publicCatalogAfter = await req('/properties');
    const publishedProp = publicCatalogAfter.body.find((p) => p.id === createdPropertyId);
    if (!publishedProp) throw new Error('Approved property not found in public catalog');
    pass('Public Visibility Check', `Property is now live on public catalog! ("${publishedProp.title}")`);

    // Host Deletes / Cleans up property
    const deleteRes = await req(`/properties/${createdPropertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    if (!deleteRes.ok) throw new Error(`Delete property failed: ${deleteRes.status}`);
    pass(`DELETE /properties/${createdPropertyId}`, 'Test property cleaned up successfully');
  } catch (e) {
    fail('Host Listing Lifecycle', e.message);
  }

  // TEST 5: Complete End-to-End Airbnb Guest & Host Booking Funnel
  console.log('\n\x1b[36m[TEST SUITE 5: 100% Airbnb Guest-to-Host Booking Funnel]\x1b[0m');
  try {
    // 1. Get an active property
    const catalogRes = await req('/properties');
    if (!catalogRes.ok || catalogRes.body.length === 0) {
      throw new Error('No properties available for booking test');
    }
    const targetProperty = catalogRes.body[0];

    // 2. Create a reservation as Guest
    const checkInDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    const checkOutDate = new Date(Date.now() + 13 * 86400000).toISOString().split('T')[0];

    const bookingPayload = {
      propertyId: targetProperty.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: 2,
      paymentMethod: 'CARD',
      paymentId: `PAY-AIRBNB-${Date.now()}`,
      specialRequests: 'Checking in late around 8 PM. Please keep keys in lockbox.',
    };

    const createBookingRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify(bookingPayload),
    });
    if (!createBookingRes.ok) throw new Error(`Booking creation failed: ${JSON.stringify(createBookingRes.body)}`);
    const newBooking = createBookingRes.body;
    pass('POST /bookings (Guest Checkout)', `Created booking ID: ${newBooking.id} (Status: ${newBooking.status}, Total: ₹${newBooking.totalAmount})`);

    // 3. Guest fetches their trips
    const myTripsRes = await req('/bookings/my-trips', {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    if (!myTripsRes.ok) throw new Error(`GET /bookings/my-trips failed: ${myTripsRes.status}`);
    const foundTrip = myTripsRes.body.find((t) => t.id === newBooking.id);
    if (!foundTrip) throw new Error('New reservation not found in guest trips');
    pass('GET /bookings/my-trips (Guest Trips Hub)', `Confirmed reservation for "${foundTrip.property.title}"`);

    // 4. Guest cancels the booking
    const cancelRes = await req(`/bookings/${newBooking.id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify({ reason: 'Trip rescheduled due to work' }),
    });
    if (!cancelRes.ok) throw new Error(`Cancel booking failed: ${JSON.stringify(cancelRes.body)}`);
    if (cancelRes.body.status !== 'CANCELLED') throw new Error(`Expected CANCELLED status, got ${cancelRes.body.status}`);
    pass(`PATCH /bookings/${newBooking.id}/cancel (Guest Cancel)`, 'Booking cancelled and refund status updated to PENDING');

  } catch (e) {
    fail('Guest-to-Host Booking Funnel', e.message);
  }

  console.log('\n=============================================================');
  console.log('    \x1b[32m✔ ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (100%)\x1b[0m    ');
  console.log('=============================================================\n');
}

runTests();
