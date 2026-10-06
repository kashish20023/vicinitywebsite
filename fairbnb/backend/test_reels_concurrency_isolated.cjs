const { PrismaClient } = require('@prisma/client');
const { ReelsService } = require('./dist/src/reels/reels.service');

// Use isolated test database
const TEST_DATABASE_URL = 'postgresql://postgres:Admin@123@localhost:5433/fairbnb_reels_test?schema=public';
const prisma = new PrismaClient({
  datasources: {
    db: { url: TEST_DATABASE_URL }
  }
});

const mockCloudinaryService = {};

const reelsService = new ReelsService(
  prisma,
  mockCloudinaryService
);

async function runAcceptanceConcurrencySuite() {
  console.log('🧪 Starting Reels Concurrency & Integrity Test Suite on Isolated DB: fairbnb_reels_test');

  // Clean test tables
  await prisma.reelLike.deleteMany({});
  await prisma.reel.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Setup Fixture Users & Reel
  const hostUser = await prisma.user.create({
    data: {
      email: 'host_isolated@test.com',
      name: 'Isolated Host',
      phone: '+919999911111',
      passwordHash: 'dummyhash',
      role: 'HOST'
    }
  });

  const testUsers = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `tester_${i}@test.com`,
        name: `Tester ${i}`,
        phone: `+91999992222${i}`,
        passwordHash: 'dummyhash',
        role: 'USER'
      }
    });
    testUsers.push(user);
  }

  const testReel = await prisma.reel.create({
    data: {
      creatorId: hostUser.id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/test.mp4',
      hlsUrl: 'https://res.cloudinary.com/demo/video/upload/test.m3u8',
      caption: 'Isolated Concurrency Reel Test',
      status: 'PUBLISHED',
      likeCount: 0
    }
  });

  console.log(`✅ Fixtures created: 1 published reel (${testReel.id}), 5 test users.`);

  // Test Case A: Repeated Sequential Requests (Idempotency)
  console.log('\n--- Test Case A: Repeated Sequential Requests (Idempotency) ---');
  const user1 = testUsers[0];
  const rep1 = await reelsService.likeReel(user1.id, testReel.id);
  const rep2 = await reelsService.likeReel(user1.id, testReel.id);
  const rep3 = await reelsService.likeReel(user1.id, testReel.id);

  console.log(`Repetition 1: liked=${rep1.liked}, likeCount=${rep1.likeCount}`);
  console.log(`Repetition 2: liked=${rep2.liked}, likeCount=${rep2.likeCount}`);
  console.log(`Repetition 3: liked=${rep3.liked}, likeCount=${rep3.likeCount}`);

  if (rep1.likeCount !== 1 || rep2.likeCount !== 1 || rep3.likeCount !== 1) {
    throw new Error(`FAIL: Idempotency violated. Expected likeCount=1, got ${rep3.likeCount}`);
  }
  const relCountA = await prisma.reelLike.count({ where: { reelId: testReel.id } });
  if (relCountA !== 1) {
    throw new Error(`FAIL: Expected 1 relation row, found ${relCountA}`);
  }
  console.log('✅ Test Case A Passed: Idempotent repeat requests produce exact count 1.');

  // Test Case B: Same-User Concurrency (Race Condition on Single User)
  console.log('\n--- Test Case B: Same-User Concurrency (5 concurrent likes by User 1) ---');
  const sameUserPromises = [
    reelsService.likeReel(user1.id, testReel.id),
    reelsService.likeReel(user1.id, testReel.id),
    reelsService.likeReel(user1.id, testReel.id),
    reelsService.likeReel(user1.id, testReel.id),
    reelsService.likeReel(user1.id, testReel.id),
  ];
  const sameUserResults = await Promise.all(sameUserPromises);
  const relCountB = await prisma.reelLike.count({ where: { reelId: testReel.id } });
  const reelB = await prisma.reel.findUnique({ where: { id: testReel.id } });

  console.log(`Same-user concurrent results: ${sameUserResults.map(r => r.likeCount).join(', ')}`);
  console.log(`Database state: Reel.likeCount=${reelB?.likeCount}, ReelLike rows=${relCountB}`);

  if (relCountB !== 1 || reelB?.likeCount !== 1) {
    throw new Error(`FAIL: Same-user concurrency failed. Reel.likeCount=${reelB?.likeCount}, rows=${relCountB}`);
  }
  console.log('✅ Test Case B Passed: Same-user concurrency safely handles duplicate key without 25P02 abort.');

  // Test Case C: Different-User Concurrency (5 users liking simultaneously)
  console.log('\n--- Test Case C: Different-User Concurrency (5 users liking concurrently) ---');
  // First unlike user1 to reset to 0
  await reelsService.unlikeReel(user1.id, testReel.id);
  const resetCount = await prisma.reelLike.count({ where: { reelId: testReel.id } });
  console.log(`Reset count to: ${resetCount}`);

  const diffUserPromises = testUsers.map(u => reelsService.likeReel(u.id, testReel.id));
  const diffUserResults = await Promise.all(diffUserPromises);

  const relCountC = await prisma.reelLike.count({ where: { reelId: testReel.id } });
  const reelC = await prisma.reel.findUnique({ where: { id: testReel.id } });
  console.log(`Diff-user results: ${diffUserResults.map(r => r.likeCount).join(', ')}`);
  console.log(`Final DB state: Reel.likeCount=${reelC?.likeCount}, ReelLike rows=${relCountC}`);

  if (relCountC !== 5 || reelC?.likeCount !== 5) {
    throw new Error(`FAIL: Different-user concurrency mismatch. Expected 5, got likeCount=${reelC?.likeCount}, rows=${relCountC}`);
  }
  console.log('✅ Test Case C Passed: 5 concurrent unique users result in exact 5 likes with 0 lost updates.');

  // Test Case D: Unlike and Like/Unlike Interleaving
  console.log('\n--- Test Case D: Unlike and Like/Unlike Interleaving ---');
  // Simultaneously: User 1, 2, 5 unlike
  const interleaveOps = [
    reelsService.unlikeReel(testUsers[0].id, testReel.id),
    reelsService.unlikeReel(testUsers[1].id, testReel.id),
    reelsService.unlikeReel(testUsers[4].id, testReel.id),
  ];
  await Promise.all(interleaveOps);

  const relCountD = await prisma.reelLike.count({ where: { reelId: testReel.id } });
  const reelD = await prisma.reel.findUnique({ where: { id: testReel.id } });
  console.log(`Interleaved unlikes complete. Reel.likeCount=${reelD?.likeCount}, ReelLike rows=${relCountD}`);

  // Test Users 3 and 4 should still be liked (total 2)
  if (relCountD !== 2 || reelD?.likeCount !== 2) {
    throw new Error(`FAIL: Interleaving mismatch. Expected 2, got likeCount=${reelD?.likeCount}, rows=${relCountD}`);
  }

  // Interleave: Rapid parallel like/unlike toggles on User 1 and User 2
  const rapidToggles = [
    reelsService.likeReel(testUsers[0].id, testReel.id),
    reelsService.unlikeReel(testUsers[0].id, testReel.id),
    reelsService.likeReel(testUsers[1].id, testReel.id),
    reelsService.likeReel(testUsers[0].id, testReel.id),
  ];
  await Promise.all(rapidToggles);

  const finalRelCount = await prisma.reelLike.count({ where: { reelId: testReel.id } });
  const finalReel = await prisma.reel.findUnique({ where: { id: testReel.id } });
  console.log(`Post rapid toggles: Reel.likeCount=${finalReel?.likeCount}, ReelLike rows=${finalRelCount}`);

  // Test Case E: Aggregate count vs actual relation count consistency
  console.log('\n--- Test Case E: Aggregate Count vs Actual Relation Count ---');
  if (finalReel?.likeCount !== finalRelCount) {
    throw new Error(`FAIL: Inconsistency! Reel.likeCount (${finalReel?.likeCount}) !== ReelLike relation count (${finalRelCount})`);
  }
  console.log(`✅ Test Case E Passed: Perfect mathematical parity: Reel.likeCount (${finalReel?.likeCount}) === ReelLike rows (${finalRelCount})`);

  // Test Case F: UI Contract Verification
  console.log('\n--- Test Case F: UI Contract Verification ---');
  const uiContractLike = await reelsService.likeReel(testUsers[0].id, testReel.id);
  if (typeof uiContractLike.liked !== 'boolean' || typeof uiContractLike.likeCount !== 'number') {
    throw new Error(`FAIL: UI contract broken for likeReel. Received: ${JSON.stringify(uiContractLike)}`);
  }
  const uiContractUnlike = await reelsService.unlikeReel(testUsers[0].id, testReel.id);
  if (typeof uiContractUnlike.liked !== 'boolean' || typeof uiContractUnlike.likeCount !== 'number') {
    throw new Error(`FAIL: UI contract broken for unlikeReel. Received: ${JSON.stringify(uiContractUnlike)}`);
  }
  console.log(`✅ Test Case F Passed: UI contract verified: like=${JSON.stringify(uiContractLike)}, unlike=${JSON.stringify(uiContractUnlike)}`);

  console.log('\n======================================================');
  console.log('🏆 ALL REELS CONCURRENCY & INTEGRITY TESTS PASSED!');
  console.log('======================================================');
}

runAcceptanceConcurrencySuite()
  .catch(err => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
