# Fairbnb Backend — Authentication & Authorization Documentation

> Complete reference for the authentication system, API endpoints, guards, decorators,
> security architecture, database schema, and testing.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Roles & Permissions](#5-roles--permissions)
6. [Environment Configuration](#6-environment-configuration)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Guards & Decorators](#8-guards--decorators)
9. [Security Architecture](#9-security-architecture)
10. [Testing](#10-testing)
11. [Example Usage Flows](#11-example-usage-flows)
12. [Future Modules Integration Guide](#12-future-modules-integration-guide)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Architecture Overview

```
                    ┌───────────────┐
                    │    Register   │  POST /auth/register
                    └───────┬───────┘
                            ↓
                    Create USER (role forced)
                            ↓
                    bcrypt hash password
                            ↓
                       PostgreSQL
                            │
                            ↓
                    ┌───────────────┐
                    │     Login     │  POST /auth/login
                    └───────┬───────┘
                            ↓
                    bcrypt.compare()
                            ↓
                       Generate JWT
                            ↓
                    ┌───────────────┐
                    │ Protected API  │  Authorization: Bearer <token>
                    └───────┬───────┘
                            ↓
                     JwtAuthGuard
                            ↓
                     JwtStrategy (validate user exists + isActive)
                            ↓
                      RolesGuard
                            ↓
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
        USER              HOST              ADMIN
          │                 │                 │
          ↓                 ↓                 ↓
     User Actions      Host Actions      Admin Actions
```

---

## 2. Technology Stack

| Technology         | Version  | Purpose                        |
| ------------------ | -------- | ------------------------------ |
| NestJS             | ^11.0.1  | Backend framework              |
| Prisma ORM         | ^6.19.3  | Database ORM                   |
| PostgreSQL         | -        | Database                       |
| @nestjs/jwt        | ^11.0.2  | JWT token generation/validation|
| @nestjs/passport   | ^11.0.5  | Authentication middleware      |
| passport-jwt       | ^4.0.1   | JWT Passport strategy          |
| bcrypt             | ^6.0.0   | Password hashing               |
| class-validator    | ^0.15.1  | DTO validation                 |
| class-transformer  | ^0.5.1   | DTO transformation             |
| @nestjs/config     | ^4.0.4   | Environment configuration      |

---

## 3. Project Structure

```
src/
├── main.ts                         # Entry point + Global ValidationPipe
├── app.module.ts                   # Root module (imports Auth, Users, Config, Prisma)
├── app.controller.ts               # Health check endpoint (GET /)
├── app.service.ts                  # App service
│
├── auth/                           # ── Authentication Module ──
│   ├── auth.module.ts              # Module: JWT, Passport, UsersModule
│   ├── auth.controller.ts          # 8 auth endpoints
│   ├── auth.service.ts             # Business logic (register, login, OTP, passwords)
│   │
│   ├── dto/                        # ── Request Validation ──
│   │   ├── register.dto.ts         # name, email?, phone, password (NO role field)
│   │   ├── login.dto.ts            # email, password
│   │   ├── change-password.dto.ts  # currentPassword, newPassword
│   │   ├── forgot-password.dto.ts  # email
│   │   ├── reset-password.dto.ts   # resetToken, newPassword
│   │   └── verify-otp.dto.ts       # otp (6 digits)
│   │
│   ├── guards/                     # ── Auth Guards ──
│   │   ├── jwt-auth.guard.ts       # Requires valid JWT
│   │   └── roles.guard.ts          # Checks @Roles() metadata
│   │
│   ├── strategies/                 # ── Passport Strategies ──
│   │   └── jwt.strategy.ts         # JWT extraction, validation, user lookup
│   │
│   └── decorators/                 # ── Custom Decorators ──
│       ├── roles.decorator.ts      # @Roles(UserRole.ADMIN)
│       └── current-user.decorator.ts  # @CurrentUser()
│
├── users/                          # ── Users Module ──
│   ├── users.module.ts             # Module (exports UsersService)
│   ├── users.service.ts            # CRUD operations via Prisma
│   └── users.controller.ts         # Admin-only user management
│
└── prisma/                         # ── Prisma Module ──
    ├── prisma.module.ts            # Global module
    └── prisma.service.ts           # Extends PrismaClient

prisma/
├── schema.prisma                   # UserRole enum + User + Property models
├── seed.ts                         # Admin seed script
└── migrations/                     # Auto-generated migrations

test/
├── auth.e2e-spec.ts                # 26 automated E2E tests
├── manual-test.sh                  # 39 curl-based manual API tests
├── app.e2e-spec.ts                 # Default NestJS e2e test
└── jest-e2e.json                   # E2E Jest configuration
```

---

## 4. Database Schema

### UserRole Enum

```prisma
enum UserRole {
  USER    # Default role for all registrations
  HOST    # Can manage properties (admin-assigned only)
  ADMIN   # Full system access (seed-created only)
}
```

> **⚠️ NO BROKER ROLE EXISTS. Only USER, HOST, ADMIN.**

### User Model

```prisma
model User {
  id                  String    @id @default(uuid())
  name                String
  email               String?   @unique
  phone               String    @unique
  passwordHash        String                        # bcrypt hash, NEVER returned

  role                UserRole  @default(USER)      # Prisma enum, not String

  phoneVerified       Boolean   @default(false)
  emailVerified       Boolean   @default(false)
  isActive            Boolean   @default(true)      # false = blocked from auth

  // OTP fields for phone verification
  phoneOtpHash        String?                       # bcrypt-hashed OTP
  phoneOtpExpiresAt   DateTime?                     # OTP expiry time
  otpFailedAttempts   Int       @default(0)         # Rate limiting counter
  otpLockUntil        DateTime?                     # Lock after 5 failed attempts

  // Password reset fields
  resetTokenHash      String?                       # bcrypt-hashed reset token
  resetTokenExpiresAt DateTime?                     # Token expiry time

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

### Property Model (existing — unchanged)

The `Property` model exists with `hostId` and `ownerId` fields but has no foreign key relations to `User` yet. Relations will be added when the Properties module is implemented.

---

## 5. Roles & Permissions

### Role Assignment Rules

| Role  | How it's assigned | Can self-register? |
| ----- | ----------------- | ------------------ |
| USER  | Default on registration | ✅ Yes (always) |
| HOST  | Admin promotes via PATCH /users/:id/role | ❌ No |
| ADMIN | Seed script only | ❌ No |

### Permission Matrix

| Feature             | USER | HOST | ADMIN |
| ------------------- | :--: | :--: | :---: |
| View properties     | ✅   | ✅   | ✅    |
| Book property       | ✅   | ✅   | ✅    |
| Create property     | ❌   | ✅   | ✅    |
| Edit own property   | ❌   | ✅   | ✅    |
| Delete own property | ❌   | ✅   | ✅    |
| Edit any property   | ❌   | ❌   | ✅    |
| Delete any property | ❌   | ❌   | ✅    |
| Approve property    | ❌   | ❌   | ✅    |
| Manage users        | ❌   | ❌   | ✅    |
| Manage hosts        | ❌   | ❌   | ✅    |

---

## 6. Environment Configuration

### Required Variables (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/fairbnb?schema=public"

# JWT Configuration
JWT_SECRET="your-long-random-secret-key-here"   # NEVER hardcode in code
JWT_EXPIRES_IN="1d"                              # Token expiry (1 day)

# Admin Seed (for initial admin creation)
ADMIN_EMAIL="admin@fairbnb.com"
ADMIN_PASSWORD="Admin@123456"
ADMIN_PHONE="9999999999"
ADMIN_NAME="Fairbnb Admin"
```

### Security Notes
- `.env` is in `.gitignore` — never committed to Git
- `JWT_SECRET` must be a long, random string in production
- `ADMIN_PASSWORD` should be changed after first login in production

---

## 7. API Endpoints Reference

### 7.1 POST /auth/register — User Registration

**Auth Required:** No

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",     // optional
  "phone": "9876543210",           // required, min 10 chars
  "password": "Password@123"       // min 8, upper+lower+digit+special
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "USER",
    "phoneVerified": false,
    "emailVerified": false,
    "isActive": true,
    "createdAt": "2026-08-21T05:22:54.737Z",
    "updatedAt": "2026-08-21T05:22:54.737Z"
  }
}
```

**Error Responses:**
| Code | Scenario |
| ---- | -------- |
| 400  | Validation error (invalid email, weak password, missing fields) |
| 400  | Unknown field sent (e.g., `"role": "ADMIN"` — blocked by whitelist) |
| 409  | Email already exists |
| 409  | Phone already exists |

**Security:**
- Role is ALWAYS forced to `USER` regardless of input
- `forbidNonWhitelisted: true` rejects any field not in the DTO
- Sending `"role": "ADMIN"` or `"role": "HOST"` returns 400

**Validation Rules:**
| Field    | Rule |
| -------- | ---- |
| name     | Required, non-empty string |
| email    | Optional, valid email format |
| phone    | Required, string, min 10 characters |
| password | Required, min 8 chars, must have: 1 uppercase, 1 lowercase, 1 digit, 1 special (@$!%*?&#) |

---

### 7.2 POST /auth/login — User Login

**Auth Required:** No

**Request:**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "USER",
    "phoneVerified": false,
    "emailVerified": false,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error Responses:**
| Code | Scenario |
| ---- | -------- |
| 401  | Invalid email (user not found) |
| 401  | Invalid password |
| 401  | User is deactivated (isActive = false) |

**Security:**
- Returns generic `"Invalid credentials"` for ALL failure cases
- Never reveals whether email or password was wrong
- Inactive users get the same generic error

**JWT Payload (minimal):**
```json
{
  "sub": "user-uuid",
  "email": "john@example.com",
  "role": "USER",
  "iat": 1787289756,
  "exp": 1787376156
}
```

---

### 7.3 GET /auth/me — Get Current User

**Auth Required:** JWT (Bearer token)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Success Response (200):**
```json
{
  "id": "uuid-here",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "USER",
  "phoneVerified": false,
  "emailVerified": false,
  "isActive": true,
  "phoneOtpExpiresAt": null,
  "otpFailedAttempts": 0,
  "otpLockUntil": null,
  "resetTokenExpiresAt": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Note:** `passwordHash`, `phoneOtpHash`, and `resetTokenHash` are NEVER returned.

---

### 7.4 POST /auth/send-otp — Send Phone Verification OTP

**Auth Required:** JWT

**Request:** No body needed (phone comes from authenticated user)

**Success Response (200):**
```json
{
  "message": "OTP sent successfully",
  "devOtp": "360320"            // only in development, removed in production
}
```

**Error Responses:**
| Code | Scenario |
| ---- | -------- |
| 400  | Phone already verified |
| 400  | Too many failed attempts (locked for 30 min) |
| 401  | Not authenticated |

**Implementation Details:**
- Generates cryptographically random 6-digit OTP
- Stores bcrypt hash of OTP (never raw OTP)
- OTP expires in 10 minutes
- In dev: logs OTP to console + returns in response
- In production: SMS provider integration needed (marked TODO)

---

### 7.5 POST /auth/verify-otp — Verify Phone OTP

**Auth Required:** JWT

**Request:**
```json
{
  "otp": "360320"
}
```

**Success Response (200):**
```json
{
  "message": "Phone number verified successfully"
}
```

**Error Responses:**
| Code | Scenario |
| ---- | -------- |
| 400  | Invalid OTP |
| 400  | OTP expired |
| 400  | No OTP sent yet |
| 400  | Phone already verified |
| 400  | Account locked (too many failed attempts) |

**Rate Limiting:**
- Max 5 failed attempts
- After 5 failures: locked for 30 minutes
- Lock clears OTP and resets counter

---

### 7.6 POST /auth/change-password — Change Password

**Auth Required:** JWT

**Request:**
```json
{
  "currentPassword": "Password@123",
  "newPassword": "NewPassword@456"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
| Code | Scenario |
| ---- | -------- |
| 401  | Current password incorrect |
| 400  | New password doesn't meet requirements |

---

### 7.7 POST /auth/forgot-password — Request Password Reset

**Auth Required:** No

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 — always, to prevent email enumeration):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent",
  "devResetToken": "6868495dd1fd..."   // only in development
}
```

**Implementation Details:**
- Returns 200 even if email doesn't exist (no email enumeration)
- Generates 32-byte random reset token
- Stores bcrypt hash of token (never raw token)
- Token expires in 30 minutes
- In dev: logs token to console
- In production: email provider integration needed

---

### 7.8 POST /auth/reset-password — Reset Password with Token

**Auth Required:** No

**Request:**
```json
{
  "resetToken": "6868495dd1fd126efa4e386145a05b...",
  "newPassword": "ResetPassword@789"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
| Code | Scenario |
| ---- | -------- |
| 400  | Invalid or expired reset token |
| 400  | Token already used (consumed after single use) |
| 400  | New password doesn't meet requirements |

---

### 7.9 GET /users — List All Users (Admin Only)

**Auth Required:** JWT + ADMIN role

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "USER",
    "phoneVerified": false,
    "emailVerified": false,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### 7.10 GET /users/:id — Get User by ID (Admin Only)

**Auth Required:** JWT + ADMIN role

---

### 7.11 PATCH /users/:id/role — Update User Role (Admin Only)

**Auth Required:** JWT + ADMIN role

**Request:**
```json
{
  "role": "HOST"    // "USER", "HOST", or "ADMIN"
}
```

**This is the ONLY way to make a user HOST or ADMIN.**

---

### 7.12 PATCH /users/:id/status — Activate/Deactivate User (Admin Only)

**Auth Required:** JWT + ADMIN role

**Request:**
```json
{
  "isActive": false
}
```

**Effect:** Deactivated users cannot log in or use any authenticated endpoint.

---

## 8. Guards & Decorators

### JwtAuthGuard

**File:** `src/auth/guards/jwt-auth.guard.ts`

**Purpose:** Validates JWT Bearer token, fetches user from DB, checks isActive.

**Usage:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected-endpoint')
async protectedRoute() { ... }
```

**Behavior:**
- No token → 401 Unauthorized
- Invalid token → 401 Unauthorized
- Expired token → 401 Unauthorized
- User not found → 401 Unauthorized
- User inactive → 401 Unauthorized
- Valid token + active user → Continues, attaches user to request

---

### RolesGuard

**File:** `src/auth/guards/roles.guard.ts`

**Purpose:** Checks if authenticated user's role matches the required roles.

**Usage:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin-only')
async adminRoute() { ... }
```

**IMPORTANT:** Always use `JwtAuthGuard` BEFORE `RolesGuard`.

**Behavior:**
- No roles specified → Allow (pass-through)
- User role matches any required role → Allow
- User role doesn't match → 403 Forbidden

---

### @Roles() Decorator

**File:** `src/auth/decorators/roles.decorator.ts`

**Usage:**
```typescript
// Single role
@Roles(UserRole.ADMIN)

// Multiple roles (OR logic)
@Roles(UserRole.HOST, UserRole.ADMIN)
```

---

### @CurrentUser() Decorator

**File:** `src/auth/decorators/current-user.decorator.ts`

**Usage:**
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: any) {
  return user;
  // user contains: id, name, email, phone, role, isActive, etc.
  // user does NOT contain: passwordHash, phoneOtpHash, resetTokenHash
}
```

---

## 9. Security Architecture

### Password Security

| Aspect | Implementation |
| ------ | -------------- |
| Hashing algorithm | bcrypt |
| Salt rounds | 10 |
| Storage | `passwordHash` field in User model |
| Comparison | `bcrypt.compare()` during login |
| In responses | NEVER returned in any API response |
| In JWT | NEVER included in JWT payload |

### JWT Security

| Aspect | Implementation |
| ------ | -------------- |
| Secret | From `JWT_SECRET` env variable |
| Expiry | From `JWT_EXPIRES_IN` env variable (default: 1 day) |
| Algorithm | HS256 (default) |
| Payload | Minimal: `sub` (user ID), `email`, `role` only |
| Extraction | From `Authorization: Bearer <token>` header |
| Validation | Signature + expiry + user existence + user active |

### Registration Security

| Threat | Protection |
| ------ | ---------- |
| Role escalation via `"role": "ADMIN"` | `forbidNonWhitelisted: true` rejects unknown fields (400) |
| Role escalation via `"role": "HOST"` | DTO has no `role` field; service always sets `UserRole.USER` |
| Weak passwords | Regex: min 8, upper + lower + digit + special |
| Duplicate accounts | Unique constraints on email and phone (409) |
| SQL injection | Prisma parameterized queries |

### Global Validation

```typescript
// Configured in main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    forbidNonWhitelisted: true,   // Reject unknown properties with 400
    transform: true,              // Auto-transform payloads to DTO classes
  }),
);
```

---

## 10. Testing

### Automated E2E Tests (26 tests)

**Run:** `npm run test:e2e`

```
Auth (e2e)
  POST /auth/register
    ✓ should register a valid user successfully
    ✓ should return 409 for duplicate email
    ✓ should return 409 for duplicate phone
    ✓ should return 400 for invalid email format
    ✓ should return 400 for weak password
    ✓ should return 400 for missing required fields
    ✓ should NOT allow role injection — user must remain USER
  POST /auth/login
    ✓ should login with correct credentials and return JWT
    ✓ should return 401 for wrong password
    ✓ should return 401 for unknown user
    ✓ should return 401 for inactive user
  GET /auth/me (JWT tests)
    ✓ should return 401 when no token is provided
    ✓ should return 401 for invalid token
    ✓ should succeed with valid token
  Role-Based Access Control
    ✓ USER → admin endpoint → 403
    ✓ HOST → admin endpoint → 403
    ✓ ADMIN → admin endpoint → 200
    ✓ USER → authenticated endpoint → 200
    ✓ HOST → authenticated endpoint → 200
    ✓ ADMIN → authenticated endpoint → 200
  POST /auth/change-password
    ✓ should change password successfully
    ✓ should reject wrong current password
  POST /auth/forgot-password & POST /auth/reset-password
    ✓ should accept forgot-password for existing user
    ✓ should not reveal if email does not exist
    ✓ should reset password with valid token
    ✓ should reject invalid reset token
```

### Manual API Tests (39 tests)

**Run:** `bash test/manual-test.sh`

Tests every endpoint with real curl requests including:
- Registration with all validation scenarios
- Role injection attack prevention
- Login with valid/invalid/inactive users
- JWT validation (no token, invalid, valid)
- RBAC (USER/HOST/ADMIN access control)
- Admin promoting user to HOST
- Phone OTP send/verify/re-verify
- Password change (valid + invalid current password)
- Forgot/reset password (valid token, invalid token, token reuse)
- Admin deactivate/reactivate user

---

## 11. Example Usage Flows

### Flow 1: New User Registration → Login → Access Protected Route

```bash
# Step 1: Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "8765432100",
    "password": "MyPassword@1"
  }'
# → 201: { message, user: { role: "USER", ... } }

# Step 2: Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "MyPassword@1"
  }'
# → 200: { accessToken: "eyJ...", user: { ... } }

# Step 3: Use token to access protected endpoint
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJ..."
# → 200: { id, name, email, phone, role, ... }
```

### Flow 2: Admin Promotes User to HOST

```bash
# Admin logs in
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fairbnb.com", "password": "Admin@123456"}'
# → 200: { accessToken: "admin-token-here" }

# Admin lists users
curl http://localhost:3000/users \
  -H "Authorization: Bearer admin-token-here"
# → 200: [{ id: "user-uuid", name: "Jane", role: "USER", ... }]

# Admin promotes to HOST
curl -X PATCH http://localhost:3000/users/user-uuid/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token-here" \
  -d '{"role": "HOST"}'
# → 200: { id, name, role: "HOST", ... }
```

### Flow 3: Phone Verification

```bash
# Step 1: Send OTP (requires JWT)
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Authorization: Bearer user-token"
# → 200: { message: "OTP sent", devOtp: "407009" }

# Step 2: Verify OTP
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-token" \
  -d '{"otp": "407009"}'
# → 200: { message: "Phone number verified successfully" }
```

### Flow 4: Password Reset

```bash
# Step 1: Request reset
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com"}'
# → 200: { message: "...", devResetToken: "abc123..." }

# Step 2: Reset password
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"resetToken": "abc123...", "newPassword": "NewSecure@1"}'
# → 200: { message: "Password reset successfully" }
```

---

## 12. Future Modules Integration Guide

### How to protect a new module's endpoints:

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('properties')
export class PropertiesController {

  // Any authenticated user can view
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: any) {
    // user.id, user.role available here
  }

  // Only HOST or ADMIN can create
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  create(@CurrentUser() user: any) {
    // user.role is guaranteed to be HOST or ADMIN
  }

  // Only ADMIN can approve
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approve() {
    // user.role is guaranteed to be ADMIN
  }
}
```

### Modules that will use this auth system:
- Properties (HOST creates, ADMIN approves)
- Bookings (USER books, HOST manages)
- Payments (authenticated users)
- Reviews (authenticated users)
- Chat (authenticated users)
- Admin Dashboard (ADMIN only)

---

## 13. Troubleshooting

### Common Issues

| Issue | Cause | Fix |
| ----- | ----- | --- |
| `EADDRINUSE: address already in use :::3000` | Another process on port 3000 | `lsof -ti:3000 \| xargs kill -9` |
| `JWT_SECRET environment variable is not set` | Missing `.env` | Copy `.env.example` to `.env` and fill values |
| `The table 'public.User' does not exist` | Migration not applied | Run `npx prisma migrate dev` |
| `401 Unauthorized` on valid token | User was deactivated or deleted | Check `isActive` status |
| `400 Bad Request` on registration with `role` | `forbidNonWhitelisted` blocking | Remove `role` from request body |
| Prisma seed error | Admin already exists | Safe — seed is idempotent |

### Useful Commands

```bash
# Run dev server
npm run start:dev

# Build for production
npm run build

# Run E2E tests
npm run test:e2e

# Run manual API tests (server must be running)
bash test/manual-test.sh

# Apply Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed admin user
npx prisma db seed

# Visual DB browser
npx prisma studio

# Reset database (WARNING: drops all data)
npx prisma migrate reset
```
