import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DB SEED: 4 HOSTS & CO-HOST PROPERTIES ---');

  // Find or create Co-Host user
  let coHost = await prisma.user.findFirst({
    where: { role: 'HOST' } // Or any user
  });

  if (!coHost) {
    console.log('No user found, creating co-host account...');
    coHost = await prisma.user.create({
      data: {
        email: 'cohost.master@fairbnb.com',
        name: 'Kashish Sharma',
        role: 'HOST',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
      }
    });
  }

  console.log(`Target Co-Host User: ${coHost.name} (${coHost.email}) [ID: ${coHost.id}]`);

  // Define 4 Hosts
  const hostsData = [
    {
      name: 'Rohan Mehta',
      email: 'rohan.mehta@fairbnb.com',
      properties: [
        {
          title: 'Sunset Villa',
          address: 'Beach Road, Anjuna',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          category: 'VILLA',
          propertyType: 'Entire Villa',
          basePrice: 14500,
          bedrooms: 3,
          bathrooms: 3,
          maxGuests: 6,
          verificationStatus: 'APPROVED',
          images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'],
          permissionType: 'FULL_ACCESS',
          permissions: [
            'VIEW_PROPERTY', 'EDIT_LISTING', 'VIEW_CALENDAR', 'MANAGE_CALENDAR',
            'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE',
            'VIEW_REVIEWS', 'RESPOND_TO_REVIEWS', 'VIEW_EARNINGS', 'VIEW_PAYOUTS'
          ]
        },
        {
          title: 'Beach House Haven',
          address: 'Baga Ocean Boulevard',
          city: 'Alibaug',
          state: 'Maharashtra',
          country: 'India',
          category: 'BEACH_HOUSE',
          propertyType: 'Entire Beach House',
          basePrice: 18000,
          bedrooms: 4,
          bathrooms: 4,
          maxGuests: 8,
          verificationStatus: 'APPROVED',
          images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
          permissionType: 'LIMITED',
          permissions: ['VIEW_PROPERTY', 'VIEW_CALENDAR', 'VIEW_BOOKINGS', 'MESSAGE_GUESTS']
        }
      ]
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@fairbnb.com',
      properties: [
        {
          title: 'City Apartment',
          address: 'C-Scheme Executive Enclave',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          category: 'APARTMENT',
          propertyType: 'Entire Apartment',
          basePrice: 8500,
          bedrooms: 2,
          bathrooms: 2,
          maxGuests: 4,
          verificationStatus: 'APPROVED',
          images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
          permissionType: 'FULL_ACCESS',
          permissions: [
            'VIEW_PROPERTY', 'EDIT_LISTING', 'VIEW_CALENDAR', 'MANAGE_CALENDAR',
            'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE',
            'VIEW_REVIEWS', 'RESPOND_TO_REVIEWS', 'VIEW_EARNINGS', 'VIEW_PAYOUTS'
          ]
        },
        {
          title: 'Pink City Heritage Suite',
          address: 'Johari Bazaar',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          category: 'SUITE',
          propertyType: 'Heritage Suite',
          basePrice: 12000,
          bedrooms: 1,
          bathrooms: 1,
          maxGuests: 2,
          verificationStatus: 'APPROVED',
          images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
          permissionType: 'LIMITED',
          permissions: ['VIEW_PROPERTY', 'VIEW_CALENDAR']
        }
      ]
    },
    {
      name: 'Vikram Das',
      email: 'vikram.das@fairbnb.com',
      properties: [
        {
          title: 'Mountain View Cottage',
          address: 'Solang Valley Heights',
          city: 'Manali',
          state: 'Himachal Pradesh',
          country: 'India',
          category: 'COTTAGE',
          propertyType: 'Alpine Chalet',
          basePrice: 9800,
          bedrooms: 2,
          bathrooms: 2,
          maxGuests: 5,
          verificationStatus: 'APPROVED',
          images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'],
          permissionType: 'FULL_ACCESS',
          permissions: [
            'VIEW_PROPERTY', 'EDIT_LISTING', 'VIEW_CALENDAR', 'MANAGE_CALENDAR',
            'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE',
            'VIEW_REVIEWS', 'RESPOND_TO_REVIEWS', 'VIEW_EARNINGS', 'VIEW_PAYOUTS'
          ]
        }
      ]
    },
    {
      name: 'Neha Kapoor',
      email: 'neha.kapoor@fairbnb.com',
      properties: [
        {
          title: 'Lakeside Sanctuary',
          address: 'Fateh Sagar Promenade',
          city: 'Udaipur',
          state: 'Rajasthan',
          country: 'India',
          category: 'VILLA',
          propertyType: 'Lakeside Villa',
          basePrice: 22000,
          bedrooms: 4,
          bathrooms: 4,
          maxGuests: 8,
          verificationStatus: 'APPROVED',
          images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'],
          permissionType: 'LIMITED',
          permissions: ['VIEW_PROPERTY', 'VIEW_BOOKINGS', 'MESSAGE_GUESTS', 'MANAGE_MAINTENANCE']
        }
      ]
    }
  ];

  for (const hostItem of hostsData) {
    let host = await prisma.user.findUnique({ where: { email: hostItem.email } });
    if (!host) {
      host = await prisma.user.create({
        data: {
          email: hostItem.email,
          name: hostItem.name,
          phone: `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
          role: 'HOST',
          passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
        }
      });
      console.log(`Created Host: ${host.name} (${host.email})`);
    } else {
      console.log(`Found Existing Host: ${host.name} (${host.email})`);
    }

    for (const propData of hostItem.properties) {
      let property = await prisma.property.findFirst({
        where: { title: propData.title, hostId: host.id }
      });

      if (!property) {
        property = await prisma.property.create({
          data: {
            hostId: host.id,
            title: propData.title,
            description: `Beautiful ${propData.propertyType} located in ${propData.city}. Managed jointly with expert co-hosting.`,
            address: propData.address,
            city: propData.city,
            state: propData.state,
            country: propData.country,
            category: propData.category,
            propertyType: propData.propertyType,
            basePrice: propData.basePrice,
            bedrooms: propData.bedrooms,
            beds: propData.bedrooms,
            bathrooms: propData.bathrooms,
            maxGuests: propData.maxGuests,
            verificationStatus: propData.verificationStatus,
            listingPurpose: 'RENT',
            instantBook: true,
            totalStock: 1,
            minNights: 1,
            cancellationPolicy: 'FLEXIBLE',
            images: propData.images,
            gallery: [],
            listingExtras: {},
            status: 'ACTIVE',
            slug: `${propData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(Math.random() * 8999 + 1000)}`,
          }
        });
        console.log(`  └─ Created Property: "${property.title}" in ${property.city}`);
      } else {
        console.log(`  └─ Found Property: "${property.title}"`);
      }

      // Ensure co-host relationship exists
      let rel = await prisma.coHostRelationship.findUnique({
        where: {
          propertyId_coHostUserId: {
            propertyId: property.id,
            coHostUserId: coHost.id
          }
        }
      });

      if (!rel) {
        rel = await prisma.coHostRelationship.create({
          data: {
            propertyId: property.id,
            hostUserId: host.id,
            coHostUserId: coHost.id,
            status: 'ACTIVE',
            permissionLevel: propData.permissionType,
            acceptedAt: new Date(),
          }
        });
        console.log(`     └─ Connected Co-Host relationship (${propData.permissionType})`);
      } else {
        // Update permissions level
        rel = await prisma.coHostRelationship.update({
          where: { id: rel.id },
          data: { permissionLevel: propData.permissionType }
        });
        console.log(`     └─ Updated Co-Host relationship status (${propData.permissionType})`);
      }

      // Sync permissions
      await prisma.coHostPermission.deleteMany({
        where: { coHostRelationshipId: rel.id }
      });

      for (const p of propData.permissions) {
        await prisma.coHostPermission.create({
          data: {
            coHostRelationshipId: rel.id,
            permission: p
          }
        });
      }
      console.log(`     └─ Attached ${propData.permissions.length} granular permissions`);

      // Create a guest & booking for active guest display
      const guestEmail = `guest.${property.id.slice(0, 5)}@gmail.com`;
      let guest = await prisma.user.findUnique({ where: { email: guestEmail } });
      if (!guest) {
        guest = await prisma.user.create({
          data: {
            email: guestEmail,
            name: `Guest for ${property.title.split(' ')[0]}`,
            role: 'USER',
            phone: `+91 98111 ${Math.floor(10000 + Math.random() * 90000)}`,
            passwordHash: '$2b$10$abcdefghijklmnopqrstuv'
          }
        });
      }

      // Check if booking exists
      const existingBooking = await prisma.booking.findFirst({
        where: { propertyId: property.id }
      });

      if (!existingBooking) {
        const now = new Date();
        const checkIn = new Date(now.getTime() + 86400000 * 2);
        const checkOut = new Date(now.getTime() + 86400000 * 5);

        await prisma.booking.create({
          data: {
            propertyId: property.id,
            guestId: guest.id,
            checkIn,
            checkOut,
            guests: 2,
            totalAmount: property.basePrice * 3,
            status: 'CONFIRMED'
          }
        });
        console.log(`     └─ Created active guest booking for ${guest.name}`);
      }
    }
  }

  // Also assign all these properties to any user currently logged in or created in user table
  const allUsers = await prisma.user.findMany();
  for (const u of allUsers) {
    if (u.role === 'HOST' || u.role === 'ADMIN') {
      const allProperties = await prisma.property.findMany();
      for (const p of allProperties) {
        if (p.hostId !== u.id) {
          await prisma.coHostRelationship.upsert({
            where: {
              propertyId_coHostUserId: {
                propertyId: p.id,
                coHostUserId: u.id
              }
            },
            create: {
              propertyId: p.id,
              hostUserId: p.hostId,
              coHostUserId: u.id,
              status: 'ACTIVE',
              permissionLevel: 'FULL_ACCESS',
              acceptedAt: new Date(),
              permissions: {
                create: [
                  { permission: 'VIEW_PROPERTY' },
                  { permission: 'EDIT_LISTING' },
                  { permission: 'VIEW_CALENDAR' },
                  { permission: 'MANAGE_CALENDAR' },
                  { permission: 'VIEW_BOOKINGS' },
                  { permission: 'MANAGE_BOOKINGS' },
                  { permission: 'MESSAGE_GUESTS' },
                  { permission: 'MANAGE_MAINTENANCE' },
                  { permission: 'VIEW_REVIEWS' },
                  { permission: 'RESPOND_TO_REVIEWS' },
                  { permission: 'VIEW_EARNINGS' },
                  { permission: 'VIEW_PAYOUTS' }
                ]
              }
            },
            update: {
              status: 'ACCEPTED'
            }
          });
        }
      }
    }
  }

  console.log('✅ Seed finished successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
