import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addAdminUser() {
  const email = 'admin@gmail.com';
  const password = 'admin@12345';
  const passwordHash = await bcrypt.hash(password, 10);

  console.log(`🔐 Creating / Updating ADMIN user: ${email}...`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      id: 'usr_admin_gmail_001',
      name: 'System Admin',
      email,
      phone: '+919999900001',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log(`✅ Admin user ready in database:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Active: ${user.isActive}`);

  // Test login via API
  console.log('\n🧪 Testing login with new admin credentials...');
  const loginRes = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await loginRes.json();
  if (loginRes.status === 200 && data.accessToken) {
    console.log('✅ PASS: Login successful with admin@gmail.com and password admin@12345');
    console.log(`   Authenticated User: ${data.user.name} (${data.user.email})`);
    console.log(`   Authenticated Role: ${data.user.role}`);
  } else {
    console.error('❌ FAIL: Login failed:', data);
  }
}

addAdminUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
