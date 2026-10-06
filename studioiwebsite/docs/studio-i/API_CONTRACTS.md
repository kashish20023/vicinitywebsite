# Studio I — REST API Contracts & Endpoint Specification (`API_CONTRACTS.md`)

> **Protocol**: REST over HTTPS  
> **Base URL**: `http://localhost:5002/api/v1` (Local Dev)  
> **Authentication**: Bearer JWT token (`Authorization: Bearer <token>`)  
> **Standard Error Schema**: `{ statusCode: number, message: string, error: string }`

---

## 1. Authentication & User Management

### `POST /auth/register`
- **Access**: Public
- **Body**: `{ email: string, password: string, name: string, phone: string, companyName?: string, gstin?: string }`
- **Response**: `{ user: { id, email, name, role: 'USER' }, token: string }`

### `POST /auth/login`
- **Access**: Public
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user: { id, email, name, role }, token: string }`

### `GET /auth/me`
- **Access**: Authenticated (`USER` or `ADMIN`)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ id, email, name, phone, role, companyName, gstin, isBlocked }`

---

## 2. Workspaces & Inventory Catalog

### `GET /workspaces`
- **Access**: Public
- **Query**: `city?: string, type?: UnitType, limit?: number, page?: number`
- **Response**: `{ workspaces: Workspace[], total: number, page: number }`

### `GET /workspaces/:slug`
- **Access**: Public
- **Response**: `{ workspace: Workspace, buildings: Building[], amenities: Amenity[], plans: BookingPlan[] }`

### `GET /workspaces/:id/floors`
- **Access**: Public
- **Response**: `{ floors: Floor[], activeVersion: FloorPlanVersion }`

### `GET /floors/:id/availability`
- **Access**: Public
- **Query**: `startDateTime: ISO8601, endDateTime: ISO8601, unitType?: UnitType`
- **Response**:
  ```json
  {
    "floorId": "uuid",
    "schedule": { "start": "2026-09-23T09:00:00Z", "end": "2026-09-23T18:00:00Z" },
    "units": [
      {
        "id": "uuid",
        "unitCode": "D-101",
        "unitType": "HOT_DESK",
        "status": "AVAILABLE",
        "x": 120,
        "y": 80,
        "ratePaise": 49900
      }
    ]
  }
  ```

---

## 3. Pricing Quotes & Inventory Holds

### `POST /bookings/quote`
- **Access**: Public / Auth
- **Body**: `{ unitId: string, planId: string, startDateTime: string, endDateTime: string, couponCode?: string, addOnIds?: string[] }`
- **Response**:
  ```json
  {
    "unitId": "uuid",
    "baseRatePaise": 50000,
    "addOnsPaise": 5000,
    "discountPaise": 5000,
    "subtotalPaise": 50000,
    "taxPaise": 9000,
    "securityDepositPaise": 0,
    "totalPayablePaise": 59000,
    "currency": "INR",
    "appliedCoupon": { "code": "STUDIO10", "discountPaise": 5000 },
    "quoteToken": "jwt_signed_quote_token"
  }
  ```

### `POST /bookings/hold`
- **Access**: `USER`
- **Body**: `{ unitId: string, startDateTime: string, endDateTime: string }`
- **Response**: `{ holdId: string, unitId: string, expiresAt: string, ttlSeconds: 600 }`
- **Error Codes**: `409 Conflict` (Unit unavailable), `429 Too Many Requests` (Anti-hoarding cap exceeded).

---

## 4. Bookings & Checkout

### `POST /payments/order`
- **Access**: `USER`
- **Body**: `{ holdId: string, quoteToken: string, paymentMethod: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' }`
- **Response**: `{ orderId: string, amountPaise: number, providerOrderId: string, simulationMode: true }`

### `POST /payments/verify`
- **Access**: `USER`
- **Headers**: `Idempotency-Key: <uuid>`
- **Body**: `{ orderId: string, providerPaymentId: string, providerSignature?: string }`
- **Response**: `{ booking: Booking, digitalPass: DigitalPass, receiptUrl: string }`

### `GET /bookings/my`
- **Access**: `USER`
- **Query**: `status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'`
- **Response**: `{ bookings: Booking[] }`

### `POST /bookings/:id/cancel`
- **Access**: `USER` (Owner) or `ADMIN`
- **Body**: `{ reason: string }`
- **Response**: `{ bookingId: string, status: 'CANCELLED', refundAmountPaise: number, refundStatus: 'COMPLETED' }`

---

## 5. Admin Operations API

### `GET /admin/dashboard`
- **Access**: `ADMIN`
- **Response**: `{ totalBookings: number, todayBookings: number, totalCollectedPaise: number, currentOccupancyPercent: number, activePresence: number }`

### `POST /admin/workspaces`
- **Access**: `ADMIN`
- **Body**: `{ name: string, city: string, address: string, latitude: number, longitude: number, timezone: string }`
- **Response**: `{ workspace: Workspace }`

### `POST /admin/floors/:id/publish-layout`
- **Access**: `ADMIN`
- **Body**: `{ objects: FloorPlanObject[], units: Unit[] }`
- **Response**: `{ version: number, publishedAt: string, unitsCount: number }`

### `GET /admin/finance/summary`
- **Access**: `ADMIN`
- **Response**: `{ grossRevenuePaise: number, netCollectedPaise: number, refundsPaise: number, depositsHeldPaise: number }`
