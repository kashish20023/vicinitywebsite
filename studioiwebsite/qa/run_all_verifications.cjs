const { execSync } = require('child_process');
const path = require('path');

const qaDir = 'C:/Users/shubham/OneDrive/Desktop/studio i/studio-i-complete/qa';

const suites = [
  { name: 'Chunk 2: Auth & 4-Role Personas', file: 'test_chunk2_auth_roles.cjs' },
  { name: 'Chunk 3: Workspaces & 2D Floor Plan Discovery', file: 'test_chunk3_listings_2d.cjs' },
  { name: 'Chunk 4: Concurrency Gate & Hold Lifecycle', file: 'test_chunk4_concurrency_lifecycle.cjs' },
  { name: 'Chunk 5: Payments, Refunds & Settlements', file: 'test_chunk5_payments_financials.cjs' },
  { name: 'Chunk 6: Operations, Chat, Maintenance & Disputes', file: 'test_chunk6_operations.cjs' },
  { name: 'Chunk 7: Comprehensive Per-API Matrix', file: 'test_chunk7_per_api_matrix.cjs' },
  { name: 'Chunk 7: Full Frontend Route & E2E Verification', file: 'test_chunk7_browser_e2e.cjs' },
  { name: 'Chunk 8: Latency Benchmarks (100 Samples)', file: 'test_chunk8_benchmarks.cjs' },
];

console.log('========================================================================');
console.log('      STUDIO I COMPLETE PLATFORM — UNIFIED MASTER QA TEST RUNNER        ');
console.log('========================================================================\n');

let totalPassedSuites = 0;

for (const s of suites) {
  console.log(`>>> Executing Suite: ${s.name} ...`);
  const scriptPath = path.join(qaDir, s.file);
  try {
    const out = execSync(`node "${scriptPath}"`, {
      encoding: 'utf8',
      cwd: 'C:/Users/shubham/OneDrive/Desktop/studio i/studio-i-complete',
    });
    console.log(out.trim());
    console.log(`✔ [SUITE PASSED] ${s.name}\n------------------------------------------------------------------------\n`);
    totalPassedSuites++;
  } catch (err) {
    console.error(`✖ [SUITE FAILED] ${s.name}`);
    console.error(err.stdout || err.message);
    process.exit(1);
  }
}

console.log('========================================================================');
console.log(`   ALL ${totalPassedSuites}/${suites.length} MASTER QA SUITES PASSED FLAWLESSLY WITH 0 DEFECTS! `);
console.log('========================================================================');
