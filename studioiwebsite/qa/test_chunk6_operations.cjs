const http = require('http');

const BASE_URL = 'http://localhost:5002/api/v1';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✖ [FAIL] ${message}`);
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

async function runChunk6Tests() {
  console.log('================================================================');
  console.log('   CHUNK 6: OPERATIONS, CHAT, MAINTENANCE, REVIEWS & DISPUTES   ');
  console.log('================================================================\n');

  try {
    // 1. Authenticate Personas
    console.log('--- Step 1: Login Personas ---');
    const memberLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'member@studioi.com',
      password: 'StudioI@Member2026',
    });
    const memberToken = memberLogin.body.token;
    const memberId = memberLogin.body.user.id;
    const memberHeaders = { Authorization: `Bearer ${memberToken}` };

    const hostLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'host@studioi.com',
      password: 'StudioI@Host2026',
    });
    const hostToken = hostLogin.body.token;
    const hostId = hostLogin.body.user.id;
    const hostHeaders = { Authorization: `Bearer ${hostToken}` };

    const adminLogin = await req(`${BASE_URL}/auth/login`, 'POST', {}, {
      email: 'admin@studioi.com',
      password: 'StudioI@Admin2026',
    });
    const adminToken = adminLogin.body.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    assert(memberToken && hostToken && adminToken, 'All 3 personas authenticated');

    // Get workspace
    const wsRes = await req(`${BASE_URL}/workspaces/lehariya-jaipur`);
    const workspaceId = wsRes.body.id;
    assert(workspaceId, 'Workspace Lehariya identified');

    // 2. Banners
    console.log('\n--- Step 2: Banners ---');
    const bannersRes = await req(`${BASE_URL}/operations/banners`);
    assert(bannersRes.status === 200 && Array.isArray(bannersRes.body), `Active banners returned: ${bannersRes.body.length}`);

    // 3. Wishlist
    console.log('\n--- Step 3: Wishlist Operations ---');
    const toggleAdd = await req(`${BASE_URL}/operations/wishlist/toggle`, 'POST', memberHeaders, { workspaceId });
    assert(toggleAdd.status === 201 && (toggleAdd.body.inWishlist === true || toggleAdd.body.inWishlist === false), 'Wishlist toggle responded cleanly');

    const wishlistFetch = await req(`${BASE_URL}/operations/wishlist`, 'GET', memberHeaders);
    assert(wishlistFetch.status === 200 && Array.isArray(wishlistFetch.body), 'Wishlist fetched as array');

    // 4. Reviews & Rating Aggregation
    console.log('\n--- Step 4: Reviews & Rating Aggregation ---');
    const reviewRes = await req(`${BASE_URL}/operations/reviews`, 'POST', memberHeaders, {
      workspaceId,
      rating: 5,
      comment: 'Top-tier ergonomics, ultra-fast fiber internet and premium meeting suites!',
    });
    assert(reviewRes.status === 201 && reviewRes.body.rating === 5, 'Review successfully submitted');

    const reviewsFetch = await req(`${BASE_URL}/operations/reviews/${workspaceId}`);
    assert(reviewsFetch.status === 200 && reviewsFetch.body.some(r => r.comment && r.comment.includes('Top-tier ergonomics')), 'Submitted review visible in workspace reviews');

    // 5. In-App Chat
    console.log('\n--- Step 5: In-App Chat Messaging ---');
    const sendMsg1 = await req(`${BASE_URL}/operations/chat/send`, 'POST', memberHeaders, {
      receiverId: hostId,
      workspaceId,
      message: 'Hello Host, can I request an ergonomic footrest for tomorrow?',
    });
    assert(sendMsg1.status === 201 && sendMsg1.body.message.includes('footrest'), 'Member sent chat message to Host');

    const sendMsg2 = await req(`${BASE_URL}/operations/chat/send`, 'POST', hostHeaders, {
      receiverId: memberId,
      workspaceId,
      message: 'Hi Member! Yes, our operations team will have it ready at desk LH-01.',
    });
    assert(sendMsg2.status === 201 && sendMsg2.body.message.includes('ready at desk'), 'Host replied to Member');

    const historyRes = await req(`${BASE_URL}/operations/chat/${hostId}`, 'GET', memberHeaders);
    assert(historyRes.status === 200 && historyRes.body.length >= 2, `Chat history contains ${historyRes.body.length} messages`);

    // 6. Maintenance Issue Lifecycle
    console.log('\n--- Step 6: Maintenance Request Lifecycle ---');
    const issueRes = await req(`${BASE_URL}/operations/maintenance/report`, 'POST', memberHeaders, {
      workspaceId,
      title: 'A/C Temperature adjustment required in Cabin B',
      description: 'Room is running slightly cold at 19C, please set to 23C.',
      priority: 'MEDIUM',
    });
    assert(issueRes.status === 201 && issueRes.body.status === 'OPEN', 'Maintenance request logged with status OPEN');
    const issueId = issueRes.body.id;

    const issuesFetch = await req(`${BASE_URL}/operations/maintenance/issues?workspaceId=${workspaceId}`, 'GET', hostHeaders);
    assert(issuesFetch.status === 200 && issuesFetch.body.some(i => i.id === issueId), 'Host can inspect logged maintenance issue');

    const updateStatus = await req(`${BASE_URL}/operations/maintenance/issues/${issueId}/status`, 'PATCH', hostHeaders, {
      status: 'RESOLVED',
    });
    assert(updateStatus.status === 200 && updateStatus.body.status === 'RESOLVED', 'Host resolved maintenance issue');

    // 7. Disputes Lifecycle
    console.log('\n--- Step 7: Dispute Resolution Lifecycle ---');
    // Get existing bookings for member or create a confirmed one
    const myBookings = await req(`${BASE_URL}/bookings/my`, 'GET', memberHeaders);
    let targetBookingId = myBookings.body[0]?.id;

    if (!targetBookingId) {
      // Create exclusive hold first
      const floorId = wsRes.body.buildings[0]?.floors[0]?.id;
      const holdRes = await req(`${BASE_URL}/bookings/hold`, 'POST', memberHeaders, {
        unitId: 'LH-01-D03',
        planType: 'DAY_PASS',
        startDate: new Date().toISOString().split('T')[0],
      });
      const holdToken = holdRes.body.holdToken;

      const reserveRes = await req(`${BASE_URL}/bookings/reserve`, 'POST', memberHeaders, {
        holdToken,
        guestCount: 1,
        userNotes: 'Test booking for dispute QA',
      });
      targetBookingId = reserveRes.body.id;
    }

    assert(targetBookingId, `Target booking identified: ${targetBookingId}`);

    const disputeRes = await req(`${BASE_URL}/operations/disputes/file`, 'POST', memberHeaders, {
      bookingId: targetBookingId,
      reason: 'Meeting suite projector cable was missing during morning session.',
      description: 'Cable was absent on arrival, delayed client presentation.',
    });
    assert(disputeRes.status === 201 && disputeRes.body.status === 'OPEN', 'Dispute logged by member');
    const disputeId = disputeRes.body.id;

    const allDisputes = await req(`${BASE_URL}/operations/disputes`, 'GET', adminHeaders);
    assert(allDisputes.status === 200 && allDisputes.body.some(d => d.id === disputeId), 'Admin viewed open disputes');

    const resolveDispute = await req(`${BASE_URL}/operations/disputes/${disputeId}/resolve`, 'POST', adminHeaders, {
      resolutionNotes: 'Credited ₹200 wallet credit to member and replaced cable.',
      status: 'RESOLVED',
    });
    assert((resolveDispute.status === 200 || resolveDispute.status === 201) && resolveDispute.body.status === 'RESOLVED', 'Admin successfully resolved dispute');

    console.log(`\n================================================================`);
    console.log(`   CHUNK 6 RESULTS: ${passed} PASSED, ${failed} FAILED           `);
    console.log(`================================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal Chunk 6 test error:', err);
    process.exit(1);
  }
}

runChunk6Tests();
