import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

describe('Coupon Preview and Quote Contracts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let propertyId: string;
  let basePrice: number;

  const validCouponCode = 'PREVIEW10_TEST';
  const invalidCouponCode = 'INVALID_OR_EXPIRED_CODE_XYZ';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Find or create an available test property
    let property = await prisma.property.findFirst({
      where: { status: 'PUBLISHED', verificationStatus: 'APPROVED' },
    });

    if (!property) {
      let host = await prisma.user.findFirst({ where: { role: 'HOST' } });
      if (!host) {
        host = await prisma.user.create({
          data: {
            name: 'Coupon Preview Host',
            email: 'coupon_preview_host@fairbnb.test',
            phone: '9988776655',
            passwordHash: 'dummy',
            role: 'HOST',
            isActive: true,
          },
        });
      }

      property = await prisma.property.create({
        data: {
          title: 'Coupon Preview Test Villa',
          description: 'Test Property for Coupon Preview',
          slug: 'coupon-preview-villa-' + Date.now(),
          category: 'Villa',
          propertyType: 'Entire Villa',
          listingPurpose: 'Rental',
          address: '123 Preview Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: 400001,
          latitude: 19.076,
          longitude: 72.877,
          maxGuests: 4,
          bedrooms: 2,
          beds: 2,
          bathrooms: 2,
          basePrice: 5000,
          cleaningFee: 500,
          serviceFeeRate: 0.1,
          taxRate: 0.18,
          instantBook: true,
          totalStock: 1,
          minNights: 1,
          cancellationPolicy: 'FLEXIBLE',
          images: [],
          gallery: [],
          listingExtras: {},
          status: 'PUBLISHED',
          verificationStatus: 'APPROVED',
          hostId: host.id,
        },
      });
    }

    propertyId = property.id;
    basePrice = property.basePrice;

    // Create a valid test coupon (10% off, no minimum)
    await prisma.coupon.upsert({
      where: { code: validCouponCode },
      update: {
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 0,
        usageLimit: 10,
        timesUsed: 0,
        isActive: true,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 86400000 * 30),
      },
      create: {
        code: validCouponCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 0,
        usageLimit: 10,
        timesUsed: 0,
        isActive: true,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 86400000 * 30),
      },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.coupon.deleteMany({
      where: { code: validCouponCode },
    });
    await app.close();
  });

  const quotePayload = {
    checkIn: '2028-06-01',
    checkOut: '2028-06-05',
    guests: 1,
  };

  it('a) POST /bookings/quote with an invalid/expired couponCode', async () => {
    const res = await request(app.getHttpServer())
      .post('/bookings/quote')
      .send({
        propertyId,
        ...quotePayload,
        couponCode: invalidCouponCode,
      });

    // Assert HTTP 200 (not an error status)
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);

    // Assert response.pricing is fully populated
    const pricing = res.body.pricing;
    expect(pricing).toBeDefined();
    expect(pricing.nights).toBeGreaterThan(0);
    expect(pricing.baseAmount).toBeGreaterThan(0);
    expect(pricing.taxAmount).toBeGreaterThan(0);
    expect(pricing.totalAmount).toBeGreaterThan(0);

    // Assert response.pricing.discountAmount === 0
    expect(pricing.discountAmount).toBe(0);

    // Assert response.couponError is a non-empty string
    expect(typeof res.body.couponError).toBe('string');
    expect(res.body.couponError.length).toBeGreaterThan(0);
  });

  it('b) POST /bookings/checkout-preview with the same invalid coupon', async () => {
    const res = await request(app.getHttpServer())
      .post('/bookings/checkout-preview')
      .send({
        propertyId,
        ...quotePayload,
        couponCode: invalidCouponCode,
      });

    // Assert HTTP 200 (not an error status)
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);

    // Assert property and stayDetails are still fully present in the response
    expect(res.body.property).toBeDefined();
    expect(res.body.property.id).toBe(propertyId);
    expect(res.body.property.title).toBeDefined();
    expect(res.body.stayDetails).toBeDefined();
    expect(res.body.stayDetails.checkIn).toBe(quotePayload.checkIn);
    expect(res.body.stayDetails.checkOut).toBe(quotePayload.checkOut);
    expect(res.body.stayDetails.nights).toBe(4);

    // Assert response.pricing is fully populated
    const pricing = res.body.pricing;
    expect(pricing).toBeDefined();
    expect(pricing.nights).toBe(4);
    expect(pricing.baseAmount).toBeGreaterThan(0);
    expect(pricing.taxAmount).toBeGreaterThan(0);
    expect(pricing.totalAmount).toBeGreaterThan(0);

    // Assert response.pricing.discountAmount === 0
    expect(pricing.discountAmount).toBe(0);

    // Assert response.couponError is a non-empty string
    expect(typeof res.body.couponError).toBe('string');
    expect(res.body.couponError.length).toBeGreaterThan(0);
  });

  it('c) POST /bookings/quote with a valid coupon', async () => {
    const res = await request(app.getHttpServer())
      .post('/bookings/quote')
      .send({
        propertyId,
        ...quotePayload,
        couponCode: validCouponCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);

    // Assert response.couponError is undefined
    expect(res.body.couponError).toBeUndefined();

    // Calculate expected discount: 10% of baseAmount (4 nights * basePrice)
    const pricing = res.body.pricing;
    const expectedBaseAmount = Number((basePrice * 4).toFixed(2));
    const expectedDiscount = Number((expectedBaseAmount * 0.1).toFixed(2));

    // Assert response.pricing.discountAmount > 0 and matches expected calculation
    expect(pricing.discountAmount).toBeGreaterThan(0);
    expect(pricing.discountAmount).toBe(expectedDiscount);

    // Assert response.pricing.totalAmount reflects the discount
    const expectedTotal = Number(
      (
        expectedBaseAmount +
        pricing.cleaningFee +
        pricing.serviceFee +
        pricing.taxAmount -
        expectedDiscount
      ).toFixed(2),
    );
    expect(pricing.totalAmount).toBe(expectedTotal);
  });

  describe('Coupon Management Role Authorization (Admin Only)', () => {
    let adminToken: string;
    let hostToken: string;
    const testAdminCoupon = 'ADMIN_COUPON_TEST_' + Date.now();

    beforeAll(async () => {
      const hash = await bcrypt.hash('Password123!', 10);

      await prisma.user.upsert({
        where: { email: 'coupon_adm_test@test.com' },
        update: { role: 'ADMIN' },
        create: {
          name: 'Coupon Test Admin',
          email: 'coupon_adm_test@test.com',
          phone: '9900110011',
          passwordHash: hash,
          role: 'ADMIN',
          isActive: true,
        },
      });

      await prisma.user.upsert({
        where: { email: 'coupon_hst_test@test.com' },
        update: { role: 'HOST' },
        create: {
          name: 'Coupon Test Host',
          email: 'coupon_hst_test@test.com',
          phone: '9900110012',
          passwordHash: hash,
          role: 'HOST',
          isActive: true,
        },
      });

      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'coupon_adm_test@test.com', password: 'Password123!' });
      adminToken = adminLogin.body.accessToken;

      const hostLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'coupon_hst_test@test.com', password: 'Password123!' });
      hostToken = hostLogin.body.accessToken;
    });

    afterAll(async () => {
      await prisma.coupon.deleteMany({ where: { code: testAdminCoupon } });
      await prisma.user.deleteMany({
        where: { email: { in: ['coupon_adm_test@test.com', 'coupon_hst_test@test.com'] } },
      });
    });

    it('denies HOST from creating a coupon (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/coupons')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          code: 'HOST_ATTEMPT',
          discountType: 'PERCENTAGE',
          discountValue: 10,
        })
        .expect(403);
    });

    it('denies HOST from listing coupons (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/coupons')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(403);
    });

    it('allows ADMIN to create a coupon (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: testAdminCoupon,
          discountType: 'PERCENTAGE',
          discountValue: 15,
          validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
        })
        .expect(201);

      expect(res.body.code).toBe(testAdminCoupon);
    });

    it('allows ADMIN to list coupons (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.code === testAdminCoupon)).toBe(true);
    });
  });
});

