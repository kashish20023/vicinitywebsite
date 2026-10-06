const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5002/api/v1';

function calculatePercentiles(latencies) {
  latencies.sort((a, b) => a - b);
  const n = latencies.length;
  const p50 = latencies[Math.floor(n * 0.50)];
  const p95 = latencies[Math.floor(n * 0.95)];
  const p99 = latencies[Math.floor(n * 0.99)];
  const sum = latencies.reduce((acc, val) => acc + val, 0);
  const avg = (sum / n).toFixed(2);
  const min = latencies[0];
  const max = latencies[n - 1];
  return { p50, p95, p99, avg, min, max, count: n };
}

async function measureEndpoint(name, method, url, headers, body, samples = 100) {
  process.stdout.write(`Benchmarking ${name} (${samples} samples)... `);
  const latencies = [];
  let errorCount = 0;

  // Warm-up 5 requests
  for (let i = 0; i < 5; i++) {
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch { }
  }

  for (let i = 0; i < samples; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
      const t1 = performance.now();
      latencies.push(Math.round(t1 - t0));
      if (!res.ok) errorCount++;
    } catch {
      errorCount++;
    }
  }

  const stats = calculatePercentiles(latencies);
  stats.errorRate = ((errorCount / samples) * 100).toFixed(1) + '%';
  console.log(`p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms | errors: ${stats.errorRate}`);
  return { name, method, url, ...stats };
}

async function runBenchmarks() {
  console.log('--- STUDIO I COWORKING PLATFORM: API BENCHMARKS & LATENCY SUITE ---');

  // 1. Authenticate Member & Admin
  const memberRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'member@studioi.com', password: 'StudioI@Member2026' }),
  });
  const memberLogin = await memberRes.json();
  const memberToken = memberLogin.token;

  const adminRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@studioi.com', password: 'StudioI@Admin2026' }),
  });
  const adminLogin = await adminRes.json();
  const adminToken = adminLogin.token;

  // 2. Fetch seed workspace & unit
  const wsRes = await fetch(`${API_BASE}/workspaces/lehariya-jaipur`);
  const ws = await wsRes.json();
  const floorId = ws.buildings[0].floors[0].id;
  const unitId = ws.buildings[0].floors[0].units[0].id;
  const planId = ws.bookingPlans[0].id;

  const results = [];

  // Route 1: Health Liveness
  results.push(await measureEndpoint(
    'Health Liveness',
    'GET',
    `${API_BASE}/health/liveness`,
    {},
    null,
    100
  ));

  // Route 2: Catalog Workspaces List
  results.push(await measureEndpoint(
    'Explore Workspaces Catalog',
    'GET',
    `${API_BASE}/workspaces?city=Jaipur`,
    {},
    null,
    100
  ));

  // Route 3: Workspace Detail & Buildings
  results.push(await measureEndpoint(
    'Workspace Details by Slug',
    'GET',
    `${API_BASE}/workspaces/lehariya-jaipur`,
    {},
    null,
    100
  ));

  // Route 4: Floor Availability Query
  results.push(await measureEndpoint(
    'Floor Plan Live Availability',
    'GET',
    `${API_BASE}/workspaces/floors/${floorId}/availability?startTime=2026-09-24T09:00:00Z&endTime=2026-09-24T18:00:00Z`,
    {},
    null,
    100
  ));

  // Route 5: Authoritative Pricing Quote
  results.push(await measureEndpoint(
    'Authoritative Price Quote Calculation',
    'POST',
    `${API_BASE}/bookings/quote`,
    { Authorization: `Bearer ${memberToken}` },
    {
      unitId,
      planId,
      couponCode: 'STUDIO10',
      startDateTime: '2026-09-24T09:00:00Z',
      endDateTime: '2026-09-24T18:00:00Z',
    },
    100
  ));

  // Route 6: User Bookings List
  results.push(await measureEndpoint(
    'Member Bookings Stream',
    'GET',
    `${API_BASE}/bookings/my`,
    { Authorization: `Bearer ${memberToken}` },
    null,
    100
  ));

  // Route 7: Admin Operations Dashboard
  results.push(await measureEndpoint(
    'Admin Operations KPI Dashboard',
    'GET',
    `${API_BASE}/admin/dashboard`,
    { Authorization: `Bearer ${adminToken}` },
    null,
    100
  ));

  // Route 8: Admin Finance Summary
  results.push(await measureEndpoint(
    'Admin Financial Reconciliation Summary',
    'GET',
    `${API_BASE}/admin/finance/summary`,
    { Authorization: `Bearer ${adminToken}` },
    null,
    100
  ));

  // Write CSV
  const reportDir = path.join(__dirname, 'reports', '2026-09-22-final-run');
  fs.mkdirSync(reportDir, { recursive: true });

  const csvRows = [
    'Endpoint,Method,SampleCount,MinMs,AvgMs,p50Ms,p95Ms,p99Ms,MaxMs,ErrorRate',
    ...results.map((r) =>
      `"${r.name}","${r.method}",${r.count},${r.min},${r.avg},${r.p50},${r.p95},${r.p99},${r.max},${r.errorRate}`
    ),
  ];

  const csvPath = path.join(reportDir, 'API_TIMINGS.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`\n✓ Saved CSV report to: ${csvPath}`);

  return results;
}

runBenchmarks().catch(console.error);
