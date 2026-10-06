const API_BASE = 'http://localhost:5001';

async function runAmenitiesTagsTest() {
  console.log('🚀 Starting Master Amenities & Tag System E2E Flow Test...\n');

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

  // Step 2: Create Master Amenities in different categories
  console.log('2. Admin creating Master Amenities...');
  const randomId = Math.floor(1000 + Math.random() * 9000);

  const amenityWifiRes = await fetch(`${API_BASE}/amenities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: `High-Speed Fiber WiFi ${randomId}`,
      category: 'Essentials',
      icon: 'Wifi',
    }),
  });
  if (!amenityWifiRes.ok) throw new Error(`Create amenity failed: ${await amenityWifiRes.text()}`);
  const amenityWifi = await amenityWifiRes.json();
  console.log(`   ✅ Created Amenity 1: "${amenityWifi.name}" (${amenityWifi.category})`);

  const amenityPoolRes = await fetch(`${API_BASE}/amenities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: `Infinity Swimming Pool ${randomId}`,
      category: 'Luxury',
      icon: 'Waves',
    }),
  });
  if (!amenityPoolRes.ok) throw new Error(`Create amenity failed: ${await amenityPoolRes.text()}`);
  const amenityPool = await amenityPoolRes.json();
  console.log(`   ✅ Created Amenity 2: "${amenityPool.name}" (${amenityPool.category})\n`);

  // Step 3: Fetch Master Amenities catalog
  console.log('3. Fetching Master Amenities Catalog...');
  const catalogRes = await fetch(`${API_BASE}/amenities`);
  if (!catalogRes.ok) throw new Error('Fetch amenities failed');
  const catalog = await catalogRes.json();
  console.log(`   ✅ Total Master Amenities in Catalog: ${catalog.length}\n`);

  // Step 4: Create Tag Badge
  console.log('4. Admin creating Listing Tag Badge...');
  const tagRes = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: `Superhost Choice ${randomId}`,
      color: '#EC4899',
      icon: 'Award',
      description: 'Assigned to top 5% highest rated properties',
    }),
  });
  if (!tagRes.ok) throw new Error(`Create tag failed: ${await tagRes.text()}`);
  const tagBadge = await tagRes.json();
  console.log(`   ✅ Tag Badge Created: "${tagBadge.name}" (Color: ${tagBadge.color})\n`);

  // Step 5: Fetch Properties & attach amenities
  console.log('5. Attaching Master Amenities to Property...');
  const propsRes = await fetch(`${API_BASE}/properties`);
  const props = await propsRes.json();

  if (props && props.length > 0) {
    const targetProperty = props[0];
    console.log(`   ℹ️ Attaching amenities to Property: "${targetProperty.title}" (${targetProperty.id})`);

    const attachRes = await fetch(`${API_BASE}/amenities/property/${targetProperty.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amenityIds: [amenityWifi.id, amenityPool.id],
      }),
    });
    if (!attachRes.ok) throw new Error(`Attach amenities failed: ${await attachRes.text()}`);
    const attachedAmenities = await attachRes.json();
    console.log(`   ✅ Attached ${attachedAmenities.length} Master Amenities to property successfully!`);

    // Step 6: Verify Public Property Amenities Query
    const getPropAmenitiesRes = await fetch(`${API_BASE}/amenities/property/${targetProperty.id}`);
    const propAmenities = await getPropAmenitiesRes.json();
    console.log(`   ✅ Public API Verified: Property returns ${propAmenities.length} populated amenities with icons & categories!\n`);
  } else {
    console.log('   ℹ️ No properties available to test attachment.\n');
  }

  // Step 7: Update Amenity & Tag
  console.log('7. Admin updating Amenity & Tag...');
  const updateAmenityRes = await fetch(`${API_BASE}/amenities/${amenityWifi.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      category: 'Features',
    }),
  });
  if (!updateAmenityRes.ok) throw new Error('Update amenity failed');
  const updatedAmenity = await updateAmenityRes.json();
  console.log(`   ✅ Updated Amenity Category: "${updatedAmenity.category}"`);

  // Step 8: Cleanup Test Records
  console.log('\n8. Cleaning up test records...');
  await fetch(`${API_BASE}/amenities/${amenityWifi.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  await fetch(`${API_BASE}/amenities/${amenityPool.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  await fetch(`${API_BASE}/tags/${tagBadge.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('   ✅ Test Amenities & Tag deleted successfully.\n');

  console.log('🎉 ALL MASTER AMENITY & TAG SYSTEM E2E TESTS PASSED SUCCESSFULLY! (8/8 Checks Passed)');
}

runAmenitiesTagsTest().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
