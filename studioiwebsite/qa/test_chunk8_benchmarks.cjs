const http = require('http');

const BASE_URL = 'http://localhost:5002/api/v1';
const SAMPLES = 100;

function req(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqHeaders = Object.assign({}, headers);
    let payload = null;

    if (body !== null && body !== undefined) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const start = process.hrtime.bigint();
    const r = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        resolve({ status: res.statusCode, durationMs });
      });
    });

    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function calcStats(latencies) {
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const mean = sum / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const min = latencies[0];
  const max = latencies[latencies.length - 1];

  return {
    count: latencies.length,
    min: min.toFixed(2),
    max: max.toFixed(2),
    mean: mean.toFixed(2),
    p50: p50.toFixed(2),
    p95: p95.toFixed(2),
    p99: p99.toFixed(2),
  };
}

async function runBenchmarks() {
  console.log('================================================================');
  console.log(`   CHUNK 8: LATENCY BENCHMARKS (${SAMPLES} SAMPLES PER ROUTE)  `);
  console.log('================================================================\n');

  // Setup context
  const wsRes = await req(`${BASE_URL}/workspaces/lehariya-jaipur`);
  const wsId = '6f6b5bbb-4b27-4657-9ed1-5e42aadd78c6';
  const floorId = '85b1a37a-a43b-48ad-8181-fc46f990ad8e';
  const planId = '328404a0-e222-446a-9fa5-e1fc8488e001';
  const unitId = 'a1010101-0001-4000-8000-000000000001';

  const now = new Date();
  const startStr = new Date(now.getTime() + 86400000).toISOString();
  const endStr = new Date(now.getTime() + 86400000 + 8 * 3600000).toISOString();

  // 1. GET /workspaces
  console.log(`1. Benchmarking GET /workspaces (${SAMPLES} requests)...`);
  const wsLatencies = [];
  for (let i = 0; i < SAMPLES; i++) {
    const res = await req(`${BASE_URL}/workspaces`);
    wsLatencies.push(res.durationMs);
  }
  const wsStats = calcStats(wsLatencies);
  console.log(`   -> p50: ${wsStats.p50}ms | p95: ${wsStats.p95}ms | mean: ${wsStats.mean}ms (min: ${wsStats.min}ms, max: ${wsStats.max}ms)`);

  // 2. GET /workspaces/floors/:id/availability
  console.log(`\n2. Benchmarking GET /workspaces/floors/:id/availability (${SAMPLES} requests)...`);
  const floorLatencies = [];
  for (let i = 0; i < SAMPLES; i++) {
    const res = await req(`${BASE_URL}/workspaces/floors/${floorId}/availability?startDateTime=${startStr}&endDateTime=${endStr}`);
    floorLatencies.push(res.durationMs);
  }
  const floorStats = calcStats(floorLatencies);
  console.log(`   -> p50: ${floorStats.p50}ms | p95: ${floorStats.p95}ms | mean: ${floorStats.mean}ms (min: ${floorStats.min}ms, max: ${floorStats.max}ms)`);

  // 3. POST /bookings/quote
  console.log(`\n3. Benchmarking POST /bookings/quote (${SAMPLES} requests)...`);
  const quoteLatencies = [];
  for (let i = 0; i < SAMPLES; i++) {
    const res = await req(`${BASE_URL}/bookings/quote`, 'POST', {}, {
      unitId,
      planId,
      startDateTime: startStr,
      endDateTime: endStr,
      couponCode: 'STUDIO10',
    });
    quoteLatencies.push(res.durationMs);
  }
  const quoteStats = calcStats(quoteLatencies);
  console.log(`   -> p50: ${quoteStats.p50}ms | p95: ${quoteStats.p95}ms | mean: ${quoteStats.mean}ms (min: ${quoteStats.min}ms, max: ${quoteStats.max}ms)`);

  // 4. GET /operations/banners
  console.log(`\n4. Benchmarking GET /operations/banners (${SAMPLES} requests)...`);
  const bannerLatencies = [];
  for (let i = 0; i < SAMPLES; i++) {
    const res = await req(`${BASE_URL}/operations/banners`);
    bannerLatencies.push(res.durationMs);
  }
  const bannerStats = calcStats(bannerLatencies);
  console.log(`   -> p50: ${bannerStats.p50}ms | p95: ${bannerStats.p95}ms | mean: ${bannerStats.mean}ms (min: ${bannerStats.min}ms, max: ${bannerStats.max}ms)`);

  // Output markdown table
  const resultsTable = {
    workspaces: wsStats,
    floorAvailability: floorStats,
    pricingQuote: quoteStats,
    banners: bannerStats,
  };

  const fs = require('fs');
  fs.writeFileSync('C:/Users/shubham/.gemini/antigravity-ide/brain/073193f9-9fe1-4b29-9c46-5adfac874a33/scratch/benchmark_results.json', JSON.stringify(resultsTable, null, 2), 'utf8');
  console.log('\nBenchmark results saved to scratch/benchmark_results.json');
}

runBenchmarks();
