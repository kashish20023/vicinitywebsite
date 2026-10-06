# Fairbnb Backend — Complete Implementation Overview

This document provides a comprehensive, complete summary of all backend features, architectural components, database schemas, API endpoints, payment providers, review engines, admin hubs, and test suites implemented in the **Fairbnb** project.

---

## 1. Core Architecture & Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript, Node.js)
- **Database & ORM**: PostgreSQL with [Prisma ORM](file:///Users/ideaind/Desktop/tech/fairbnb/backend/prisma/schema.prisma)
- **Authentication**: JWT Strategy with Passport (`passport-jwt`, `@nestjs/jwt`, `bcrypt`)
- **Role-Based Access Control (RBAC)**: Role hierarchy (`USER` / Guest, `HOST`, `ADMIN`) using custom `@Roles()` decorator and `RolesGuard`
- **Validation**: Strict DTO payload validation using `class-validator` and `class-transformer`
- **Environment Configuration**: `@nestjs/config` managing environment variables (`.env`)

---

## 2. Complete Database Schema (`Prisma`)

File: [schema.prisma](file:///Users/ideaind/Desktop/tech/fairbnb/backend/prisma/schema.prisma)

### Key Entities
- **`User` Model**:
  - User identity (Name, Email, Phone, Password hash).
  - Roles: `USER` (Guest), `HOST`, `ADMIN`.
  - Verification & Governance flags: `phoneVerified`, `emailVerified`, `isActive`, `isSuperhost`, `blockReason`.
  - OTP Security: `phoneOtpHash`, `phoneOtpExpiresAt`, `otpFailedAttempts`, `otpLockUntil`.
  - Password Reset: `resetTokenHash`, `resetTokenExpiresAt`.
  - Relations: Owned properties, guest bookings, processed refunds, payout requests, reviews given.

- **`Property` Model**:
  - Listing details (Title, Description, Short Description, Neighborhood Description).
  - AI Knowledge Base fields (`aiKnowledgeBasePublic`, `aiKnowledgeBasePrivate`).
  - Categorization: `category`, `propertyType`, `listingPurpose`.
  - Location: Address, Locality, City, State, Country, Pincode, Latitude/Longitude coordinates.
  - Capacity & Pricing: `maxGuests`, `bedrooms`, `beds`, `bathrooms`, `basePrice`, `cleaningFee`, `serviceFeeRate`, `taxRate`, `instantBook`, `minNights`.
  - Stay Guide: `wifiNetwork`, `wifiPassword`, `checkInInstructions`, `houseRules`.
  - Media & Extras: `images` array, `gallery` JSON, `coverImage`, `listingExtras` JSON.
  - Verification & Status: `status` (`DRAFT`, `PUBLISHED`), `verificationStatus` (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`), `rejectionReason`, `ownershipProofDocs`.

- **`Booking` Model**:
  - Reservation details: `propertyId`, `guestId`, `checkIn`, `checkOut`, `guests`.
  - Price Snapshots: `nights`, `baseAmount`, `cleaningFee`, `serviceFee`, `taxAmount`, `totalAmount`, `currency`, `couponCode`, `discountAmount`.
  - Status Tracking: `status` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`), `paymentStatus` (`PENDING`, `PAID`, `PARTIALLY_REFUNDED`).
  - Cancellation tracking: `cancellation` JSON (Reason, CancelledBy, Timestamp).
  - Relations: Payment records, Invoices, Refunds, and 1-to-1 Review.

- **`Payment` Model**:
  - Gateway fields: `bookingId`, `amount`, `currency`, `provider`, `providerOrderId`, `providerPaymentId`, `status` (`PENDING`, `PAID`, `FAILED`), `paidAt`, `idempotencyKey`.

- **`Review` Model**:
  - 1-to-1 unique link to `Booking` (restricted to `COMPLETED` stays).
  - Category ratings: `rating` (overall), `cleanlinessRating`, `accuracyRating`, `locationRating`, `valueRating`.
  - Content: `comment`, `hostReply`, `hostRepliedAt`.

- **`Invoice` Model**:
  - Auto-generated invoice tracking `invoiceNumber`, `amount`, `status`, linked to `Booking`.

- **`Refund` Model**:
  - Financial refund record linked to `Booking` (`amount`, `reason`, `status`, `paymentRefundId`, `processedById`).

---

## 3. Core Engine Architecture

### A. Real-Time Availability & Double-Booking Protection Engine
- **Date Overlap Formula**: Ensures no two confirmed/pending bookings collide using $\text{checkIn} < \text{existingCheckOut} \text{ AND } \text{checkOut} > \text{existingCheckIn}$.
- **Atomic Transactions**: Prisma `$transaction` row-level checks prevent simultaneous double bookings (returns HTTP 409 Conflict).

### B. Airbnb Pricing Engine (`PricingService`)
- Calculates itemized pricing breakdowns:
  $$\text{Total} = \text{Base Amount} + \text{Cleaning Fee} + \text{10\% Service Fee} + \text{18\% Tax} - \text{Discount}$$

### C. Payment Gateway & Auto-Invoicing (`PaymentsService`)
- Gateway Abstraction (`MockRazorpayProvider`).
- Idempotent Webhook Handler (`POST /payments/webhook`) tracking `idempotencyKey` and generating invoices (`INV-`) upon payment success.

### D. Cancellation & Refund Policy Engine (`CancellationService`)
- Enforces policy math:
  - `FLEXIBLE`: 100% refund prior to check-in.
  - `MODERATE`: 50% refund.
  - `STRICT`: Non-refundable.

---

## 4. API Endpoints Reference

### Auth & Security (`src/auth`)
- `POST /auth/register` — Register user/host
- `POST /auth/login` — Authenticate & receive JWT
- `GET /auth/me` — Fetch current user profile
- `POST /auth/send-otp` & `POST /auth/verify-otp` — Phone OTP verification
- `POST /auth/change-password`, `POST /auth/forgot-password`, `POST /auth/reset-password`

### Properties & Search (`src/properties`)
- `GET /properties` — Public catalog search (Filter by city, category, dates, price)
- `GET /properties/my-properties` — Host portfolio
- `GET /properties/:idOrSlug` — Single property detail
- `POST /properties` — Host create listing (`PENDING_APPROVAL`)
- `PATCH /properties/:id/approve` & `PATCH /properties/:id/reject` — Admin moderation
- `PATCH /properties/:id` & `DELETE /properties/:id` — Update / delete listing

### Guest Bookings & Trips Portal (`src/bookings`)
- `GET /properties/:id/availability` — Check date range availability
- `POST /bookings/quote` — Pricing breakdown quote
- `POST /bookings/checkout-preview` — Checkout page preview (`/book/stays/{id}`)
- `POST /bookings` — Create double-booking protected reservation
- `GET /bookings/my-trips` — Enriched Trips Portal (Stay guide, Wi-Fi info, host card)
- `POST /bookings/:id/cancel` — Guest cancellation with policy refund

### Payments & Invoicing (`src/payments`)
- `POST /payments/create-order` — Initialize payment order
- `POST /payments/webhook` — Process gateway webhook event & auto-invoice

### Post-Stay Reviews (`src/reviews`)
- `POST /reviews` — Submit multi-category 5-star review (Guest, COMPLETED stays only)
- `GET /properties/:id/reviews` — Fetch property reviews & category averages summary
- `POST /reviews/:id/reply` — Host reply to guest review

### Admin Governance Hub (`src/admin`)
- `GET /admin/overview` — Operational platform metrics & stats
- `GET /admin/guests` — Guest directory (`USER` role) with trip counts, lifetime bookings & total spent
- `PATCH /admin/guests/:id/block` — 1-Click Guest block/unblock account with reason
- `GET /admin/hosts` — Host directory with property counts, revenue & `isSuperhost` badge
- `POST /admin/hosts/:id/impersonate` — Generate Host Impersonation context for Admin preview
- `POST /admin/properties/:id/transfer` — Transfer property ownership to new host
- `GET /admin/bookings` & `POST /admin/bookings/:id/refund` — Admin booking & refund control

---

## 5. Verification & Test Suite Results

### 1. Automated System Integration Test (`test_complete_flow.mjs`)
- **Suite 1**: Auth & Role Setup — Passed
- **Suite 2**: Property Lifecycle — Passed
- **Suite 3**: Availability & Pricing Quote — Passed
- **Suite 4**: Guest Booking & Double-Booking Lock — Passed
- **Suite 5**: Payment Webhook & Invoice Generation — Passed
- **Suite 6**: Guest Trips Portal & Stay Guide — Passed
- **Suite 7**: Post-Stay Reviews & Category Ratings — Passed
- **Suite 8**: Policy-Driven Cancellation & Refund — Passed
- **Suite 9**: Admin Guests, Hosts & Property Transfer Operations — Passed
- **Result**: 🎉 **100% Pass Rate (9/9 End-to-End Suites Passed)**

### 2. Unit Test Suite (`npm run test`)
- **Result**: 🎉 **100% Pass Rate (21/21 Unit Tests Passed across 7 Test Suites)**
