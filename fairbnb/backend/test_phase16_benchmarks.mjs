import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();
const BACKEND_URL = 'http://localhost:5001';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const url = new URL(path, BACKEND_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = Date.now() - start;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          duration,
          data: json,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        duration: Date.now() - start,
        error: err.message,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runDatabaseQueryCostAnalysis() {
  console.log('\n--- 16.1 & 16.2 DATABASE QUERY COST & SCALE ANALYSIS ---');
  
  // Run EXPLAIN ANALYZE on the ranking query via raw SQL
  const explainResult = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT "id", "videoUrl", "hlsUrl", "posterUrl", "duration", "caption", "rankingScore", "publishedAt"
    FROM "Reel"
    WHERE "status" = 'PUBLISHED'
    ORDER BY "rankingScore" DESC, "publishedAt" DESC, "id" DESC
    LIMIT 11;
  `);

  console.log('PostgreSQL EXPLAIN ANALYZE Plan:');
  explainResult.forEach((row) => {
    console.log(`  ${row['QUERY PLAN'] || JSON.stringify(row)}`);
  });
}

async function runConcurrencyBenchmarks(concurrentCount) {
  console.log(`\n--- 16.5 CONCURRENT FEED REQUEST BENCHMARK (${concurrentCount} Concurrent Callers) ---`);
  
  const promises = [];
  for (let i = 0; i < concurrentCount; i++) {
    promises.push(makeRequest('/reels?limit=10'));
  }

  const startAll = Date.now();
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startAll;

  const latencies = results.map((r) => r.duration).sort((a, b) => a - b);
  const successCount = results.filter((r) => r.statusCode === 200).length;
  const errorCount = results.length - successCount;

  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  console.log(`Results for ${concurrentCount} concurrent feed requests:`);
  console.log(`  - Total Batch Time: ${totalDuration} ms`);
  console.log(`  - Successful (200 OK): ${successCount}/${concurrentCount}`);
  console.log(`  - Errors / Throttle: ${errorCount}/${concurrentCount}`);
  console.log(`  - Average Latency: ${avg} ms`);
  console.log(`  - p50 Latency: ${p50} ms`);
  console.log(`  - p95 Latency: ${p95} ms`);
  console.log(`  - p99 Latency: ${p99} ms`);

  return { concurrentCount, totalDuration, successCount, p50, p95, p99, avg };
}

async function main() {
  try {
    await runDatabaseQueryCostAnalysis();
    await runConcurrencyBenchmarks(10);
    await runConcurrencyBenchmarks(50);
    await runConcurrencyBenchmarks(100);
  } catch (err) {
    console.error('Benchmark Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
