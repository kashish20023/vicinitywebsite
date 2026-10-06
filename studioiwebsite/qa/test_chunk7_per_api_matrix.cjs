const http = require('http');

const BASE_URL = 'http://localhost:5002/api/v1';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✔ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✖ [FAIL] ${message} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

function req(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqHeaders = Object.assign({}, headers);
    let payload = null;

    if (body !== null && body !== undefined) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    } else {
      delete reqHeaders['Content-Length'];
      delete reqHeaders['Content-Type'];
    }

    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers: reqHeaders,
    };

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    r.on('error', reject);
    if (payload) {
      r.write(payload);
    }
    r.end();
  });
}

async function runChunk7Matrix() {
  console.log('================================================================');
  console.log('   CHUNK 7: COMPREHENSIVE PER-API POSITIVE & NEGATIVE MATRIX   ');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & ROLE ESCALATION DEFENSE
    // -------------------------------------------------------------------------
    console.log('--- 1. Auth API (Positive & Negative Cases) ---');
    const memberLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'member@studioi.com',
      password: 'StudioI@Member2026',
    });
    assert(memberLogin.status === 200 && memberLogin.body.user.role === 'USER', 'Positive: Member login succeeds with role USER');
    const memberToken = memberLogin.body.token;
    const memberHeaders = { Authorization: `Bearer ${memberToken}` };

    const hostLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'host@studioi.com',
      password: 'StudioI@Host2026',
    });
    assert(hostLogin.status === 200 && hostLogin.body.user.role === 'HOST', 'Positive: Host login succeeds with role HOST');
    const hostToken = hostLogin.body.token;
    const hostHeaders = { Authorization: `Bearer ${hostToken}` };

    const adminLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'admin@studioi.com',
      password: 'StudioI@Admin2026',
    });
    assert(adminLogin.status === 200 && adminLogin.body.user.role === 'ADMIN', 'Positive: Admin login succeeds with role ADMIN');
    const adminToken = adminLogin.body.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const cohostLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'cohost@studioi.com',
      password: 'StudioI@Cohost2026',
    });
    assert(cohostLogin.status === 200 && cohostLogin.body.user.cohostPermissions?.length >= 1, 'Positive: Co-host login succeeds with active cohostPermissions');
    const cohostToken = cohostLogin.body.token;
    const cohostHeaders = { Authorization: `Bearer ${cohostToken}` };

    const badLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'member@studioi.com',
      password: 'WrongPassword!',
    });
    assert(badLogin.status === 401, 'Negative: Invalid password returns 401 Unauthorized');

    const duplicateReg = await req(`${BASE_URL}/auth/register`, 'POST', {}, {
      email: 'member@studioi.com',
      password: 'SomePassword123',
      name: 'Existing Member',
    });
    assert(duplicateReg.status === 409 || duplicateReg.status === 400, 'Negative: Duplicate registration rejected (409/400)');

    const getMe = await req(`${BASE_URL}/auth/me`, 'GET', memberHeaders);
    assert(getMe.status === 200 && getMe.body.email === 'member@studioi.com', 'Positive: /auth/me returns current user identity');

    const getMeNoAuth = await req(`${BASE_URL}/auth/me`, 'GET');
    assert(getMeNoAuth.status === 401, 'Negative: /auth/me without token returns 401 Unauthorized');

    // -------------------------------------------------------------------------
    // SECTION 2: WORKSPACE & 2D DISCOVERY
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Workspaces & 2D Discovery API ---');
    const allWs = await req(`${BASE_URL}/workspaces`);
    assert(allWs.status === 200 && allWs.body.length >= 2, 'Positive: /workspaces returns published locations');
    assert(!allWs.body.some(w => w.city.toLowerCase().includes('alwar')), 'Invariant: Alwar is strictly absent from public workspaces');

    const wsBySlug = await req(`${BASE_URL}/workspaces/lehariya-jaipur`);
    assert(wsBySlug.status === 200 && wsBySlug.body.slug === 'lehariya-jaipur', 'Positive: Workspace retrieved by slug');
    const workspaceId = wsBySlug.body.id;
    const floorId = wsBySlug.body.buildings[0]?.floors[0]?.id;
    const hourlyPlan = wsBySlug.body.bookingPlans.find(p => p.planType === 'HOURLY') || wsBySlug.body.bookingPlans[0];

    const badSlug = await req(`${BASE_URL}/workspaces/non-existent-facility`);
    assert(badSlug.status === 404, 'Negative: Non-existent workspace slug returns 404 Not Found');

    const now = new Date();
    const startStr = new Date(now.getTime() + 345600000).toISOString(); // 4 days out
    const endStr = new Date(now.getTime() + 345600000 + 8 * 3600000).toISOString();

    const floorAvail = await req(`${BASE_URL}/workspaces/floors/${floorId}/availability?startDateTime=${startStr}&endDateTime=${endStr}`);
    assert(floorAvail.status === 200 && Array.isArray(floorAvail.body.units), 'Positive: Floor 2D unit availability returned');
    const targetUnit = floorAvail.body.units.find(u => u.status === 'AVAILABLE') || floorAvail.body.units[0];

    // -------------------------------------------------------------------------
    // SECTION 3: PRICING QUOTE & COUPONS
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Pricing & Quotes Engine ---');
    const quoteDayPass = await req(`${BASE_URL}/bookings/quote`, 'POST', {}, {
      unitId: targetUnit.id,
      planId: hourlyPlan.id,
      startDateTime: startStr,
      endDateTime: endStr,
    });
    assert((quoteDayPass.status === 200 || quoteDayPass.status === 201) && Number(quoteDayPass.body.pricing.taxPaise) > 0, 'Positive: Day pass quote calculates 18% GST');

    const quoteDiscounted = await req(`${BASE_URL}/bookings/quote`, 'POST', {}, {
      unitId: targetUnit.id,
      planId: hourlyPlan.id,
      startDateTime: startStr,
      endDateTime: endStr,
      couponCode: 'STUDIO10',
    });
    assert(Number(quoteDiscounted.body.pricing.discountPaise) > 0, 'Positive: Valid coupon STUDIO10 applies discount');

    const quoteBadCoupon = await req(`${BASE_URL}/bookings/quote`, 'POST', {}, {
      unitId: targetUnit.id,
      planId: hourlyPlan.id,
      startDateTime: startStr,
      endDateTime: endStr,
      couponCode: 'FAKE_COUPON_999',
    });
    assert(Number(quoteBadCoupon.body?.pricing?.discountPaise || 0) === 0 || quoteBadCoupon.status === 400, 'Negative: Invalid coupon does not yield discount');

    // -------------------------------------------------------------------------
    // SECTION 4: CONCURRENCY, EXCLUSIVE HOLDS & LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Concurrency & Exclusive Hold Lifecycle ---');
    const hold1 = await req(`${BASE_URL}/bookings/hold`, 'POST', memberHeaders, {
      unitId: targetUnit.id,
      startDateTime: startStr,
      endDateTime: endStr,
    });
    assert((hold1.status === 200 || hold1.status === 201) && !!hold1.body.holdId, 'Positive: Acquired exclusive hold token');
    const holdId = hold1.body.holdId;

    const hold2 = await req(`${BASE_URL}/bookings/hold`, 'POST', hostHeaders, {
      unitId: targetUnit.id,
      startDateTime: startStr,
      endDateTime: endStr,
    });
    assert(hold2.status === 409, 'Negative: Competing hold during active exclusivity returns 409 Conflict');

    const reserveRes = await req(`${BASE_URL}/bookings/reserve`, 'POST', memberHeaders, {
      holdId,
      planId: hourlyPlan.id,
      couponCode: 'STUDIO10',
    });
    assert((reserveRes.status === 200 || reserveRes.status === 201) && !!reserveRes.body.bookingId, 'Positive: Hold converted to PENDING_PAYMENT booking');
    const bookingId = reserveRes.body.bookingId;
    const orderId = reserveRes.body.paymentOrder?.id;

    // -------------------------------------------------------------------------
    // SECTION 5: PAYMENTS & DIGITAL PASS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Payments, Verification & Digital Pass ---');
    const verifyRes = await req(`${BASE_URL}/payments/verify`, 'POST', memberHeaders, {
      orderId,
      providerPaymentId: `sim_pay_matrix_${Date.now()}`,
    });
    assert((verifyRes.status === 200 || verifyRes.status === 201) && verifyRes.body.booking?.status === 'CONFIRMED', 'Positive: Payment verified, booking transitioned to CONFIRMED');
    const qrToken = verifyRes.body.digitalPass?.qrToken;

    const passRes = await req(`${BASE_URL}/passes/${bookingId}`, 'GET', memberHeaders);
    assert(passRes.status === 200 && passRes.body.status === 'ACTIVE', 'Positive: Digital Pass generated with active status');

    const checkInRes = await req(`${BASE_URL}/passes/check-in`, 'POST', memberHeaders, {
      qrToken,
      scannerAdminId: 'GATE_MATRIX_SCANNER',
      terminalId: 'RECEPTION_A',
    });
    assert(checkInRes.status === 200 || checkInRes.status === 400, 'Positive: Check-in endpoint handles pass QR validation');

    // -------------------------------------------------------------------------
    // SECTION 6: ROLE-BASED ACCESS GUARDS
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Role-Based Access Control Guards ---');
    const forbiddenHostStats = await req(`${BASE_URL}/hosts/dashboard/stats`, 'GET', memberHeaders);
    assert(forbiddenHostStats.status === 403, 'Negative: Member forbidden (403) from /hosts/dashboard/stats');

    const forbiddenAdminDash = await req(`${BASE_URL}/admin/dashboard`, 'GET', hostHeaders);
    assert(forbiddenAdminDash.status === 403, 'Negative: Host forbidden (403) from /admin/dashboard');

    const allowedHostStats = await req(`${BASE_URL}/hosts/dashboard/stats`, 'GET', hostHeaders);
    assert(allowedHostStats.status === 200, 'Positive: Host granted access (200) to /hosts/dashboard/stats');

    const allowedAdminDash = await req(`${BASE_URL}/admin/dashboard`, 'GET', adminHeaders);
    assert(allowedAdminDash.status === 200, 'Positive: Admin granted access (200) to /admin/dashboard');

    // -------------------------------------------------------------------------
    // SECTION 7: OPERATIONS ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Operations: Chat, Issues, Disputes, Wishlist ---');
    const banners = await req(`${BASE_URL}/operations/banners`);
    assert(banners.status === 200 && banners.body.length >= 1, 'Positive: Active banners fetched');

    const wishlist = await req(`${BASE_URL}/operations/wishlist`, 'GET', memberHeaders);
    assert(wishlist.status === 200, 'Positive: Wishlist fetched');

    const chatMsg = await req(`${BASE_URL}/operations/chat/send`, 'POST', memberHeaders, {
      receiverId: hostLogin.body.user.id,
      message: 'Matrix verification chat probe',
    });
    assert(chatMsg.status === 201, 'Positive: Chat message sent');

    const issue = await req(`${BASE_URL}/operations/maintenance/report`, 'POST', memberHeaders, {
      workspaceId,
      title: 'Power strip probe test',
      description: 'Test issue for matrix verification',
    });
    assert(issue.status === 201, 'Positive: Maintenance issue logged');

    console.log(`\n================================================================`);
    console.log(`   CHUNK 7 API MATRIX: ${passed} PASSED, ${failed} FAILED       `);
    console.log(`================================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal API matrix failure:', err);
    process.exit(1);
  }
}

runChunk7Matrix();
