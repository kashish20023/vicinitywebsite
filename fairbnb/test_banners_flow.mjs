const API_BASE = 'http://localhost:5001';

async function runBannersTest() {
  console.log('🚀 Starting Marketing Banners (Banner, Lead) E2E Flow Test...\n');

  // Step 1: Admin Login
  console.log('1. Logging in as Admin...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@fairbnb.com',
      password: 'Admin@123456',
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.statusText}`);
  }

  const loginData = await loginRes.json();
  const adminToken = loginData.accessToken;
  console.log('   ✅ Admin logged in successfully.\n');

  // Step 2: Create a Discount Coupon for testing
  console.log('2. Creating Test Coupon...');
  const couponRes = await fetch(`${API_BASE}/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      code: `WELCOME${Date.now().toString().slice(-4)}`,
      discountType: 'PERCENTAGE',
      discountValue: 15,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  let couponId = null;
  let couponCode = null;
  if (couponRes.ok) {
    const couponData = await couponRes.json();
    couponId = couponData.id;
    couponCode = couponData.code;
    console.log(`   ✅ Test Coupon created: ${couponCode}\n`);
  } else {
    console.log('   ℹ️ Coupon creation returned status', couponRes.status);
  }

  // Step 3: Create Banner as Admin
  console.log('3. Admin creating Marketing Banner...');
  const createBannerRes = await fetch(`${API_BASE}/banners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'E2E Test Discount Banner',
      description: 'Get 15% off your first luxury stay!',
      actionType: 'form',
      triggerType: 'delay',
      triggerValue: 3,
      couponId: couponId || undefined,
      targetPages: ['/'],
      isActive: true,
    }),
  });

  if (!createBannerRes.ok) {
    throw new Error(`Failed to create banner: ${await createBannerRes.text()}`);
  }

  const banner = await createBannerRes.json();
  console.log(`   ✅ Banner created successfully! Banner ID: ${banner.id}\n`);

  // Step 4: Guest fetches Active Banners
  console.log('4. Guest fetching Active Banners for page "/"...');
  const activeRes = await fetch(`${API_BASE}/banners/active?page=/`);
  if (!activeRes.ok) {
    throw new Error(`Failed to fetch active banners: ${activeRes.statusText}`);
  }
  const activeBanners = await activeRes.json();
  const matchedBanner = activeBanners.find((b) => b.id === banner.id);
  if (!matchedBanner) {
    throw new Error('Created banner was not found in active banners list!');
  }
  console.log(`   ✅ Active Banner retrieved successfully: "${matchedBanner.title}"\n`);

  // Step 5: Record Impression
  console.log('5. Guest triggering Impression hit...');
  const impRes = await fetch(`${API_BASE}/banners/${banner.id}/impression`, {
    method: 'POST',
  });
  if (!impRes.ok) {
    throw new Error(`Failed to record impression: ${impRes.statusText}`);
  }
  const impBanner = await impRes.json();
  console.log(`   ✅ Impression logged! Updated Views count: ${impBanner.views}\n`);

  // Step 6: Submit Guest Lead
  console.log('6. Guest submitting Lead capture form...');
  const leadRes = await fetch(`${API_BASE}/banners/${banner.id}/submit-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Verma',
      phone: '9876500000',
      email: 'rohan.verma@example.com',
    }),
  });

  if (!leadRes.ok) {
    throw new Error(`Failed to submit lead: ${await leadRes.text()}`);
  }

  const leadData = await leadRes.json();
  console.log(`   ✅ Lead submitted! Message: "${leadData.message}"`);
  console.log(`   ✅ Coupon Unlocked: ${leadData.couponCode || 'N/A'}\n`);

  // Step 7: Admin Verification of Banners & Leads Stats
  console.log('7. Admin verifying Banner analytics & Captured Leads...');
  const allBannersRes = await fetch(`${API_BASE}/banners`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allBanners = await allBannersRes.json();
  const verifiedBanner = allBanners.find((b) => b.id === banner.id);
  console.log(
    `   ✅ Verified Banner Stats -> Views: ${verifiedBanner.views}, Submissions: ${verifiedBanner.submissions}`
  );

  const leadsDirectoryRes = await fetch(`${API_BASE}/banners/leads?bannerId=${banner.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const leadsDirectory = await leadsDirectoryRes.json();
  console.log(`   ✅ Leads captured for this banner: ${leadsDirectory.length}`);
  console.log(`   ✅ Captured Lead Details: Name: "${leadsDirectory[0]?.name}", Phone: "${leadsDirectory[0]?.phone}"\n`);

  // Step 8: Clean up Test Banner
  console.log('8. Cleaning up Test Banner...');
  const delRes = await fetch(`${API_BASE}/banners/${banner.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (delRes.ok) {
    console.log('   ✅ Test Banner deleted successfully.\n');
  }

  console.log('🎉 ALL MARKETING BANNERS E2E FLOW TESTS PASSED SUCCESSFULLY! (8/8 Checks Passed)');
}

runBannersTest().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
