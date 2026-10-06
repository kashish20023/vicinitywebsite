import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding Rich Mock Data to FairBnB Database...\n');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. CREATE HOSTS
  console.log('👤 Seeding Verified Host Profiles...');
  const hosts = [
    {
      id: 'usr_host_karan_01',
      name: 'Karan Mehra',
      email: 'karan.host@fairbnb.com',
      phone: '+919810111222',
      passwordHash,
      role: UserRole.HOST,
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'usr_host_rohit_02',
      name: 'Rohit Deshmukh',
      email: 'rohit.host@fairbnb.com',
      phone: '+919820222333',
      passwordHash,
      role: UserRole.HOST,
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'usr_host_sunita_03',
      name: 'Sunita Nambiar',
      email: 'sunita.host@fairbnb.com',
      phone: '+919830333444',
      passwordHash,
      role: UserRole.HOST,
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'usr_host_tarun_04',
      name: 'Tarun Rathore',
      email: 'tarun.host@fairbnb.com',
      phone: '+919840444555',
      passwordHash,
      role: UserRole.HOST,
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
  ];

  for (const h of hosts) {
    await prisma.user.upsert({
      where: { email: h.email },
      update: { role: h.role, isActive: true },
      create: h,
    });
  }

  // 2. CREATE GUESTS
  console.log('👤 Seeding Guest Accounts...');
  const guests = [
    {
      id: 'usr_guest_arjun_01',
      name: 'Arjun Kapoor',
      email: 'arjun.guest@fairbnb.com',
      phone: '+919850555666',
      passwordHash,
      role: UserRole.USER,
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'usr_guest_shreya_02',
      name: 'Shreya Iyer',
      email: 'shreya.guest@fairbnb.com',
      phone: '+919860666777',
      passwordHash,
      role: UserRole.USER,
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
  ];

  for (const g of guests) {
    await prisma.user.upsert({
      where: { email: g.email },
      update: { isActive: true },
      create: g,
    });
  }

  // 3. CURATED PROPERTIES ACROSS INDIA
  console.log('🏠 Seeding Curated Luxury Properties...');
  const mockProperties = [
    {
      id: 'prop_jaipur_haveli_001',
      slug: 'royal-heritage-haveli-jaipur',
      title: 'Royal Heritage Haveli & Courtyard Palace',
      description: 'Step into 250 years of royal Rajasthani grandeur in the heart of Jaipur. Features handcrafted jharokhas, marble courtyards, heated plunge pool, and traditional candlelit dining.',
      shortDescription: 'Historic 5BHK Heritage Haveli with Private Courtyard & Heated Pool',
      neighborhoodDescription: 'Located in C-Scheme, 10 minutes to City Palace, Hawa Mahal, and boutique bazaars.',
      category: 'Haveli',
      propertyType: 'Entire Place',
      listingPurpose: 'Short-Term Rental',
      address: '22 Civil Lines Road, C-Scheme',
      locality: 'C-Scheme',
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      pincode: 302001,
      maxGuests: 10,
      bedrooms: 5,
      beds: 6,
      bathrooms: 5,
      basePrice: 24000.0,
      totalStock: 1,
      gallery: [],
      listingExtras: { wifi: true, pool: true, heating: true },
      instantBook: true,
      minNights: 2,
      cancellationPolicy: 'MODERATE',
      ownershipProofDocs: ['doc_ownership_jaipur_001.pdf'],
      unavailableDates: [],
      adminTags: ['featured', 'heritage', 'luxury'],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      verificationStatus: 'APPROVED',
      hostId: 'usr_host_tarun_04',
    },
    {
      id: 'prop_kerala_backwaters_002',
      slug: 'backwater-serenity-villa-alleppey',
      title: 'Backwater Serenity Lakefront Villa',
      description: 'Wake up to the tranquil waters of Vembanad Lake in Alleppey. Includes private wooden deck, sunset canoe rides, organic Kerala Ayurvedic breakfasts, and open-air rain showers.',
      shortDescription: 'Serene 3BHK Waterfront Villa on Alleppey Backwaters with Private Jetty',
      neighborhoodDescription: 'Peaceful village setting in Punnamada, famous for scenic canals and houseboats.',
      category: 'Resort',
      propertyType: 'Entire Place',
      listingPurpose: 'Short-Term Rental',
      address: 'Vembanad Lakefront, Punnamada',
      locality: 'Punnamada',
      city: 'Alleppey',
      state: 'Kerala',
      country: 'India',
      pincode: 688006,
      maxGuests: 6,
      bedrooms: 3,
      beds: 3,
      bathrooms: 3,
      basePrice: 12500.0,
      totalStock: 1,
      gallery: [],
      listingExtras: { wifi: true, lakeView: true, breakfast: true },
      instantBook: true,
      minNights: 1,
      cancellationPolicy: 'FLEXIBLE',
      ownershipProofDocs: ['doc_ownership_kerala_002.pdf'],
      unavailableDates: [],
      adminTags: ['featured', 'backwaters', 'nature'],
      images: [
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      verificationStatus: 'APPROVED',
      hostId: 'usr_host_sunita_03',
    },
    {
      id: 'prop_mumbai_skyline_003',
      slug: 'bandra-skyline-sea-view-penthouse',
      title: 'Bandra West Horizon Penthouse with Sea View',
      description: 'Ultra-modern 36th-floor penthouse overlooking the Arabian Sea and the Bandra-Worli Sea Link. Features designer Italian interiors, floor-to-ceiling glass, and wrap-around sunset balcony.',
      shortDescription: 'Modern 3BHK Luxury Skyline Penthouse in Bandra West with Arabian Sea Views',
      neighborhoodDescription: 'Heart of Bandra West, footsteps away from Carter Road promenade, trendy cafes, and designer stores.',
      category: 'Apartment',
      propertyType: 'Entire Place',
      listingPurpose: 'Short-Term Rental',
      address: 'Pali Hill Road, Bandra West',
      locality: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: 400050,
      maxGuests: 6,
      bedrooms: 3,
      beds: 3,
      bathrooms: 3,
      basePrice: 22000.0,
      totalStock: 1,
      gallery: [],
      listingExtras: { wifi: true, seaView: true, gym: true },
      instantBook: true,
      minNights: 1,
      cancellationPolicy: 'MODERATE',
      ownershipProofDocs: ['doc_ownership_mumbai_003.pdf'],
      unavailableDates: [],
      adminTags: ['luxury', 'skyline', 'urban'],
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      verificationStatus: 'APPROVED',
      hostId: 'usr_host_rohit_02',
    },
    {
      id: 'prop_rishikesh_retreat_004',
      slug: 'himalayan-ganga-view-villa-rishikesh',
      title: 'Ganga Valley Sanctuary & Yoga Villa',
      description: 'Perched on the green foothills of the Himalayas with breathtaking views of the sacred Ganges river. Features private meditation pavilion, outdoor jacuzzi, and tranquil mountain breezes.',
      shortDescription: 'Tranquil 4BHK Mountain Sanctuary with Ganges River & Valley Views',
      neighborhoodDescription: 'Tapovan area, 5 minutes to Laxman Jhula, yoga ashrams, and riverside cafes.',
      category: 'Villa',
      propertyType: 'Entire Place',
      listingPurpose: 'Short-Term Rental',
      address: 'Tapovan Upper Heights, Badrinath Road',
      locality: 'Tapovan',
      city: 'Rishikesh',
      state: 'Uttarakhand',
      country: 'India',
      pincode: 249192,
      maxGuests: 8,
      bedrooms: 4,
      beds: 4,
      bathrooms: 4,
      basePrice: 16500.0,
      totalStock: 1,
      gallery: [],
      listingExtras: { wifi: true, jacuzzi: true, riverView: true },
      instantBook: true,
      minNights: 2,
      cancellationPolicy: 'FLEXIBLE',
      ownershipProofDocs: ['doc_ownership_rishikesh_004.pdf'],
      unavailableDates: [],
      adminTags: ['mountains', 'yoga', 'wellness'],
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      verificationStatus: 'APPROVED',
      hostId: 'usr_host_karan_01',
    },
    {
      id: 'prop_coorg_estate_005',
      slug: 'misty-hills-coffee-plantation-coorg',
      title: 'Misty Plantation Estate Cottage & Stream',
      description: 'Nestled inside a 40-acre organic Arabica coffee plantation in Madikeri, Coorg. Features natural rock spring, bonfire pit, heritage teakwood architecture, and fresh estate-brewed coffee.',
      shortDescription: 'Peaceful 3BHK Wooden Cottage nestled in a 40-Acre Coffee Plantation',
      neighborhoodDescription: 'Madikeri hills, close to Abbey Falls and Raja Seat sunset viewpoint.',
      category: 'Cottage',
      propertyType: 'Entire Place',
      listingPurpose: 'Short-Term Rental',
      address: 'Kakkabe Road, Madikeri Estate',
      locality: 'Madikeri',
      city: 'Coorg',
      state: 'Karnataka',
      country: 'India',
      pincode: 571201,
      maxGuests: 6,
      bedrooms: 3,
      beds: 3,
      bathrooms: 3,
      basePrice: 9500.0,
      totalStock: 1,
      gallery: [],
      listingExtras: { wifi: true, bonfire: true, breakfast: true },
      instantBook: true,
      minNights: 1,
      cancellationPolicy: 'FLEXIBLE',
      ownershipProofDocs: ['doc_ownership_coorg_005.pdf'],
      unavailableDates: [],
      adminTags: ['nature', 'coffee', 'serene'],
      images: [
        'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      verificationStatus: 'APPROVED',
      hostId: 'usr_host_sunita_03',
    },
  ];

  for (const p of mockProperties) {
    await prisma.property.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  // 4. SEED SAMPLE BOOKINGS & REVIEWS
  console.log('📅 Seeding Sample Past Stays & Verified Reviews...');
  const sampleStays = [
    {
      bookingId: 'bk_sample_jaipur_01',
      propertyId: 'prop_jaipur_haveli_001',
      guestId: 'usr_guest_arjun_01',
      checkIn: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      guests: 4,
      totalAmount: 72000.0,
      review: {
        id: 'rev_jaipur_01',
        rating: 5,
        cleanlinessRating: 5,
        accuracyRating: 5,
        locationRating: 5,
        valueRating: 5,
        comment: 'An unforgettable royal experience! The haveli architecture and evening courtyard lighting were magical. Tarun was the most welcoming host.',
        hostReply: 'Thank you Arjun! It was a true pleasure hosting you at our family heritage estate.',
      },
    },
    {
      bookingId: 'bk_sample_kerala_02',
      propertyId: 'prop_kerala_backwaters_002',
      guestId: 'usr_guest_shreya_02',
      checkIn: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalAmount: 37500.0,
      review: {
        id: 'rev_kerala_02',
        rating: 5,
        cleanlinessRating: 5,
        accuracyRating: 5,
        locationRating: 5,
        valueRating: 5,
        comment: 'The backwater sunset view from the private deck is heaven on earth. Fresh Kerala breakfast every morning was outstanding.',
        hostReply: 'Delighted to hear you enjoyed the serene lake views and traditional food, Shreya!',
      },
    },
  ];

  for (const s of sampleStays) {
    const booking = await prisma.booking.upsert({
      where: { id: s.bookingId },
      update: {
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
      create: {
        id: s.bookingId,
        propertyId: s.propertyId,
        guestId: s.guestId,
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        guests: s.guests,
        totalAmount: s.totalAmount,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
    });

    // Create review
    await prisma.review.upsert({
      where: { id: s.review.id },
      update: {},
      create: {
        id: s.review.id,
        bookingId: booking.id,
        propertyId: s.propertyId,
        reviewerId: s.guestId,
        rating: s.review.rating,
        cleanlinessRating: s.review.cleanlinessRating,
        accuracyRating: s.review.accuracyRating,
        locationRating: s.review.locationRating,
        valueRating: s.review.valueRating,
        comment: s.review.comment,
        hostReply: s.review.hostReply,
        hostRepliedAt: new Date(),
      },
    });
  }

  console.log('✅ Rich mock data successfully inserted into FairBnB database!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding mock data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
