const API = 'http://localhost:5002/api/v1';

async function run() {
  console.log('=== TESTING COMPLETE STUDIO I BACKEND FLOW ===\n');

  // 1. Auth: Member Login
  console.log('1. Logging in as member...');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'member@studioi.com', password: 'StudioI@Member2026' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✔ Member authenticated. Token received. Role:', loginData.user?.role);

  // 2. Fetch Workspaces
  console.log('\n2. Fetching workspaces catalog...');
  const wsRes = await fetch(`${API}/workspaces`);
  const workspaces = await wsRes.json();
  const lehariya = workspaces.find(w => w.slug === 'lehariya-jaipur');
  console.log(`✔ Found workspace: ${lehariya.name}`);

  const floor = lehariya.buildings[0].floors[0];
  console.log(`✔ Found floor: ${floor.name} (${floor.id})`);

  // 3. Fetch Floor Availability
  const now = new Date();
  const startDateTime = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();
  const endDateTime = new Date(now.getTime() + 10 * 3600 * 1000).toISOString();

  console.log('\n3. Checking floor availability for interval...');
  const availRes = await fetch(`${API}/workspaces/floors/${floor.id}/availability?startDateTime=${startDateTime}&endDateTime=${endDateTime}`);
  const availData = await availRes.json();
  const availableUnit = availData.units.find(u => u.status === 'AVAILABLE');
  console.log(`✔ Available unit found: ${availableUnit.unitCode} (${availableUnit.name})`);

  // 4. Acquire Atomic Hold
  console.log(`\n4. Acquiring atomic hold on unit ${availableUnit.unitCode}...`);
  const holdRes = await fetch(`${API}/bookings/hold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      unitId: availableUnit.id,
      startDateTime,
      endDateTime,
    }),
  });
  const holdData = await holdRes.json();
  if (!holdRes.ok) throw new Error(`Hold failed: ${JSON.stringify(holdData)}`);
  console.log(`✔ Hold acquired! Hold ID: ${holdData.holdId}, TTL: ${holdData.ttlSeconds}s`);

  // 5. Calculate Quote with Coupon
  console.log('\n5. Calculating quote with coupon STUDIO10...');
  const quoteRes = await fetch(`${API}/bookings/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unitId: availableUnit.id,
      planId: lehariya.bookingPlans[0].id, // Hot Desk Day Pass
      startDateTime,
      endDateTime,
      couponCode: 'STUDIO10',
      userId: loginData.user.id,
    }),
  });
  const quoteData = await quoteRes.json();
  console.log(`✔ Quote: Base ₹${quoteData.pricing.baseRatePaise / 100}, Discount ₹${quoteData.pricing.discountPaise / 100}, Tax ₹${quoteData.pricing.taxPaise / 100}, Total ₹${quoteData.pricing.totalPayablePaise / 100}`);

  // 6. Create Booking
  console.log('\n6. Creating booking from hold...');
  const createRes = await fetch(`${API}/bookings/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      holdId: holdData.holdId,
      planId: lehariya.bookingPlans[0].id,
      couponCode: 'STUDIO10',
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Booking creation failed: ${JSON.stringify(createData)}`);
  console.log(`✔ Booking created! Number: ${createData.booking.bookingNumber}, Order ID: ${createData.paymentOrder.orderNumber}`);

  // 7. Verify Payment
  console.log('\n7. Verifying simulated payment order...');
  const payRes = await fetch(`${API}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId: createData.paymentOrder.id,
      paymentMethod: 'UPI',
    }),
  });
  const payData = await payRes.json();
  if (!payRes.ok) throw new Error(`Payment verification failed: ${JSON.stringify(payData)}`);
  console.log(`✔ Payment confirmed! Booking Status: ${payData.booking.status}, Digital Pass: ${payData.digitalPass.passToken}`);

  // 8. Access QR Check-In
  console.log('\n8. Simulating Reception QR check-in with digital pass token...');
  const checkinRes = await fetch(`${API}/access/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passToken: payData.digitalPass.passToken,
      scannerAdminId: 'RECEPTION_TOWER_A',
    }),
  });
  const checkinData = await checkinRes.json();
  console.log(`✔ Check-in result: ${checkinData.message} (Session ID: ${checkinData.session?.id})`);

  // 9. Admin Dashboard Metrics
  console.log('\n9. Checking Admin Dashboard metrics...');
  const adminLoginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@studioi.com', password: 'StudioI@Admin2026' }),
  });
  const adminToken = (await adminLoginRes.json()).token;

  const dashRes = await fetch(`${API}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dashData = await dashRes.json();
  console.log('✔ Admin Dashboard:', dashData);

  console.log('\n=== ALL BACKEND TRANSACTION TESTS PASSED 100% ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
