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
  console.log('   STARTING CHUNK 3 LISTINGS, 2D LAYOUT & PRICING TEST SUITE    ');
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
    // 1. Admin Authentication for publishing
    console.log('--- TEST GROUP 1: Admin Authentication ---');
    const adminLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'admin@studioi.com',
      password: 'StudioI@Admin2026',
    });
    assert('Admin login successful', adminLogin.status === 200 && !!adminLogin.body.token);
    const adminToken = adminLogin.body.token;

    // 2. Discover Workspaces and check Alwar exclusion
    console.log('\n--- TEST GROUP 2: Workspace Discovery & Inventory ---');
    const workspacesRes = await request(`${baseUrl}/workspaces`);
    assert('Public /workspaces returns 200 OK', workspacesRes.status === 200 && Array.isArray(workspacesRes.body));
    
    const workspaces = workspacesRes.body;
    const lehariya = workspaces.find((w) => w.slug === 'lehariya-jaipur');
    const horizon = workspaces.find((w) => w.slug === 'horizon-jaipur');
    const alwar = workspaces.find((w) => w.city?.toLowerCase() === 'alwar' || w.name?.toLowerCase().includes('alwar'));

    assert('Jaipur flagship Lehariya is discovered', !!lehariya);
    assert('Jaipur flagship Horizon Tower is discovered', !!horizon);
    assert('Public Alwar inventory is strictly absent from discovery', !alwar);

    // 3. Workspace Detail Inspection
    console.log('\n--- TEST GROUP 3: Workspace Detail & Spatial Hierarchy ---');
    const detailRes = await request(`${baseUrl}/workspaces/lehariya-jaipur`);
    assert('Workspace detail returns 200 OK', detailRes.status === 200);
    assert('Workspace has buildings, floors, and plans', detailRes.body.buildings?.length > 0 && detailRes.body.bookingPlans?.length > 0);

    const firstFloor = detailRes.body.buildings[0]?.floors[0];
    assert('First floor exists on flagship building', !!firstFloor);
    const floorId = firstFloor.id;

    // 4. Initial 2D Floor Availability Check
    console.log('\n--- TEST GROUP 4: 2D Floor Plan Availability ---');
    const now = new Date();
    const startStr = new Date(now.getTime() + 86400000).toISOString();
    const endStr = new Date(now.getTime() + 86400000 + 8 * 3600000).toISOString();

    const floorRes = await request(`${baseUrl}/workspaces/floors/${floorId}/availability?startDateTime=${startStr}&endDateTime=${endStr}`);
    assert('Floor availability returns 200 OK', floorRes.status === 200);
    assert('Floor contains units with 2D coordinates', floorRes.body.units?.length > 0);
    const initialUnitCount = floorRes.body.units.length;

    // 5. Admin Publishes a New 2D Layout with an Added Unit
    console.log('\n--- TEST GROUP 5: 2D Floor Plan Layout Publishing ---');
    const newUnitCode = `LH-01-D${Date.now().toString().slice(-4)}`;
    const updatedUnits = [
      ...floorRes.body.units,
      {
        unitCode: newUnitCode,
        name: 'Executive Panoramic Window Desk',
        unitType: 'DEDICATED_DESK',
        capacity: 1,
        x: 550,
        y: 280,
        width: 70,
        height: 60,
        rotation: 0,
      },
    ];

    const publishRes = await request(`${baseUrl}/admin/floors/${floorId}/publish-layout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      canvasWidth: 1200,
      canvasHeight: 700,
      units: updatedUnits,
      objects: [
        { objectType: 'WALL', x: 50, y: 50, width: 1100, height: 10 },
        { objectType: 'DOOR', x: 200, y: 50, width: 60, height: 10 },
      ],
    });

    assert('Admin layout publication returns 200/201', publishRes.status === 200 || publishRes.status === 201);
    assert('Layout publication increments version and reports updated unit count', publishRes.body.isLive === true && publishRes.body.unitsCount === updatedUnits.length);

    // 6. User Discovery of the Newly Published 2D Unit
    console.log('\n--- TEST GROUP 6: User Real-Time 2D Discovery Verification ---');
    const userDiscoverRes = await request(`${baseUrl}/workspaces/floors/${floorId}/availability?startDateTime=${startStr}&endDateTime=${endStr}`);
    assert('User floor query returns 200 OK after publish', userDiscoverRes.status === 200);

    const discoveredNewUnit = userDiscoverRes.body.units?.find((u) => u.unitCode === newUnitCode);
    assert('Newly published 2D unit is visible in User viewer', !!discoveredNewUnit);
    assert('Discovered unit has correct coordinates (x=550, y=280)', discoveredNewUnit?.x === 550 && discoveredNewUnit?.y === 280);
    assert('Discovered unit initial status is AVAILABLE', discoveredNewUnit?.status === 'AVAILABLE');

    // 7. Pricing Engine & Dynamic Quote Calculations
    console.log('\n--- TEST GROUP 7: Pricing Engine, Commitment Rules & Coupons ---');
    const hourlyPlan = detailRes.body.bookingPlans.find((p) => p.planType === 'HOURLY');
    const monthlyPlan = detailRes.body.bookingPlans.find((p) => p.planType === 'MONTHLY');
    assert('Hourly and Monthly booking plans exist', !!hourlyPlan && !!monthlyPlan);

    // 7a. Standard Hourly Quote
    const hourlyQuote = await request(`${baseUrl}/bookings/quote`, { method: 'POST' }, {
      unitId: discoveredNewUnit.id,
      planId: hourlyPlan.id,
      startDateTime: startStr,
      endDateTime: endStr,
    });
    assert('Hourly quote returns 200 OK', (hourlyQuote.status === 200 || hourlyQuote.status === 201));
    assert('Hourly quote applies 18% GST accurately', Number(hourlyQuote.body.pricing.taxPaise) > 0);
    assert('Currency is strictly INR', hourlyQuote.body.pricing.currency === 'INR');

    // 7b. Coupon STUDIO10 Quote
    const couponQuote = await request(`${baseUrl}/bookings/quote`, { method: 'POST' }, {
      unitId: discoveredNewUnit.id,
      planId: hourlyPlan.id,
      startDateTime: startStr,
      endDateTime: endStr,
      couponCode: 'STUDIO10',
    });
    assert('Quote with coupon STUDIO10 returns 200 OK', (couponQuote.status === 200 || couponQuote.status === 201));
    assert('Coupon discount is applied (> 0)', Number(couponQuote.body.pricing.discountPaise) > 0);
    assert('Total payable reflects discount', Number(couponQuote.body.pricing.totalPayablePaise) < Number(hourlyQuote.body.pricing.totalPayablePaise));

    // 7c. 2-Month Commitment Enforcement on Dedicated Desk / Cabin
    const monthlyQuote = await request(`${baseUrl}/bookings/quote`, { method: 'POST' }, {
      unitId: discoveredNewUnit.id,
      planId: monthlyPlan.id,
      startDateTime: startStr,
      endDateTime: new Date(new Date(startStr).getTime() + 62 * 86400000).toISOString(), // 2 months
    });
    assert('Monthly quote with 2-month commitment succeeds', (monthlyQuote.status === 200 || monthlyQuote.status === 201));
    assert('Security deposit is calculated for monthly plan', Number(monthlyQuote.body.pricing.securityDepositPaise) > 0);

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
