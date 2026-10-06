const API_BASE = 'http://localhost:5001';

async function seedDummyBanner() {
  console.log('🌱 Seeding Dummy Marketing Banner & Coupon...\n');

  // 1. Admin Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@fairbnb.com',
      password: 'Admin@123456',
    }),
  });

  if (!loginRes.ok) {
    throw new Error('Admin login failed');
  }

  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  // 2. Create Discount Coupon
  const couponCode = `FESTIVE20`;
  const couponRes = await fetch(`${API_BASE}/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: couponCode,
      discountType: 'PERCENTAGE',
      discountValue: 20,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      minOrderAmount: 1000,
    }),
  }).catch(() => null);

  let couponId = null;
  if (couponRes && couponRes.ok) {
    const couponData = await couponRes.json();
    couponId = couponData.id;
    console.log(`✅ Coupon "${couponCode}" created!`);
  } else {
    // Try fetching existing coupons
    const listRes = await fetch(`${API_BASE}/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (listRes.ok) {
      const list = await listRes.json();
      const existing = list.find((c) => c.code === couponCode) || list[0];
      if (existing) {
        couponId = existing.id;
        console.log(`ℹ️ Using existing coupon "${existing.code}"`);
      }
    }
  }

  // 3. Create Marketing Banner
  const bannerPayload = {
    title: '🎉 Special Welcome Offer - 20% OFF!',
    description: 'Enter your contact details to unlock an instant 20% discount coupon code for your next stay.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    actionType: 'form',
    triggerType: 'delay',
    triggerValue: 2, // 2 seconds delay
    couponId: couponId || undefined,
    targetPages: ['/', '/properties'],
    isActive: true,
  };

  const bannerRes = await fetch(`${API_BASE}/banners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bannerPayload),
  });

  if (!bannerRes.ok) {
    throw new Error(`Failed to create banner: ${await bannerRes.text()}`);
  }

  const banner = await bannerRes.json();
  console.log(`\n🎉 Dummy Marketing Banner created successfully!`);
  console.log(`   ID: ${banner.id}`);
  console.log(`   Title: "${banner.title}"`);
  console.log(`   Trigger: ${banner.triggerType} (${banner.triggerValue}s)`);
  console.log(`   Target Pages: ${banner.targetPages.join(', ')}`);
}

seedDummyBanner().catch((err) => {
  console.error('❌ Seeding failed:', err);
});
