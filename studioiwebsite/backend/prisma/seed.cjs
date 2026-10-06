const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING STUDIO I COMPLETE UNIFIED DATABASE (studioi_complete_dev) ===\n');

  // 1. Password Hashing
  const adminHash = await bcrypt.hash('StudioI@Admin2026', 10);
  const hostHash = await bcrypt.hash('StudioI@Host2026', 10);
  const memberHash = await bcrypt.hash('StudioI@Member2026', 10);
  const cohostHash = await bcrypt.hash('StudioI@Cohost2026', 10);

  // 2. Personas
  console.log('1. Creating 4 Role Personas...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@studioi.com' },
    update: { role: 'ADMIN', isBlocked: false },
    create: {
      email: 'admin@studioi.com',
      passwordHash: adminHash,
      name: 'Studio I Master Administrator',
      phone: '+919876543210',
      role: 'ADMIN',
      adminScope: {
        create: {
          canManageSpaces: true,
          canManagePricing: true,
          canManageBookings: true,
          canManageFinance: true,
          canManageBeneficiaries: true,
          canViewReports: true,
        },
      },
    },
  });

  const host = await prisma.user.upsert({
    where: { email: 'host@studioi.com' },
    update: { role: 'HOST', isBlocked: false },
    create: {
      email: 'host@studioi.com',
      passwordHash: hostHash,
      name: 'Jaipur Campus Partner (Host)',
      phone: '+919876543211',
      role: 'HOST',
      companyName: 'KGK Realty Coworking Ventures',
      gstin: '08AAAAA0000A1Z5',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@studioi.com' },
    update: { role: 'USER', isBlocked: false },
    create: {
      email: 'member@studioi.com',
      passwordHash: memberHash,
      name: 'Aditi Sharma (Resident Member)',
      phone: '+919876543212',
      role: 'USER',
      companyName: 'Jaipur Innovations Tech',
    },
  });

  const cohost = await prisma.user.upsert({
    where: { email: 'cohost@studioi.com' },
    update: { role: 'USER', isBlocked: false },
    create: {
      email: 'cohost@studioi.com',
      passwordHash: cohostHash,
      name: 'Vikram Singh (Campus Ops Co-host)',
      phone: '+919876543213',
      role: 'USER',
    },
  });

  console.log('✔ Personas seeded: Admin, Host, Member, Co-host.');

  // 3. Amenities
  console.log('\n2. Seeding Amenities...');
  const amenitiesList = [
    { code: 'HIGH_SPEED_WIFI', name: 'Gigabit Fiber WiFi 6', category: 'CONNECTIVITY', iconName: 'Wifi' },
    { code: 'SPECIALTY_COFFEE', name: 'Unlimited Specialty Coffee & Artisan Tea', category: 'HOSPITALITY', iconName: 'Coffee' },
    { code: 'ERGONOMIC_SEATING', name: 'Herman Miller Ergonomic Task Chairs', category: 'COMFORT', iconName: 'Armchair' },
    { code: 'POWER_BACKUP', name: '100% DG Power Backup & Surge Protection', category: 'CONNECTIVITY', iconName: 'Zap' },
    { code: 'ACCESS_CONTROL', name: 'Biometric & QR Access Security 24/7', category: 'SECURITY', iconName: 'ShieldCheck' },
    { code: 'VIDEO_BOARDROOM', name: '4K Dual-Screen Video Conference Suite', category: 'CONNECTIVITY', iconName: 'Monitor' },
    { code: 'PHONE_BOOTHS', name: 'Soundproof Acoustic Phone Booths', category: 'COMFORT', iconName: 'PhoneCall' },
    { code: 'MAIL_HANDLING', name: 'Dedicated Business Address & Mail Handling', category: 'HOSPITALITY', iconName: 'Mail' },
  ];

  const seededAmenities = [];
  for (const item of amenitiesList) {
    const a = await prisma.amenity.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
    seededAmenities.push(a);
  }

  // 4. Campuses (Jaipur Flagships only - zero Alwar)
  console.log('\n3. Seeding Jaipur Flagship Workspaces...');

  // Workspace 1: Lehariya | KGK Realty
  const lehariya = await prisma.workspace.upsert({
    where: { slug: 'lehariya-jaipur' },
    update: {
      hostId: host.id,
      isPublished: true,
      city: 'Jaipur',
    },
    create: {
      slug: 'lehariya-jaipur',
      name: 'A Tower - 1st Floor, Lehariya | KGK Realty',
      tagline: 'Jaipur Flagship Coworking & Executive Suites',
      description: 'Studio I flagship collaborative campus in Tonk Road, featuring bespoke architectural hot desks, private acoustic cabins, and panoramic executive boardrooms.',
      address: 'A Tower, 1st Floor, Lehariya, Near Chhatrapati Shivaji Park, Tonk Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302015',
      latitude: 26.8725,
      longitude: 75.8045,
      timezone: 'Asia/Kolkata',
      isPublished: true,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 48,
      hostId: host.id,
      media: {
        create: [
          { url: '/assets/building-lehariya.png', caption: 'Lehariya KGK Realty Campus Exterior', isHero: true, sortOrder: 1 },
          { url: '/assets/property-lehariya.png', caption: 'Interior Collaborative Lounge', isHero: false, sortOrder: 2 },
        ],
      },
    },
  });

  // Attach amenities to Lehariya
  for (const a of seededAmenities) {
    await prisma.workspaceAmenityItem.upsert({
      where: {
        workspaceId_amenityId: {
          workspaceId: lehariya.id,
          amenityId: a.id,
        },
      },
      update: {},
      create: {
        workspaceId: lehariya.id,
        amenityId: a.id,
      },
    });
  }

  // Building & Floor for Lehariya
  let buildingA = await prisma.building.findFirst({ where: { workspaceId: lehariya.id } });
  if (!buildingA) {
    buildingA = await prisma.building.create({
      data: {
        workspaceId: lehariya.id,
        name: 'Tower A',
        code: 'T-A',
      },
    });
  }

  let floor1 = await prisma.floor.findFirst({ where: { buildingId: buildingA.id } });
  if (!floor1) {
    floor1 = await prisma.floor.create({
      data: {
        buildingId: buildingA.id,
        floorNumber: 1,
        name: '1st Floor',
      },
    });
  }

  // Seed Physical Units for Lehariya (Desks, Cabins, Meeting Rooms with 2D Coordinates)
  console.log('\n4. Seeding 2D Units for Lehariya 1st Floor...');
  const unitsData = [
    // Open Hot Desks (Left Zone)
    { unitCode: 'LH-01-D01', name: 'Ergonomic Hot Desk #1', unitType: 'HOT_DESK', capacity: 1, status: 'ACTIVE', x: 60, y: 100, width: 70, height: 60, rotation: 0, chairSide: 'bottom', pricePaise: BigInt(49900) },
    { unitCode: 'LH-01-D02', name: 'Ergonomic Hot Desk #2', unitType: 'HOT_DESK', capacity: 1, status: 'ACTIVE', x: 150, y: 100, width: 70, height: 60, rotation: 0, chairSide: 'bottom', pricePaise: BigInt(49900) },
    { unitCode: 'LH-01-D03', name: 'Ergonomic Hot Desk #3', unitType: 'HOT_DESK', capacity: 1, status: 'ACTIVE', x: 240, y: 100, width: 70, height: 60, rotation: 0, chairSide: 'bottom', pricePaise: BigInt(49900) },
    { unitCode: 'LH-01-D04', name: 'Ergonomic Hot Desk #4', unitType: 'HOT_DESK', capacity: 1, status: 'ACTIVE', x: 330, y: 100, width: 70, height: 60, rotation: 0, chairSide: 'bottom', pricePaise: BigInt(49900) },
    { unitCode: 'LH-01-D05', name: 'Dedicated Desk Pod #5', unitType: 'DEDICATED_DESK', capacity: 1, status: 'ACTIVE', x: 60, y: 220, width: 70, height: 60, rotation: 0, chairSide: 'top', pricePaise: BigInt(699900) },
    { unitCode: 'LH-01-D06', name: 'Dedicated Desk Pod #6', unitType: 'DEDICATED_DESK', capacity: 1, status: 'ACTIVE', x: 150, y: 220, width: 70, height: 60, rotation: 0, chairSide: 'top', pricePaise: BigInt(699900) },
    { unitCode: 'LH-01-D07', name: 'Dedicated Desk Pod #7', unitType: 'DEDICATED_DESK', capacity: 1, status: 'ACTIVE', x: 240, y: 220, width: 70, height: 60, rotation: 0, chairSide: 'top', pricePaise: BigInt(699900) },
    { unitCode: 'LH-01-D08', name: 'Dedicated Desk Pod #8', unitType: 'DEDICATED_DESK', capacity: 1, status: 'ACTIVE', x: 330, y: 220, width: 70, height: 60, rotation: 0, chairSide: 'top', pricePaise: BigInt(699900) },

    // Executive Private Cabins (Right Zone)
    { unitCode: 'LH-01-C01', name: 'Executive Suite Alpha (4-Pax)', unitType: 'PRIVATE_CABIN', capacity: 4, status: 'ACTIVE', x: 720, y: 90, width: 120, height: 95, rotation: 0, chairSide: 'top', pricePaise: BigInt(2499900) },
    { unitCode: 'LH-01-C02', name: 'Executive Suite Beta (4-Pax)', unitType: 'PRIVATE_CABIN', capacity: 4, status: 'ACTIVE', x: 860, y: 90, width: 120, height: 95, rotation: 0, chairSide: 'top', pricePaise: BigInt(2499900) },
    { unitCode: 'LH-01-M01', name: 'Amber 4K Boardroom (10-Pax)', unitType: 'MEETING_ROOM', capacity: 10, status: 'ACTIVE', x: 720, y: 220, width: 260, height: 120, rotation: 0, chairSide: 'top', pricePaise: BigInt(99900) },
  ];

  for (const u of unitsData) {
    await prisma.unit.upsert({
      where: {
        floorId_unitCode: {
          floorId: floor1.id,
          unitCode: u.unitCode,
        },
      },
      update: {
        ...u,
      },
      create: {
        floorId: floor1.id,
        ...u,
      },
    });
  }

  // Publish live 2D layout version for Lehariya
  const layoutUnits = await prisma.unit.findMany({ where: { floorId: floor1.id } });
  await prisma.floorLayoutVersion.upsert({
    where: { id: `layout_${floor1.id}_v1` },
    update: {
      canvasWidth: 1000,
      canvasHeight: 500,
      layoutJson: layoutUnits,
      isLive: true,
    },
    create: {
      id: `layout_${floor1.id}_v1`,
      floorId: floor1.id,
      versionNumber: 1,
      canvasWidth: 1000,
      canvasHeight: 500,
      layoutJson: layoutUnits,
      isLive: true,
      publishedById: admin.id,
    },
  });

  // Booking Plans for Lehariya
  console.log('\n5. Seeding Booking Plans for Lehariya...');
  const plans = [
    {
      unitType: 'HOT_DESK',
      planType: 'DAILY',
      title: 'Hot Desk Day Pass',
      description: 'Flexible ergonomic desk access from 8 AM to 11 PM with high-speed WiFi and unlimited specialty coffee.',
      ratePaise: BigInt(49900), // Rs 499
      minDurationSlots: 1,
      minCommitmentMonths: 0,
    },
    {
      unitType: 'DEDICATED_DESK',
      planType: 'MONTHLY',
      title: 'Dedicated Desk Resident',
      description: 'Your permanent desk with lockable storage, 24/7 keycard access, and 5 complimentary meeting room credits/mo.',
      ratePaise: BigInt(699900), // Rs 6,999/mo
      minDurationSlots: 1,
      minCommitmentMonths: 2,
    },
    {
      unitType: 'PRIVATE_CABIN',
      planType: 'MONTHLY',
      title: 'Private Cabin Suite (4-Pax)',
      description: 'Acoustically treated private cabin with ergonomic desks, executive whiteboard, and private company branding.',
      ratePaise: BigInt(2499900), // Rs 24,999/mo
      minDurationSlots: 1,
      minCommitmentMonths: 2,
    },
    {
      unitType: 'MEETING_ROOM',
      planType: 'HOURLY',
      title: 'Boardroom by the Hour',
      description: '4K video conference room, wireless casting, executive seating, and barista hospitality service.',
      ratePaise: BigInt(99900), // Rs 999/hr
      minDurationSlots: 1,
      minCommitmentMonths: 0,
    },
  ];

  for (const p of plans) {
    const existingPlan = await prisma.bookingPlan.findFirst({
      where: {
        workspaceId: lehariya.id,
        unitType: p.unitType,
        planType: p.planType,
      },
    });

    if (existingPlan) {
      await prisma.bookingPlan.update({
        where: { id: existingPlan.id },
        data: p,
      });
    } else {
      await prisma.bookingPlan.create({
        data: {
          workspaceId: lehariya.id,
          ...p,
        },
      });
    }
  }

  // Workspace 2: Horizon Tower (Jaipur)
  const horizon = await prisma.workspace.upsert({
    where: { slug: 'horizon-jaipur' },
    update: {
      hostId: host.id,
      isPublished: true,
      city: 'Jaipur',
    },
    create: {
      slug: 'horizon-jaipur',
      name: '1007-08, 10th Floor, Horizon Tower',
      tagline: 'Premium Executive Skyline Suites',
      description: 'Panoramic skyline workspaces on Tonk Road with high-tech boardrooms, soundproof private suites, and dedicated concierge services.',
      address: '1007-08, 10th Floor, Horizon Tower, JLN Marg, Tonk Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302018',
      latitude: 26.8624,
      longitude: 75.8012,
      timezone: 'Asia/Kolkata',
      isPublished: true,
      isFeatured: true,
      rating: 4.8,
      reviewCount: 36,
      hostId: host.id,
      media: {
        create: [
          { url: '/assets/building-horizon.png', caption: 'Horizon Tower Skyline View', isHero: true, sortOrder: 1 },
          { url: '/assets/property-horizon.png', caption: 'Executive Boardroom & Hot Desks', isHero: false, sortOrder: 2 },
        ],
      },
    },
  });

  // Attach amenities to Horizon
  for (const a of seededAmenities) {
    await prisma.workspaceAmenityItem.upsert({
      where: {
        workspaceId_amenityId: {
          workspaceId: horizon.id,
          amenityId: a.id,
        },
      },
      update: {},
      create: {
        workspaceId: horizon.id,
        amenityId: a.id,
      },
    });
  }

  // 6. Promotional Coupon STUDIO10
  console.log('\n6. Seeding Promotional Coupons...');
  await prisma.coupon.upsert({
    where: { code: 'STUDIO10' },
    update: {
      discountPercent: 10,
      maxDiscountPaise: BigInt(200000), // Max Rs 2,000 off
      minOrderPaise: BigInt(40000), // Min order Rs 400
      isActive: true,
    },
    create: {
      code: 'STUDIO10',
      discountPercent: 10,
      maxDiscountPaise: BigInt(200000),
      minOrderPaise: BigInt(40000),
      isActive: true,
      usageLimit: 1000,
    },
  });

  // 7. Co-host Delegation & Permissions
  console.log('\n7. Seeding Co-host Permissions for Lehariya Campus...');
  await prisma.cohostPermission.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: lehariya.id,
        userId: cohost.id,
      },
    },
    update: {
      canManageListing: true,
      canViewFinances: true,
      canManageBookings: true,
      canManageCalendar: true,
      canManageMaintenance: true,
      canMessageGuests: true,
    },
    create: {
      workspaceId: lehariya.id,
      userId: cohost.id,
      canManageListing: true,
      canViewFinances: true,
      canManageBookings: true,
      canManageCalendar: true,
      canManageMaintenance: true,
      canMessageGuests: true,
    },
  });

  // 8. Banners
  console.log('\n8. Seeding Promotional Banners...');
  await prisma.banner.upsert({
    where: { id: 'banner_jaipur_flagship_01' },
    update: {},
    create: {
      id: 'banner_jaipur_flagship_01',
      title: 'Studio I Luxury Flagship Campuses in Jaipur',
      subtitle: 'Experience executive ergonomics, gigabit connectivity, and 10-minute instant hold reservations.',
      ctaText: 'Explore Spaces',
      ctaLink: '/explore',
      imageUrl: '/assets/building-lehariya.png',
      isActive: true,
      priority: 1,
    },
  });

  console.log('\n================================================================');
  console.log('   STUDIO I COMPLETE UNIFIED DATABASE SEEDED SUCCESSFULLY!      ');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
