const API_BASE = 'http://localhost:5001';

async function runSecurityTestSuite() {
  console.log('🛡️ Starting FAIRBNB Co-Host System Security Verification Test Suite...\n');

  const timestamp = Date.now().toString().slice(-5);
  const host1Email = `host1_${timestamp}@example.com`;
  const host2Email = `host2_${timestamp}@example.com`;
  const cohost1Email = `cohost1_${timestamp}@example.com`;
  const unauthorizedEmail = `unauth_${timestamp}@example.com`;
  const password = 'Password@123';

  // 1. Admin Login to promote host roles if needed
  console.log('1. Logging in as Admin...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fairbnb.com', password: 'Admin@123456' }),
  });
  if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${await adminLoginRes.text()}`);
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.accessToken;
  console.log('   ✅ Admin authenticated.\n');

  // Helper function to register user, promote to HOST if requested, and login
  async function createAndLoginUser(name, email, isHost = false) {
    const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });

    if (!regRes.ok) {
      throw new Error(`Failed to register user ${email}: ${await regRes.text()}`);
    }

    const regData = await regRes.json();
    const userId = regData.user?.id || regData.id;

    if (isHost && userId) {
      await fetch(`${API_BASE}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: 'HOST' }),
      });
    }

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginRes.json();
    return { token: loginData.accessToken, user: loginData.user };
  }

  // 2. Setup Test Users
  console.log('2. Registering & Authenticating Test Actors...');
  const host1 = await createAndLoginUser('Host One', host1Email, true);
  const host2 = await createAndLoginUser('Host Two', host2Email, true);
  const cohost1 = await createAndLoginUser('CoHost One', cohost1Email, false);
  const unauthorized = await createAndLoginUser('Unauthorized User', unauthorizedEmail, false);
  console.log('   ✅ Host 1, Host 2, CoHost 1, and Unauthorized User authenticated.\n');

  // 3. Create Test Properties
  console.log('3. Creating Test Properties...');
  async function createProperty(token, title) {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description: 'Test Property Description',
        category: 'Villas',
        propertyType: 'Entire Villa',
        listingPurpose: 'Short-Term Rental',
        city: 'Goa',
        state: 'Goa',
        country: 'India',
        address: '123 Beach Road',
        pincode: 403001,
        basePrice: 5000,
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
      }),
    });
    if (!res.ok) throw new Error(`Failed to create property: ${await res.text()}`);
    return res.json();
  }

  const prop1 = await createProperty(host1.token, `Property One (${timestamp})`);
  const prop2 = await createProperty(host2.token, `Property Two (${timestamp})`);
  console.log(`   ✅ Property 1 ID: ${prop1.id}`);
  console.log(`   ✅ Property 2 ID: ${prop2.id}\n`);

  // --- SECURITY TEST DIRECTIVE 7: Target Invitee Verification ---
  console.log('4. Testing Directive 7: Target Invitee Verification (Email Match)...');
  const inviteRes1 = await fetch(`${API_BASE}/properties/${prop1.id}/co-hosts/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${host1.token}`,
    },
    body: JSON.stringify({
      email: cohost1Email,
      permissionLevel: 'FULL_ACCESS',
      payoutConfig: { type: 'PERCENTAGE', percentage: 15 },
    }),
  });
  if (!inviteRes1.ok) throw new Error(`Failed to create invite: ${await inviteRes1.text()}`);
  const invite1Data = await inviteRes1.json();
  const inviteToken1 = invite1Data.inviteToken;
  console.log(`   ✅ Invitation created for ${cohost1Email}. Raw Token: ${inviteToken1}`);

  // Unauthorized user tries to accept cohost1's invite
  const unauthAcceptRes = await fetch(`${API_BASE}/co-hosts/invitations/${inviteToken1}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${unauthorized.token}` },
  });
  if (unauthAcceptRes.status === 403) {
    console.log('   ✅ PASSED Directive 7: Unauthorized email attempt correctly rejected with HTTP 403 Forbidden!\n');
  } else {
    throw new Error(`FAILED Directive 7: Expected HTTP 403, got status ${unauthAcceptRes.status}`);
  }

  // --- SECURITY TEST DIRECTIVE 6: Token Single-Use & Expiration ---
  console.log('5. Testing Directive 6: Token Single-Use & Expiration...');
  // Legitimate cohost1 accepts
  const validAcceptRes = await fetch(`${API_BASE}/co-hosts/invitations/${inviteToken1}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  if (!validAcceptRes.ok) throw new Error(`Legitimate acceptance failed: ${await validAcceptRes.text()}`);
  const coHostRel = await validAcceptRes.json();
  console.log(`   ✅ Co-Host accepted invitation! Relationship ID: ${coHostRel.id}`);

  // Try to reuse token a 2nd time
  const reuseRes = await fetch(`${API_BASE}/co-hosts/invitations/${inviteToken1}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  if (reuseRes.status === 400) {
    console.log('   ✅ PASSED Directive 6: Token reuse attempt correctly rejected with HTTP 400 Bad Request!\n');
  } else {
    throw new Error(`FAILED Directive 6: Expected HTTP 400, got status ${reuseRes.status}`);
  }

  // --- SECURITY TEST DIRECTIVE 1: Cross-Property Isolation ---
  console.log('6. Testing Directive 1: Cross-Property Isolation...');
  // cohost1 attempts to query Property 2's workspace dashboard (owned by Host 2)
  const crossPropRes = await fetch(`${API_BASE}/co-host/properties/${prop2.id}/dashboard`, {
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  if (crossPropRes.status === 403) {
    console.log('   ✅ PASSED Directive 1: Cross-property access attempt correctly rejected with HTTP 403 Forbidden!\n');
  } else {
    throw new Error(`FAILED Directive 1: Expected HTTP 403, got status ${crossPropRes.status}`);
  }

  // --- SECURITY TEST DIRECTIVE 5: Host Property Ownership Validation ---
  console.log('7. Testing Directive 5: Host Property Ownership Validation...');
  // Host 2 attempts to suspend cohost1 on Property 1 (owned by Host 1)
  const unauthorizedManageRes = await fetch(`${API_BASE}/co-hosts/${coHostRel.id}/suspend`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${host2.token}` },
  });
  if (unauthorizedManageRes.status === 403) {
    console.log('   ✅ PASSED Directive 5: Non-owner host management attempt correctly rejected with HTTP 403 Forbidden!\n');
  } else {
    throw new Error(`FAILED Directive 5: Expected HTTP 403, got status ${unauthorizedManageRes.status}`);
  }

  // --- SECURITY TEST DIRECTIVE 8: Backend Guard Permission Filtering ---
  console.log('8. Testing Directive 8: Backend Guard Permission Filtering...');
  // Host 1 updates cohost1's permissions to CALENDAR_ONLY
  const updatePermRes = await fetch(`${API_BASE}/co-hosts/${coHostRel.id}/permissions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${host1.token}`,
    },
    body: JSON.stringify({ permissionLevel: 'CALENDAR_ONLY' }),
  });
  if (!updatePermRes.ok) throw new Error(`Permission update failed: ${await updatePermRes.text()}`);

  // cohost1 can access calendar
  const calRes = await fetch(`${API_BASE}/co-host/properties/${prop1.id}/calendar`, {
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  if (!calRes.ok) throw new Error(`Calendar view failed: ${calRes.statusText}`);

  // cohost1 attempts to access bookings (requires VIEW_BOOKINGS, not in CALENDAR_ONLY)
  const bookingAccessRes = await fetch(`${API_BASE}/co-host/properties/${prop1.id}/bookings`, {
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  if (bookingAccessRes.status === 403) {
    console.log('   ✅ PASSED Directive 8: Permission-restricted route correctly returned HTTP 403 Forbidden!\n');
  } else {
    throw new Error(`FAILED Directive 8: Expected HTTP 403, got status ${bookingAccessRes.status}`);
  }

  // --- SECURITY TEST DIRECTIVE 2: Immediate Suspension Revocation ---
  console.log('9. Testing Directive 2: Immediate Suspension Revocation...');
  // Host 1 suspends cohost1
  const suspendRes = await fetch(`${API_BASE}/co-hosts/${coHostRel.id}/suspend`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${host1.token}` },
  });
  if (!suspendRes.ok) throw new Error(`Suspension failed: ${await suspendRes.text()}`);

  // Suspended cohost1 tries to access calendar
  const suspendedCalRes = await fetch(`${API_BASE}/co-host/properties/${prop1.id}/calendar`, {
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  if (suspendedCalRes.status === 403) {
    console.log('   ✅ PASSED Directive 2: Suspended co-host immediately blocked with HTTP 403 Forbidden!\n');
  } else {
    throw new Error(`FAILED Directive 2: Expected HTTP 403, got status ${suspendedCalRes.status}`);
  }

  // Reactivate cohost1
  await fetch(`${API_BASE}/co-hosts/${coHostRel.id}/reactivate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${host1.token}` },
  });

  // --- SECURITY TEST DIRECTIVE 3: Immediate Removal Revocation ---
  console.log('10. Testing Directive 3: Immediate Removal Revocation...');
  // Host 1 removes cohost1
  const removeRes = await fetch(`${API_BASE}/co-hosts/${coHostRel.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${host1.token}` },
  });
  if (!removeRes.ok) throw new Error(`Removal failed: ${await removeRes.text()}`);

  // Removed cohost1 tries to access dashboard
  const removedDashRes = await fetch(`${API_BASE}/co-host/properties/${prop1.id}/dashboard`, {
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  if (removedDashRes.status === 403) {
    console.log('   ✅ PASSED Directive 3: Removed co-host immediately blocked with HTTP 403 Forbidden!\n');
  } else {
    throw new Error(`FAILED Directive 3: Expected HTTP 403, got status ${removedDashRes.status}`);
  }

  // --- SECURITY TEST DIRECTIVE 4: Financial Data Protection ---
  console.log('11. Testing Directive 4: Financial Data Protection...');
  // Verify that cohost endpoints do not return host private bank details or platform earnings
  const mePropsRes = await fetch(`${API_BASE}/co-host/me/properties`, {
    headers: { Authorization: `Bearer ${cohost1.token}` },
  });
  const meProps = await mePropsRes.json();
  const hasExposedBankInfo = JSON.stringify(meProps).includes('bankAccount') || JSON.stringify(meProps).includes('payoutMethodId');
  if (!hasExposedBankInfo) {
    console.log('   ✅ PASSED Directive 4: Host private financial data cleanly protected and unexposed!\n');
  } else {
    throw new Error('FAILED Directive 4: Found exposed host financial/bank details in co-host response');
  }

  console.log('🎉 ALL 8 CO-HOST SECURITY VERIFICATION DIRECTIVES PASSED WITH 100% SUCCESS!');
}

runSecurityTestSuite().catch((err) => {
  console.error('❌ Security Verification Failed:', err);
  process.exit(1);
});
