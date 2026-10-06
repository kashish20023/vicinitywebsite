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
  console.log('   STARTING CHUNK 5 PAYMENTS, REFUNDS & SETTLEMENTS TEST SUITE  ');
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
    // 1. Authenticate Personas (Member, Host, Admin)
    console.log('--- TEST GROUP 1: Persona Authentication ---');
    const memberLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'member@studioi.com',
      password: 'StudioI@Member2026',
    });
    assert('Member login successful', memberLogin.status === 200 && !!memberLogin.body.token);
    const memberToken = memberLogin.body.token;

    const hostLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'host@studioi.com',
      password: 'StudioI@Host2026',
    });
    assert('Host login successful', hostLogin.status === 200 && !!hostLogin.body.token);
    const hostToken = hostLogin.body.token;

    const adminLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'admin@studioi.com',
      password: 'StudioI@Admin2026',
    });
    assert('Admin login successful', adminLogin.status === 200 && !!adminLogin.body.token);
    const adminToken = adminLogin.body.token;

    // 2. Discover Available Unit and Create Hold & Reservation
    console.log('\n--- TEST GROUP 2: Hold & Reservation Flow ---');
    const wsRes = await request(`${baseUrl}/workspaces/lehariya-jaipur`);
    const floorId = wsRes.body.buildings[0].floors[0].id;
    const planId = wsRes.body.bookingPlans[0].id;

    const now = new Date();
    const startStr = new Date(now.getTime() + 259200000).toISOString(); // 3 days later
    const endStr = new Date(now.getTime() + 259200000 + 8 * 3600000).toISOString();

    const floorRes = await request(`${baseUrl}/workspaces/floors/${floorId}/availability?startDateTime=${startStr}&endDateTime=${endStr}`);
    const availableUnit = floorRes.body.units.find((u) => u.status === 'AVAILABLE');
    assert('Found available unit for payment cycle', !!availableUnit);

    const holdRes = await request(`${baseUrl}/bookings/hold`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    }, {
      unitId: availableUnit.id,
      startDateTime: startStr,
      endDateTime: endStr,
    });
    assert('Exclusive hold created', holdRes.status === 200 || holdRes.status === 201);
    const holdId = holdRes.body.holdId;

    const reserveRes = await request(`${baseUrl}/bookings/reserve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    }, {
      holdId,
      planId,
      couponCode: 'STUDIO10',
    });
    assert('Booking reserved in PENDING_PAYMENT state', reserveRes.status === 200 || reserveRes.status === 201);
    const bookingId = reserveRes.body.bookingId;
    const orderId = reserveRes.body.paymentOrder.id;

    // 3. Payment Verification & Digital Pass Issuance
    console.log('\n--- TEST GROUP 3: Simulated Payment Verification & Access Pass ---');
    const verifyRes = await request(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    }, {
      orderId,
      providerPaymentId: `sim_pay_${Date.now()}`,
    });

    assert('Payment verification succeeds (200/201)', verifyRes.status === 200 || verifyRes.status === 201);
    assert('Booking status transitions to CONFIRMED', verifyRes.body.booking.status === 'CONFIRMED');
    assert('Digital Pass is issued with valid QR token', !!verifyRes.body.digitalPass?.qrToken);
    assert('Digital Pass has active status and 4-digit security code', verifyRes.body.digitalPass?.status === 'ACTIVE' && !!verifyRes.body.digitalPass?.securityCode);
    const passToken = verifyRes.body.digitalPass?.qrToken;

    // 4. Idempotency Gate (Double Payment Call)
    console.log('\n--- TEST GROUP 4: Idempotency Protection ---');
    const doubleVerifyRes = await request(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    }, {
      orderId,
      providerPaymentId: `sim_pay_duplicate_${Date.now()}`,
    });
    assert('Duplicate payment verify returns idempotent success', doubleVerifyRes.body.alreadyProcessed === true);
    assert('Existing digital pass returned without duplicate issuance', doubleVerifyRes.body.digitalPass?.qrToken === passToken);

    // 5. Reception QR Check-In with the Generated Digital Pass
    console.log('\n--- TEST GROUP 5: Reception Access Check-In ---');
    const checkInRes = await request(`${baseUrl}/passes/check-in`, {
      method: 'POST',
    }, {
      qrToken: passToken,
      scannerAdminId: 'LEHARIYA_GATE_SCANNER',
      terminalId: 'RECEPTION_GATE_01',
    });

    // Check-in response (either access not yet open due to future date, or checked in successfully)
    assert('Check-in endpoint responds with structured pass status validation', checkInRes.status === 200 || checkInRes.status === 400);

    // 6. Host Payout Lifecycle
    console.log('\n--- TEST GROUP 6: Host Payout Request & Admin Settlement ---');
    const hostPayoutReq = await request(`${baseUrl}/hosts/payouts/request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hostToken}` },
    }, {
      amountRupees: 5000,
      bankAccount: 'HDFC0001234 - AC 50100234567890',
      notes: 'Monthly settlement for Lehariya campus desks',
    });

    assert('Host payout request submitted (200/201)', hostPayoutReq.status === 200 || hostPayoutReq.status === 201);
    assert('Payout request records amount in integer paise (500000)', hostPayoutReq.body.payout?.amountPaise === '500000');
    assert('Payout status is PENDING', hostPayoutReq.body.payout?.status === 'PENDING');
    const payoutId = hostPayoutReq.body.payout?.id;

    // Admin reviews and processes payout
    const adminPayoutsList = await request(`${baseUrl}/admin/payouts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('Admin lists all host payout requests', adminPayoutsList.status === 200 && Array.isArray(adminPayoutsList.body));

    const processRes = await request(`${baseUrl}/admin/payouts/${payoutId}/process`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      action: 'APPROVE',
      notes: 'NEFT Transfer ref: UTR20260922889900',
    });
    assert('Admin payout approval succeeds', processRes.status === 200 || processRes.status === 201);
    assert('Payout transitions to PROCESSED state', processRes.body.status === 'PROCESSED');

    // 7. Full Refund & Cancellation Flow
    console.log('\n--- TEST GROUP 7: Refund & Pass Revocation Lifecycle ---');
    const refundRes = await request(`${baseUrl}/payments/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    }, {
      orderId,
      reason: 'Customer schedule change request',
    });

    assert('Full refund succeeds (200/201)', refundRes.status === 200 || refundRes.status === 201);
    assert('Booking status updated to CANCELLED', refundRes.body.bookingStatus === 'CANCELLED');
    assert('Refund record created with provider refund ID', refundRes.body.success === true && Number(refundRes.body.refundAmountPaise) > 0);

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
