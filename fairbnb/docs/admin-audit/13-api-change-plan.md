# DELIVERABLE 13 — API CHANGE PLAN

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Admin API Specifications  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Scope & Guidelines

This document details the exact contract specifications for the targeted enhancements identified in the audit. 
**Note:** Per audit instructions, **none of these APIs are implemented yet**. Implementation will occur strictly in subsequent phases upon explicit user authorization.

---

## 2. API Specifications

---

### API 1: Consolidated Action Center Feed

- **Method:** `GET`
- **Route:** `/admin/operations/action-center`
- **Purpose:** Returns the top prioritized items requiring immediate administrative review across 5 queues (KYC, Listings, Flagged Reels, Payout Requests, Open Disputes).
- **Authentication:** Bearer JWT (`JwtAuthGuard`)
- **Required Role:** `UserRole.ADMIN`
- **Request Parameters:** None (Optional query: `limit=5`)
- **Response Structure (200 OK):**
  ```json
  {
    "summary": {
      "totalPendingActions": 14,
      "pendingPropertiesCount": 4,
      "pendingKycCount": 3,
      "pendingReelsReportsCount": 2,
      "pendingPayoutsCount": 3,
      "openDisputesCount": 2
    },
    "items": [
      {
        "id": "prop-123",
        "category": "PROPERTY_APPROVAL",
        "title": "Oceanfront Villa",
        "subtitle": "Host: Rahul Sharma (Goa)",
        "priority": "HIGH",
        "createdAt": "2026-09-28T09:15:00Z",
        "actionUrl": "/admin/verification"
      },
      {
        "id": "payout-456",
        "category": "PAYOUT_REQUEST",
        "title": "Payout Request ₹45,000",
        "subtitle": "Host: Priya Patel",
        "priority": "HIGH",
        "createdAt": "2026-09-28T08:30:00Z",
        "actionUrl": "/admin/finance"
      }
    ]
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired token.
  - `403 Forbidden`: Non-admin caller.
- **Classification:** **New Endpoint** (Added to `AdminController`).

---

### API 2: Platform Technical Diagnostics & Health

- **Method:** `GET`
- **Route:** `/admin/system/health`
- **Purpose:** Provides technical health metrics, database query latency, process memory stats, and environment release info.
- **Authentication:** Bearer JWT (`JwtAuthGuard`)
- **Required Role:** `UserRole.ADMIN`
- **Request Parameters:** None
- **Response Structure (200 OK):**
  ```json
  {
    "status": "HEALTHY",
    "timestamp": "2026-09-28T12:00:00.000Z",
    "uptimeSeconds": 86420,
    "environment": "production",
    "version": "0.1.0",
    "gitCommit": "abc1234",
    "database": {
      "status": "CONNECTED",
      "latencyMs": 4.2
    },
    "memory": {
      "heapUsedMb": 142.5,
      "heapTotalMb": 256.0,
      "rssMb": 310.2
    },
    "features": {
      "reelsEnabled": true,
      "maintenanceMode": false
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`
  - `503 Service Unavailable`: If PostgreSQL ping fails.
- **Classification:** **New Endpoint** (Added to `AdminController`).

---

### API 3: Global Multi-Entity Command Search

- **Method:** `GET`
- **Route:** `/admin/search`
- **Purpose:** Fast single-query search returning top matching users, properties, and bookings for the Admin Command Palette.
- **Authentication:** Bearer JWT (`JwtAuthGuard`)
- **Required Role:** `UserRole.ADMIN`
- **Request Parameters:**
  - `q` (string, required, min length: 2): Search keyword
- **Response Structure (200 OK):**
  ```json
  {
    "query": "goa",
    "results": {
      "users": [
        { "id": "u-1", "name": "Goa Host Services", "email": "goa@fairbnb.com", "role": "HOST" }
      ],
      "properties": [
        { "id": "p-101", "title": "Goa Sunset Retreat", "city": "Goa", "status": "PUBLISHED" }
      ],
      "bookings": [
        { "id": "b-901", "confirmationCode": "FB-GOA-2026", "guestName": "Amit Roy", "totalAmount": 12500 }
      ]
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: If query length is less than 2 characters.
  - `401 Unauthorized`, `403 Forbidden`
- **Classification:** **New Endpoint** (Added to `AdminController`).

---

### API 4: User Activity Chronological Timeline

- **Method:** `GET`
- **Route:** `/admin/users/:id/timeline`
- **Purpose:** Aggregates all user lifecycle events (registrations, bookings made, properties listed, reviews, disputes) into a chronological event stream.
- **Authentication:** Bearer JWT (`JwtAuthGuard`)
- **Required Role:** `UserRole.ADMIN`
- **Request Parameters:**
  - `id` (string, required): User UUID
  - `limit` (number, optional, default: 20)
- **Response Structure (200 OK):**
  ```json
  {
    "userId": "usr-889",
    "userName": "Vikram Singh",
    "events": [
      {
        "id": "evt-1",
        "type": "USER_REGISTERED",
        "description": "Account created via phone verification",
        "timestamp": "2026-08-10T14:20:00Z"
      },
      {
        "id": "evt-2",
        "type": "BOOKING_CREATED",
        "description": "Booked 'Sunset Villa' (₹14,000)",
        "referenceId": "bk-102",
        "timestamp": "2026-09-01T11:00:00Z"
      }
    ]
  }
  ```
- **Error Responses:**
  - `404 Not Found`: If user ID does not exist.
  - `401 Unauthorized`, `403 Forbidden`
- **Classification:** **New Endpoint** (Added to `AdminController`).

---

### API 5: Host Impersonation Audit Instrumentation

- **Method:** `POST`
- **Route:** `/admin/hosts/:id/impersonate`
- **Purpose:** (Existing Endpoint) Updated to write an audit entry to `AuditLog`.
- **Authentication:** Bearer JWT (`JwtAuthGuard`)
- **Required Role:** `UserRole.ADMIN`
- **Request Parameters:** `id` (host UUID)
- **Response Structure:** Existing response unchanged (returns impersonation token claims).
- **Behavior Change:** Adds internal call:
  ```typescript
  await this.auditLogService.logAction({
    actorId: adminUser.id,
    actorRole: 'ADMIN',
    action: 'HOST_IMPERSONATION',
    entityType: 'User',
    entityId: host.id,
    details: { hostEmail: host.email, hostName: host.name }
  });
  ```
- **Classification:** **Existing Endpoint Enhancement**.
