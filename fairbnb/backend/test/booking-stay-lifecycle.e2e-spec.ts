import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AvailabilityService } from '../src/bookings/availability.service.js';
import { CalendarService } from '../src/calendar/calendar.service.js';
import { IcalService } from '../src/ical/ical.service.js';
import { HostsService } from '../src/hosts/hosts.service.js';
import { BookingsService } from '../src/bookings/bookings.service.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Booking Stay Lifecycle & Read-Site Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let availabilityService: AvailabilityService;
  let calendarService: CalendarService;
  let icalService: IcalService;
  let hostsService: HostsService;
  let bookingsService: BookingsService;

  let hostUser: any;
  let guestUser: any;
  let testProperty: any;
  let activeStayBooking: any;
  let cronTestBooking: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    availabilityService = app.get(AvailabilityService);
    calendarService = app.get(CalendarService);
    icalService = app.get(IcalService);
    hostsService = app.get(HostsService);
    bookingsService = app.get(BookingsService);

    // Clean up any stale test records from earlier runs
    const testEmails = ['staylifecycle-host@fairbnb.test', 'staylifecycle-guest@fairbnb.test'];
    const existingUsers = await prisma.user.findMany({ where: { email: { in: testEmails } } });
    if (existingUsers.length > 0) {
      const uIds = existingUsers.map((u) => u.id);
      const props = await prisma.property.findMany({ where: { hostId: { in: uIds } } });
      const pIds = props.map((p) => p.id);
      await prisma.refund.deleteMany({ where: { booking: { propertyId: { in: pIds } } } });
      await prisma.payment.deleteMany({ where: { booking: { propertyId: { in: pIds } } } });
      await prisma.booking.deleteMany({ where: { propertyId: { in: pIds } } });
      await prisma.property.deleteMany({ where: { hostId: { in: uIds } } });
      await prisma.user.deleteMany({ where: { id: { in: uIds } } });
    }

    const passwordHash = await bcrypt.hash('Password@123', 10);
    hostUser = await prisma.user.create({
      data: {
        name: 'Stay Lifecycle Host',
        email: 'staylifecycle-host@fairbnb.test',
        phone: '9988776655',
        passwordHash,
        role: UserRole.HOST,
        isActive: true,
      },
    });

    guestUser = await prisma.user.create({
      data: {
        name: 'Stay Lifecycle Guest',
        email: 'staylifecycle-guest@fairbnb.test',
        phone: '9988776656',
        passwordHash,
        role: UserRole.USER,
        isActive: true,
      },
    });

    testProperty = await prisma.property.create({
      data: {
        title: 'Stay Lifecycle Test Villa',
        slug: 'stay-lifecycle-test-villa-' + Date.now(),
        description: 'Testing stay transitions and read-sites',
        category: 'Villa',
        propertyType: 'Entire Villa',
        listingPurpose: 'Rental',
        address: '100 Beach Road',
        locality: 'Goa Coast',
        city: 'Goa',
        state: 'Goa',
        country: 'India',
        pincode: 403001,
        maxGuests: 6,
        bedrooms: 3,
        beds: 3,
        bathrooms: 2,
        basePrice: 2500,
        cleaningFee: 500,
        serviceFeeRate: 0.10,
        taxRate: 0.18,
        instantBook: true,
        totalStock: 1,
        minNights: 1,
        cancellationPolicy: 'FLEXIBLE',
        images: [],
        gallery: {},
        listingExtras: {},
        ownershipProofDocs: [],
        adminTags: [],
        unavailableDates: [],
        hostId: hostUser.id,
        status: 'PUBLISHED',
        verificationStatus: 'APPROVED',
      },
    });
  });

  afterAll(async () => {
    // Step 5 FK-Safe Cleanup
    console.log('\n--- Step 5: FK-Safe Cleanup of Test Fixtures ---');
    if (testProperty?.id) {
      const bIds = [activeStayBooking?.id, cronTestBooking?.id].filter(Boolean);
      if (bIds.length > 0) {
        console.log(`[1] Deleting Refunds referencing bookings: ${bIds.join(', ')}`);
        await prisma.refund.deleteMany({ where: { bookingId: { in: bIds } } });

        console.log(`[2] Deleting Payments referencing bookings: ${bIds.join(', ')}`);
        await prisma.payment.deleteMany({ where: { bookingId: { in: bIds } } });

        console.log(`[3] Deleting Bookings: ${bIds.join(', ')}`);
        await prisma.booking.deleteMany({ where: { id: { in: bIds } } });
      }

      console.log(`[4] Deleting Property: ${testProperty.id}`);
      await prisma.property.delete({ where: { id: testProperty.id } });
    }

    const uIds = [hostUser?.id, guestUser?.id].filter(Boolean);
    if (uIds.length > 0) {
      console.log(`[5] Deleting Users: ${uIds.join(', ')}`);
      await prisma.user.deleteMany({ where: { id: { in: uIds } } });
    }
    console.log('--- Cleanup Complete ---\n');

    await app.close();
  });

  it('Case 1: A CHECKED_IN booking returns available: false from availability.service.ts', async () => {
    const checkInDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days ahead
    const checkOutDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 35); // 35 days ahead

    activeStayBooking = await prisma.booking.create({
      data: {
        propertyId: testProperty.id,
        guestId: guestUser.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: 5,
        guests: 2,
        baseAmount: 12500,
        cleaningFee: 500,
        serviceFee: 1300,
        taxAmount: 1500,
        totalAmount: 15800,
        status: 'CHECKED_IN',
        paymentStatus: 'PAID',
      },
    });

    const checkInStr = checkInDate.toISOString().split('T')[0];
    const checkOutStr = checkOutDate.toISOString().split('T')[0];

    const result = await availabilityService.checkAvailability(
      testProperty.id,
      checkInStr,
      checkOutStr,
      2,
    );

    expect(result.available).toBe(false);
    expect(result.reason).toBe('PROPERTY_ALREADY_BOOKED');
  });

  it('Case 2: A CHECKED_IN booking appears in calendar.service.ts and ical.service.ts output', async () => {
    // 2a. Calendar check
    const calData = await calendarService.getPropertyCalendar(testProperty.id);
    const foundInCal = calData.bookings.some(
      (b) => b.id === activeStayBooking.id && b.status === 'CHECKED_IN',
    );
    expect(foundInCal).toBe(true);

    // 2b. iCal check
    const icalFeed = await icalService.generateIcalFeed(testProperty.id);
    expect(icalFeed).toContain(`UID:booking-${activeStayBooking.id}@fairbnb.com`);
    expect(icalFeed).toContain(`Booking ID ${activeStayBooking.id} - Status: CHECKED_IN`);
  });

  it('Case 3: A CHECKED_IN booking is included in hosts.service.ts earnings aggregation', async () => {
    const dashboard = await hostsService.getHostDashboardStats(hostUser.id);
    expect(dashboard.totalEarnings).toBeGreaterThanOrEqual(activeStayBooking.totalAmount);
    expect(dashboard.totalEarnings).toBe(15800);
  });

  it('Case 4: The cron job transitions CONFIRMED → CHECKED_IN → COMPLETED when dates are in the past', async () => {
    // Create a booking that should transition to CHECKED_IN:
    // checkIn was 2 days ago, checkOut is tomorrow
    const pastCheckIn = new Date(Date.now() - 1000 * 60 * 60 * 48);
    const futureCheckOut = new Date(Date.now() + 1000 * 60 * 60 * 24);

    cronTestBooking = await prisma.booking.create({
      data: {
        propertyId: testProperty.id,
        guestId: guestUser.id,
        checkIn: pastCheckIn,
        checkOut: futureCheckOut,
        nights: 3,
        guests: 1,
        baseAmount: 7500,
        cleaningFee: 500,
        serviceFee: 800,
        taxAmount: 900,
        totalAmount: 9700,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    });

    // Run cron job
    await bookingsService.handleStayLifecycleTransitions();

    const checkedInRecord = await prisma.booking.findUnique({
      where: { id: cronTestBooking.id },
    });
    expect(checkedInRecord?.status).toBe('CHECKED_IN');

    // Now advance checkOut into the past (e.g. 2 hours ago) to simulate checkout time arrival
    const pastCheckOut = new Date(Date.now() - 1000 * 60 * 60 * 2);
    await prisma.booking.update({
      where: { id: cronTestBooking.id },
      data: { checkOut: pastCheckOut },
    });

    // Run cron job again
    await bookingsService.handleStayLifecycleTransitions();

    const completedRecord = await prisma.booking.findUnique({
      where: { id: cronTestBooking.id },
    });
    expect(completedRecord?.status).toBe('COMPLETED');
  });
});
