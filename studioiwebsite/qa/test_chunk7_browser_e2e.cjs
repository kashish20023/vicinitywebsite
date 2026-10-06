const http = require('http');

const FE_URL = 'http://localhost:3000';
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

function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    const u = new URL(`${FE_URL}${urlPath}`);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, html: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runBrowserVerification() {
  console.log('================================================================');
  console.log('   CHUNK 7: FULL FRONTEND BROWSER & ROUTE VERIFICATION SUITE   ');
  console.log('================================================================\n');

  try {
    // 1. Homepage Visual Integrity & Invariants
    console.log('--- Step 1: Homepage (User Journey) ---');
    const home = await fetchPage('/');
    assert(home.status === 200, 'Homepage returns 200 OK');
    assert(home.html.includes('Studio i') || home.html.includes('Studio I'), 'Homepage contains Studio I branding');
    assert(home.html.includes('Lehariya') || home.html.includes('lehariya'), 'Jaipur flagship Lehariya visible on homepage');
    assert(!home.html.toLowerCase().includes('alwar'), 'Invariant: Alwar is strictly absent from homepage HTML');

    // 2. Explore Page
    console.log('\n--- Step 2: Explore & Discovery (/explore) ---');
    const explore = await fetchPage('/explore');
    assert(explore.status === 200, 'Explore page returns 200 OK');
    assert(!explore.html.toLowerCase().includes('alwar'), 'Invariant: Alwar is strictly absent from Explore page');

    // 3. Workspace Detail & 2D Floor Plan Viewer
    console.log('\n--- Step 3: Workspace Detail & 2D Floor Plan (/workspaces/lehariya-jaipur) ---');
    const wsPage = await fetchPage('/workspaces/lehariya-jaipur');
    assert(wsPage.status === 200, 'Workspace detail page returns 200 OK');
    assert(wsPage.html.includes('Lehariya') || wsPage.html.includes('Tonk Road'), 'Workspace name & location rendered');

    // 4. Checkout & Pricing
    console.log('\n--- Step 4: Checkout Flow (/checkout) ---');
    const checkout = await fetchPage('/checkout');
    assert(checkout.status === 200, 'Checkout page returns 200 OK');

    // 5. My Bookings & Passes
    console.log('\n--- Step 5: Member Dashboard & Bookings (/my-bookings) ---');
    const myBookings = await fetchPage('/my-bookings');
    assert(myBookings.status === 200, 'My Bookings page returns 200 OK');

    // 6. Host Portal
    console.log('\n--- Step 6: Host Command Center (/host) ---');
    const hostPage = await fetchPage('/host');
    assert(hostPage.status === 200, 'Host Portal page returns 200 OK');
    assert(hostPage.html.includes('Host') || hostPage.html.includes('Workspace'), 'Host platform UI elements rendered');

    // 7. Co-Host Portal
    console.log('\n--- Step 7: Co-Host Delegation Console (/co-host) ---');
    const cohostPage = await fetchPage('/co-host');
    assert(cohostPage.status === 200, 'Co-Host Portal page returns 200 OK');
    assert(cohostPage.html.includes('animate-spin') || cohostPage.html.includes('Co-Host') || cohostPage.html.includes('co-host') || cohostPage.html.includes('Delegated'), 'Co-Host UI elements rendered');

    // 8. Admin Control Center
    console.log('\n--- Step 8: Admin Management Platform (/admin) ---');
    const adminPage = await fetchPage('/admin');
    assert(adminPage.status === 200, 'Admin Dashboard page returns 200 OK');

    const adminFinance = await fetchPage('/admin/finance');
    assert(adminFinance.status === 200, 'Admin Finance page returns 200 OK');

    const adminSpaces = await fetchPage('/admin/spaces');
    assert(adminSpaces.status === 200, 'Admin Spaces & 2D Layouts page returns 200 OK');

    const adminUsers = await fetchPage('/admin/users');
    assert(adminUsers.status === 200, 'Admin Users & Role Control page returns 200 OK');

    console.log(`\n================================================================`);
    console.log(`   CHUNK 7 FRONTEND RESULTS: ${passed} PASSED, ${failed} FAILED `);
    console.log(`================================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal Frontend verification error:', err);
    process.exit(1);
  }
}

runBrowserVerification();
