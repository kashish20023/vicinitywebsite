import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'testuser@example.com',
            'dupuser@example.com',
            'hostuser@example.com',
            'inactiveuser@example.com',
            'changepass@example.com',
            'forgotpass@example.com',
          ],
        },
      },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: ['1111111111', '2222222222', '3333333333', '4444444444', '5555555555', '6666666666', '7777777777'] } },
    });
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // REGISTRATION TESTS (Section 28)
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /auth/register', () => {
    it('should register a valid user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser@example.com',
          phone: '1111111111',
          password: 'Password@123',
        })
        .expect(201);

      expect(res.body.message).toBe('Registration successful');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('USER');
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body.user.phone).toBe('1111111111');
      // passwordHash must NOT be in the response
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Dup User',
          email: 'testuser@example.com', // same email as above
          phone: '2222222222',
          password: 'Password@123',
        })
        .expect(409);
    });

    it('should return 409 for duplicate phone', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Dup Phone User',
          email: 'dupuser@example.com',
          phone: '1111111111', // same phone as first user
          password: 'Password@123',
        })
        .expect(409);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          phone: '3333333333',
          password: 'Password@123',
        })
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Weak Pass',
          email: 'weak@example.com',
          phone: '4444444444',
          password: '123',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'No Phone',
          password: 'Password@123',
        })
        .expect(400);
    });

    it('should NOT allow role injection — user must remain USER', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Malicious User',
          email: 'dupuser@example.com',
          phone: '2222222222',
          password: 'Password@123',
          role: 'ADMIN',
        })
        .expect(400); // forbidNonWhitelisted rejects unknown fields

      // Even if somehow it got through, verify no ADMIN was created
      const user = await prisma.user.findUnique({
        where: { phone: '2222222222' },
      });
      if (user) {
        expect(user.role).toBe('USER');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // LOGIN TESTS (Section 29)
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /auth/login', () => {
    it('should login with correct credentials and return JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body.user.role).toBe('USER');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for unknown user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password@123',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for inactive user', async () => {
      // Create an inactive user
      const hash = await bcrypt.hash('Password@123', 10);
      await prisma.user.create({
        data: {
          name: 'Inactive User',
          email: 'inactiveuser@example.com',
          phone: '5555555555',
          passwordHash: hash,
          role: UserRole.USER,
          isActive: false,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'inactiveuser@example.com',
          password: 'Password@123',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // JWT TESTS (Section 30)
  // ═══════════════════════════════════════════════════════════════════

  describe('GET /auth/me (JWT tests)', () => {
    let validToken: string;

    beforeAll(async () => {
      // Get a valid token
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
        });
      validToken = res.body.accessToken;
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should succeed with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.email).toBe('testuser@example.com');
      expect(res.body.role).toBe('USER');
      expect(res.body.id).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // RBAC TESTS (Section 31)
  // ═══════════════════════════════════════════════════════════════════

  describe('Role-Based Access Control', () => {
    let userToken: string;
    let hostToken: string;
    let adminToken: string;

    beforeAll(async () => {
      // USER token — already created
      const userRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password@123',
        });
      userToken = userRes.body.accessToken;

      // Create HOST user
      const hostHash = await bcrypt.hash('Password@123', 10);
      await prisma.user.upsert({
        where: { email: 'hostuser@example.com' },
        update: {},
        create: {
          name: 'Host User',
          email: 'hostuser@example.com',
          phone: '6666666666',
          passwordHash: hostHash,
          role: UserRole.HOST,
          isActive: true,
        },
      });
      const hostRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'hostuser@example.com',
          password: 'Password@123',
        });
      hostToken = hostRes.body.accessToken;

      // ADMIN token — upsert admin user
      const adminHash = await bcrypt.hash('Admin@123456', 10);
      await prisma.user.upsert({
        where: { email: 'admin@fairbnb.com' },
        update: { passwordHash: adminHash, isActive: true },
        create: {
          name: 'Admin User',
          email: 'admin@fairbnb.com',
          phone: '0000000000',
          passwordHash: adminHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      });
      const adminRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@fairbnb.com',
          password: 'Admin@123456',
        });
      adminToken = adminRes.body.accessToken;
    });

    // Admin-only endpoint: GET /users
    it('USER should NOT access admin endpoint (GET /users) → 403', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('HOST should NOT access admin endpoint (GET /users) → 403', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(403);
    });

    it('ADMIN should access admin endpoint (GET /users) → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    // Authenticated-only endpoint: GET /auth/me
    it('USER should access authenticated endpoint (GET /auth/me) → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body.role).toBe('USER');
    });

    it('HOST should access authenticated endpoint (GET /auth/me) → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);
      expect(res.body.role).toBe('HOST');
    });

    it('ADMIN should access authenticated endpoint (GET /auth/me) → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.role).toBe('ADMIN');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // CHANGE PASSWORD TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /auth/change-password', () => {
    let token: string;

    beforeAll(async () => {
      // Create user for change-password test
      const hash = await bcrypt.hash('Password@123', 10);
      await prisma.user.upsert({
        where: { email: 'changepass@example.com' },
        update: {},
        create: {
          name: 'Change Pass User',
          email: 'changepass@example.com',
          phone: '7777777777',
          passwordHash: hash,
          role: UserRole.USER,
          isActive: true,
        },
      });
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'changepass@example.com',
          password: 'Password@123',
        });
      token = res.body.accessToken;
    });

    it('should change password successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'NewPassword@456',
        })
        .expect(200);

      expect(res.body.message).toBe('Password changed successfully');

      // Verify new password works
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'changepass@example.com',
          password: 'NewPassword@456',
        })
        .expect(200);
      expect(loginRes.body.accessToken).toBeDefined();
    });

    it('should reject wrong current password', async () => {
      // Login with new password first
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'changepass@example.com',
          password: 'NewPassword@456',
        });
      const newToken = loginRes.body.accessToken;

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'AnotherPassword@789',
        })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // FORGOT/RESET PASSWORD TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /auth/forgot-password & POST /auth/reset-password', () => {
    beforeAll(async () => {
      const hash = await bcrypt.hash('Password@123', 10);
      await prisma.user.upsert({
        where: { email: 'forgotpass@example.com' },
        update: {},
        create: {
          name: 'Forgot Pass User',
          email: 'forgotpass@example.com',
          phone: '3333333333',
          passwordHash: hash,
          role: UserRole.USER,
          isActive: true,
        },
      });
    });

    it('should accept forgot-password for existing user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'forgotpass@example.com' })
        .expect(200);

      expect(res.body.message).toContain('password reset');
      // In dev mode, the reset token is returned
      expect(res.body.devResetToken).toBeDefined();
    });

    it('should not reveal if email does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(res.body.message).toContain('password reset');
    });

    it('should reset password with valid token', async () => {
      // Get reset token
      const forgotRes = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'forgotpass@example.com' });
      const resetToken = forgotRes.body.devResetToken;

      // Reset password
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'ResetPassword@123',
        })
        .expect(200);

      expect(res.body.message).toBe('Password reset successfully');

      // Verify new password works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'forgotpass@example.com',
          password: 'ResetPassword@123',
        })
        .expect(200);
    });

    it('should reject invalid reset token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken: 'invalid-token',
          newPassword: 'NewPassword@123',
        })
        .expect(400);
    });
  });
});
