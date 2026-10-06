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
  console.log('   STARTING CHUNK 2 AUTOMATED AUTH & 4-ROLE SECURITY TEST SUITE ');
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
    // 0. Liveness & Readiness Check
    console.log('--- TEST GROUP 0: Infrastructure & Liveness ---');
    const live = await request(`${baseUrl}/health/liveness`);
    assert('Backend liveness returns 200 OK', live.status === 200);

    const ready = await request(`${baseUrl}/health/readiness`);
    assert('Backend readiness returns 200 OK with PostgreSQL CONNECTED', ready.status === 200 && ready.body?.database === 'CONNECTED');

    // 1. Member Authentication & Boundary Limits
    console.log('\n--- TEST GROUP 1: Member (USER) Persona & Access Limits ---');
    const memberLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'member@studioi.com',
      password: 'StudioI@Member2026',
    });
    assert('Member login returns 200 and JWT token', memberLogin.status === 200 && !!memberLogin.body.token);
    assert('Member role is strictly USER', memberLogin.body.user?.role === 'USER');
    const memberToken = memberLogin.body.token;

    const memberHostStats = await request(`${baseUrl}/hosts/dashboard/stats`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert('Member is forbidden (403) from /hosts/dashboard/stats', memberHostStats.status === 403);

    const memberAdminDash = await request(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert('Member is forbidden (403) from /admin/dashboard', memberAdminDash.status === 403);

    // 2. Host Authentication & Permissions
    console.log('\n--- TEST GROUP 2: Host (HOST) Persona & Workspace Access ---');
    const hostLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'host@studioi.com',
      password: 'StudioI@Host2026',
    });
    assert('Host login returns 200 and JWT token', hostLogin.status === 200 && !!hostLogin.body.token);
    assert('Host role is strictly HOST', hostLogin.body.user?.role === 'HOST');
    assert('Host has hostedWorkspaces attached', Array.isArray(hostLogin.body.user?.hostedWorkspaces));
    const hostToken = hostLogin.body.token;

    const hostStats = await request(`${baseUrl}/hosts/dashboard/stats`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    assert('Host successfully accesses /hosts/dashboard/stats (200)', hostStats.status === 200);
    assert('Host stats contains workspaces count and earnings', hostStats.body.workspacesCount >= 1 && hostStats.body.totalEarningsRupees !== undefined);

    const hostWorkspaces = await request(`${baseUrl}/hosts/workspaces`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    assert('Host retrieves their hosted workspaces list (200)', hostWorkspaces.status === 200 && Array.isArray(hostWorkspaces.body));

    const hostAdminDash = await request(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    assert('Host is forbidden (403) from /admin/dashboard', hostAdminDash.status === 403);

    // 3. Admin Authentication & Universal Management
    console.log('\n--- TEST GROUP 3: Admin (ADMIN) Persona & Oversight ---');
    const adminLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'admin@studioi.com',
      password: 'StudioI@Admin2026',
    });
    assert('Admin login returns 200 and JWT token', adminLogin.status === 200 && !!adminLogin.body.token);
    assert('Admin role is strictly ADMIN', adminLogin.body.user?.role === 'ADMIN');
    const adminToken = adminLogin.body.token;

    const adminDash = await request(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('Admin accesses /admin/dashboard (200)', adminDash.status === 200);
    assert('Admin dashboard returns bookings, units, and occupancy', adminDash.body.totalUnits >= 1 && adminDash.body.currency === 'INR');

    const adminHostStats = await request(`${baseUrl}/hosts/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('Admin has universal access to /hosts/dashboard/stats (200)', adminHostStats.status === 200);

    // 4. Co-host Persona & Scoped Delegations
    console.log('\n--- TEST GROUP 4: Co-host Scoped Delegations & Guards ---');
    const cohostLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'cohost@studioi.com',
      password: 'StudioI@Cohost2026',
    });
    assert('Co-host login returns 200 and JWT token', cohostLogin.status === 200 && !!cohostLogin.body.token);
    assert('Co-host has cohostPermissions attached', cohostLogin.body.user?.cohostPermissions?.length >= 1);
    const cohostToken = cohostLogin.body.token;
    const permittedWorkspaceId = cohostLogin.body.user?.cohostPermissions[0]?.workspaceId;

    const cohostWorkspaces = await request(`${baseUrl}/co-host/me/workspaces`, {
      headers: { Authorization: `Bearer ${cohostToken}` },
    });
    assert('Co-host accesses /co-host/me/workspaces (200)', cohostWorkspaces.status === 200);
    assert('Co-host receives assigned Lehariya flagship workspace', cohostWorkspaces.body.length >= 1);

    const cohostPermittedDash = await request(`${baseUrl}/co-host/workspaces/${permittedWorkspaceId}/dashboard`, {
      headers: { Authorization: `Bearer ${cohostToken}` },
    });
    assert('Co-host accesses delegated workspace dashboard (200)', cohostPermittedDash.status === 200);

    const fakeWorkspaceId = '00000000-0000-0000-0000-000000000000';
    const cohostUnassignedDash = await request(`${baseUrl}/co-host/workspaces/${fakeWorkspaceId}/dashboard`, {
      headers: { Authorization: `Bearer ${cohostToken}` },
    });
    assert('Co-host is forbidden (403/404) on unassigned workspace', cohostUnassignedDash.status === 403 || cohostUnassignedDash.status === 404);

    // 5. Public Registration Security
    console.log('\n--- TEST GROUP 5: Registration Security & Injection Defense ---');
    const randomEmail = `testuser_${Date.now()}@example.com`;
    const regAttack = await request(`${baseUrl}/auth/register`, { method: 'POST' }, {
      email: randomEmail,
      password: 'Password@123',
      name: 'Hacker Joe',
      role: 'ADMIN', // Attempted role escalation
    });
    assert('Public registration succeeds', regAttack.status === 201 || regAttack.status === 200);
    assert('Injected ADMIN role is rejected and forced to USER', regAttack.body.user?.role === 'USER');

    // 6. Bad Credentials / Unauthorized Rejection
    console.log('\n--- TEST GROUP 6: Authentication Security Controls ---');
    const badLogin = await request(`${baseUrl}/auth/login`, { method: 'POST' }, {
      email: 'member@studioi.com',
      password: 'WrongPassword123',
    });
    assert('Wrong password returns 401 Unauthorized', badLogin.status === 401);

    const missingToken = await request(`${baseUrl}/admin/dashboard`);
    assert('Unauthenticated request returns 401 Unauthorized', missingToken.status === 401);

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
