const http = require('http');

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (body) {
      const data = JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('   STARTING CHUNK 4 CONCURRENCY, HOLDS & LIFECYCLE TEST SUITE   ');
  console.log('================================================================\n');

  const baseUrl = 'http://localhost:5002/api/v1';

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✔ [PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`  ✖ [FAIL] ${name}: ${details}`);
      testsFailed++;
    }
  }

  try {
    // 1. Authenticate Member & Host & Secondary Member
    console.log('--- TEST GROUP 1: User Personas Setup ---');
    const memberLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'member@studioi.com',
      password: 'StudioI@Member2026',
    });
    assert('Primary member login successful', memberLogin.status === 200 && !!memberLogin.body.token);
    const memberToken = memberLogin.body.token;

    // Create a secondary member for competing concurrency
    const compMemberEmail = `comp_user_${Date.now()}@studioi.com`;
    const compMemberReg = await request(`${baseUrl}/auth/register`, { method: 'POST' }, {
      email: compMemberEmail,
      password: 'Password@123',
      name: 'Competing Buyer',
    });
    assert('Competing member registration successful', compMemberReg.status === 200 || compMemberReg.status === 201);
    const compToken = compMemberReg.body.token;

    // 2. Discover an Available Unit
    console.log('\n--- TEST GROUP 2: Locate Available Target Unit ---');
    const wsRes = await request(`${baseUrl}/workspaces/lehariya-jaipur`);
    const floorId = wsRes.body.buildings[0].floors[0].id;
    const planId = wsRes.body.bookingPlans[0].id;

    const now = new Date();
    const startStr = new Date(now.getTime() + 172800000).toISOString(); // 2 days later
    const endStr = new Date(now.getTime() + 172800000 + 8 * 3600000).toISOString();

    const floorRes = await request(`${baseUrl}/workspaces/floors/${floorId}/availability?startDateTime=${startStr}&endDateTime=${endStr}`);
    const targetUnit = floorRes.body.units.find((u) => u.status === 'AVAILABLE');
    assert('Found an available unit for concurrency stress test', !!targetUnit);
    const targetUnitId = targetUnit.id;

    // 3. CONCURRENCY GATE: 20 Simultaneous Competing Hold Requests
    console.log('\n--- TEST GROUP 3: Concurrency Gate (20 Competing Requests for Same Unit) ---');
    const competingTokens = [
      memberToken,
      compToken,
      ...Array(18).fill(compToken),
    ];

    const holdPromises = competingTokens.map((token, index) =>
      request(`${baseUrl}/bookings/hold`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }, {
        unitId: targetUnitId,
        startDateTime: startStr,
        endDateTime: endStr,
      })
    );

    const holdResults = await Promise.all(holdPromises);

    const successHolds = holdResults.filter((r) => r.status === 200 || r.status === 201);
    const conflictHolds = holdResults.filter((r) => r.status === 409);

    console.log(`  -> Concurrency Stress Results: ${successHolds.length} succeeded, ${conflictHolds.length} received 409 Conflict`);
    assert('EXACTLY ONE competing request acquired exclusive hold', successHolds.length === 1);
    assert('Remaining 19 competing requests received 409 Conflict', conflictHolds.length === 19);

    const winningHold = successHolds[0].body;
    assert('Winning hold returns holdId and 10-minute expiry', !!winningHold.holdId && winningHold.ttlSeconds === 600);

    // 4. Booking Reservation Lifecycle
    console.log('\n--- TEST GROUP 4: Reserve Booking from Exclusive Hold ---');
    const reserveRes = await request(`${baseUrl}/bookings/reserve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    }, {
      holdId: winningHold.holdId,
      planId,
      couponCode: 'STUDIO10',
    });

    assert('Reservation succeeds and returns 200/201', reserveRes.status === 200 || reserveRes.status === 201);
    assert('Booking reference number generated (SI-YYYYMMDD-...)', !!reserveRes.body.bookingNumber && reserveRes.body.bookingNumber.startsWith('SI-'));
    assert('PaymentOrder initialized in PENDING state', !!reserveRes.body.paymentOrder?.id);
    const bookingId = reserveRes.body.bookingId;

    // 5. Booking Retrieval & Idempotent Inspection
    console.log('\n--- TEST GROUP 5: Booking Details & My Bookings ---');
    const myBookingsRes = await request(`${baseUrl}/bookings/my`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert('Member retrieves booking history (/bookings/my)', myBookingsRes.status === 200 && Array.isArray(myBookingsRes.body));
    const foundMyBooking = myBookingsRes.body.find((b) => b.id === bookingId);
    assert('Newly reserved booking is present in member history', !!foundMyBooking);

    const singleBookingRes = await request(`${baseUrl}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert('Member accesses individual booking detail (/bookings/:id)', singleBookingRes.status === 200);
    assert('Booking contains workspace, unit, and payment details', !!singleBookingRes.body.workspace && !!singleBookingRes.body.unit);

    // 6. Access Control: Competing User Forbidden from Viewing Member's Booking
    console.log('\n--- TEST GROUP 6: Cross-User Booking Isolation ---');
    const trespassRes = await request(`${baseUrl}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${compToken}` },
    });
    assert('Other user is forbidden (403) from accessing member booking', trespassRes.status === 403);

  } catch (err) {
    console.error('Test execution error:', err);
    testsFailed++;
  } finally {
    console.log('\n================================================================');
    console.log(`   TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED   `);
    console.log('================================================================');
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

run();
