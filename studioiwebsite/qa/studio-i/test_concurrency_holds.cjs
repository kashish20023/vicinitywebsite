const API = 'http://localhost:5002/api/v1';

async function testConcurrency() {
  console.log('=== CONCURRENCY TEST: 20 SYNCHRONIZED COMPETING HOLDS FOR SAME UNIT ===\n');

  // 1. Create or login 20 distinct synthetic test users
  console.log('Step 1: Authenticating 20 distinct synthetic users...');
  const users = [];
  for (let i = 1; i <= 20; i++) {
    const email = `concurrency_user_${i}_${Date.now()}@studioi-test.com`;
    const password = 'TestPassword@123';
    const regRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: `Concurrent Tester #${i}` }),
    });
    const regData = await regRes.json();
    users.push({ id: regData.user.id, token: regData.token });
  }
  console.log(`✔ 20 distinct authenticated sessions established.`);

  // 2. Target a specific unit (e.g. Hot Desk #2: LH-01-D02)
  const wsRes = await fetch(`${API}/workspaces`);
  const workspaces = await wsRes.json();
  const floor = workspaces[0].buildings[0].floors[0];
  const targetUnit = floor.units.find(u => u.unitCode === 'LH-01-D02') || floor.units[1];
  console.log(`\nStep 2: Target unit selected: ${targetUnit.unitCode} (ID: ${targetUnit.id})`);

  const startDateTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const endDateTime = new Date(Date.now() + 32 * 3600 * 1000).toISOString();

  // 3. Launch 20 concurrent requests simultaneously using Promise.all
  console.log(`\nStep 3: Dispatching 20 synchronized competing hold requests...`);
  const requests = users.map((user, idx) => {
    return fetch(`${API}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        unitId: targetUnit.id,
        startDateTime,
        endDateTime,
      }),
    }).then(async (res) => {
      const data = await res.json();
      return { userIndex: idx + 1, status: res.status, ok: res.ok, data };
    });
  });

  const results = await Promise.all(requests);

  const successes = results.filter(r => r.ok);
  const conflicts = results.filter(r => r.status === 409);
  const others = results.filter(r => !r.ok && r.status !== 409);

  console.log('\n--- CONCURRENCY TEST RESULTS ---');
  console.log(`Total Requests Dispatched: ${results.length}`);
  console.log(`Successful Holds Acquired: ${successes.length} (Expected: 1)`);
  console.log(`Conflicting Holds Blocked (HTTP 409): ${conflicts.length} (Expected: 19)`);
  console.log(`Other Statuses: ${others.length}`);

  if (successes.length === 1 && conflicts.length === 19) {
    console.log('\n🌟 INVARIANT VERIFIED: Exactly ONE hold succeeded and 19 competing requests were safely blocked.');
    console.log(`Winner: User #${successes[0].userIndex} (Hold ID: ${successes[0].data.holdId})`);
  } else {
    console.error(`\n❌ INVARIANT VIOLATION: Expected exactly 1 success and 19 conflicts! Got ${successes.length} successes.`);
    process.exit(1);
  }
}

testConcurrency().catch(err => {
  console.error('Fatal concurrency test error:', err);
  process.exit(1);
});
