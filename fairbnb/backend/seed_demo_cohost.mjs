import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING DEMO CO-HOST USER & ASSIGNING 4 HOSTS PROPERTIES ---');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create or update Demo Co-Host user
  let coHost = await prisma.user.findUnique({
    where: { email: 'demo.cohost@fairbnb.com' }
  });

  if (!coHost) {
    coHost = await prisma.user.create({
      data: {
        email: 'demo.cohost@fairbnb.com',
        name: 'Aarav Mehta',
        phone: '+91 99999 88888',
        role: 'HOST',
        passwordHash,
        emailVerified: true,
        phoneVerified: true,
      }
    });
    console.log(`Created Demo Co-Host user: ${coHost.name} (${coHost.email})`);
  } else {
    coHost = await prisma.user.update({
      where: { id: coHost.id },
      data: { passwordHash, name: 'Aarav Mehta' }
    });
    console.log(`Updated Demo Co-Host password & name: ${coHost.name}`);
  }

  // 2. Fetch the properties of the 4 hosts created earlier
  const properties = await prisma.property.findMany({
    include: { host: true }
  });

  console.log(`Found ${properties.length} total properties in DB.`);

  // 3. Clear previous co-host relationships for demo co-host
  await prisma.coHostRelationship.deleteMany({
    where: { coHostUserId: coHost.id }
  });

  // Define assignment configs for the 4 hosts' properties
  // Some FULL_ACCESS, some LIMITED
  const assignmentConfigs = [
    {
      titleMatch: 'Sunset Villa',
      permissionLevel: 'FULL_ACCESS',
      permissions: [
        'VIEW_PROPERTY', 'EDIT_LISTING', 'VIEW_CALENDAR', 'MANAGE_CALENDAR',
        'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE',
        'VIEW_REVIEWS', 'RESPOND_TO_REVIEWS', 'VIEW_EARNINGS', 'VIEW_PAYOUTS'
      ]
    },
    {
      titleMatch: 'Beach House',
      permissionLevel: 'LIMITED',
      permissions: ['VIEW_PROPERTY', 'VIEW_CALENDAR', 'VIEW_BOOKINGS', 'MESSAGE_GUESTS']
    },
    {
      titleMatch: 'City Apartment',
      permissionLevel: 'FULL_ACCESS',
      permissions: [
        'VIEW_PROPERTY', 'EDIT_LISTING', 'VIEW_CALENDAR', 'MANAGE_CALENDAR',
        'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE',
        'VIEW_REVIEWS', 'RESPOND_TO_REVIEWS', 'VIEW_EARNINGS', 'VIEW_PAYOUTS'
      ]
    },
    {
      titleMatch: 'Pink City Heritage',
      permissionLevel: 'LIMITED',
      permissions: ['VIEW_PROPERTY', 'VIEW_CALENDAR']
    },
    {
      titleMatch: 'Mountain View',
      permissionLevel: 'FULL_ACCESS',
      permissions: [
        'VIEW_PROPERTY', 'EDIT_LISTING', 'VIEW_CALENDAR', 'MANAGE_CALENDAR',
        'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE',
        'VIEW_REVIEWS', 'RESPOND_TO_REVIEWS', 'VIEW_EARNINGS', 'VIEW_PAYOUTS'
      ]
    },
    {
      titleMatch: 'Lakeside Sanctuary',
      permissionLevel: 'LIMITED',
      permissions: ['VIEW_PROPERTY', 'VIEW_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE']
    }
  ];

  for (const prop of properties) {
    if (prop.hostId === coHost.id) continue;

    const config = assignmentConfigs.find(c => prop.title.toLowerCase().includes(c.titleMatch.toLowerCase())) || {
      permissionLevel: 'LIMITED',
      permissions: ['VIEW_PROPERTY', 'VIEW_CALENDAR', 'VIEW_BOOKINGS']
    };

    const rel = await prisma.coHostRelationship.create({
      data: {
        propertyId: prop.id,
        hostUserId: prop.hostId,
        coHostUserId: coHost.id,
        status: 'ACTIVE',
        permissionLevel: config.permissionLevel,
        acceptedAt: new Date(),
        permissions: {
          create: config.permissions.map(p => ({ permission: p }))
        }
      }
    });

    console.log(`✅ Assigned "${prop.title}" (Host: ${prop.host?.name || 'Owner'}) to Aarav Mehta with ${config.permissionLevel} (${config.permissions.length} perms)`);
  }

  console.log('\n🎉 DEMO CO-HOST SETUP COMPLETE! Credentials:');
  console.log('   Email: demo.cohost@fairbnb.com');
  console.log('   Password: Password@123\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
