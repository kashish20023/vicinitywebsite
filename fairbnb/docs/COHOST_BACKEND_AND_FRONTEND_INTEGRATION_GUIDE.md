# FAIRBNB — Co-Host Architecture & Frontend Integration Guide

This document provides a comprehensive summary of all backend modules, database models, and API endpoints added for the **FAIRBNB Co-Host System**, followed by a step-by-step frontend integration guide.

---

## PART 1: Summary of What Was Added in Backend

### 1. Fundamental Architectural Principle
> **Co-Host is a property-level relationship, NOT a global user role.**

A single `User` entity maintains standard roles (`USER`, `HOST`, `ADMIN`). On individual properties:
- User #10 can be **HOST/Owner** of Property A
- User #10 can be **CO-HOST** of Property B
- User #10 can be **GUEST** on Property C

---

### 2. Database Models & Schema (`prisma/schema.prisma`)

#### Enums Added
- `CoHostStatus`: `INVITED`, `ACCEPTED`, `VERIFICATION_PENDING`, `VERIFIED`, `ACTIVE`, `SUSPENDED`, `REMOVED`
- `CoHostInvitationStatus`: `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELLED`
- `PayoutRuleStatus`: `PENDING_CONFIRMATION`, `ACTIVE`, `INACTIVE`, `REJECTED`
- `CoHostPermissionEnum`: 17 platform-defined permission codes:
  - **Property**: `VIEW_PROPERTY`, `EDIT_LISTING`
  - **Calendar**: `VIEW_CALENDAR`, `MANAGE_CALENDAR`
  - **Bookings**: `VIEW_BOOKINGS`, `MANAGE_BOOKINGS`, `CANCEL_BOOKINGS`
  - **Guests / Messaging**: `VIEW_GUESTS`, `MESSAGE_GUESTS`
  - **Pricing**: `VIEW_PRICING`, `MANAGE_PRICING`
  - **Operations**: `MANAGE_MAINTENANCE`, `MANAGE_CLEANING`
  - **Reviews**: `VIEW_REVIEWS`, `RESPOND_TO_REVIEWS`
  - **Coupons**: `MANAGE_COUPONS`
  - **Co-Hosts**: `VIEW_COHOSTS`, `MANAGE_COHOSTS`
  - **Earnings**: `VIEW_EARNINGS`
  - **Payments**: `VIEW_PAYOUTS`, `MANAGE_PAYOUT_SETTINGS`

#### Prisma Models Added
1. **`CoHostRelationship`**: Permanent property connection between property, owner (`hostUserId`), and co-host (`coHostUserId`). Has constraint `@@unique([propertyId, coHostUserId])`.
2. **`CoHostPermission`**: Granular permission records linked to a relationship.
3. **`CoHostInvitation`**: Temporary invitation token with `tokenHash` (SHA-256), email/phone, requested permissions, preset level, payout config, and 7-day expiration.
4. **`PayoutRule`**: Financial arrangement model (`FIXED_AMOUNT`, `PERCENTAGE`, `CLEANING_FEE`, `CLEANING_FEE_PLUS_PERCENTAGE`). Strictly enforces **Maximum 1 paid Co-Host per property listing** (India scope).
5. **`FinancialTransaction`**: Financial ledger model for immutable auditability (`BOOKING_PAYMENT`, `PLATFORM_FEE`, `HOST_PAYOUT`, `COHOST_PAYOUT`, `REFUND`, `CANCELLATION_ADJUSTMENT`).

---

### 3. NestJS Co-Host Module Structure (`src/co-host/`)

```text
src/co-host/
├── co-host.module.ts                   // Module registering controller & service
├── co-host.controller.ts               // All REST APIs
├── co-host.service.ts                  // Business logic & rules engine
├── dto/
│   ├── invite-cohost.dto.ts            // Invitation payload validator
│   ├── update-permission.dto.ts        // Permission update payload validator
│   └── payout-settings.dto.ts          // Payout config validator
├── enums/
│   └── co-host-presets.ts              // Permission presets (FULL_ACCESS, OPERATIONS, etc.)
├── guards/
│   └── cohost-permission.guard.ts      // Resource & permission level authorization guard
└── decorators/
    └── co-host-permission.decorator.ts // @RequireCoHostPermission() decorator
```

---

### 4. REST API Endpoint Reference

#### A. Host Management APIs (Run inside Property context)
| HTTP Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/properties/:propertyId/co-hosts/invite` | Send Co-Host invitation | JWT (Owner) |
| `GET` | `/properties/:propertyId/co-hosts` | List property co-hosts | JWT (Owner) |
| `GET` | `/properties/:propertyId/co-hosts/:coHostId` | Get single co-host details | JWT (Owner) |
| `PATCH` | `/co-hosts/:coHostId/permissions` | Update co-host permissions | JWT (Owner) |
| `PATCH` | `/co-hosts/:coHostId/payout` | Configure payout rule | JWT (Owner) |
| `POST` | `/co-hosts/:coHostId/suspend` | Suspend co-host access | JWT (Owner) |
| `POST` | `/co-hosts/:coHostId/reactivate` | Reactivate suspended co-host | JWT (Owner) |
| `DELETE` | `/co-hosts/:coHostId` | Remove co-host relationship | JWT (Owner) |

#### B. Invitation APIs
| HTTP Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/co-hosts/invitations/:token` | View invitation details by raw token | Public |
| `POST` | `/co-hosts/invitations/:token/accept` | Accept invitation | JWT |
| `POST` | `/co-hosts/invitations/:token/decline` | Decline invitation | JWT |

#### C. Co-Host Dashboard & Module APIs
| HTTP Method | Route | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/co-host/me/properties` | - | List properties where current user is Co-Host |
| `POST` | `/co-hosts/payout-rules/:ruleId/confirm` | - | Co-Host confirms payout arrangement |
| `GET` | `/co-host/properties/:propertyId/dashboard` | Active Co-Host | Aggregated dashboard data |
| `GET` | `/co-host/properties/:propertyId/calendar` | `VIEW_CALENDAR` | Property calendar |
| `GET` | `/co-host/properties/:propertyId/bookings` | `VIEW_BOOKINGS` | Property bookings |
| `GET` | `/co-host/properties/:propertyId/messages` | `MESSAGE_GUESTS` | Guest messaging |
| `GET` | `/co-host/properties/:propertyId/maintenance` | `MANAGE_MAINTENANCE` | Maintenance requests |
| `GET` | `/co-host/properties/:propertyId/reviews` | `VIEW_REVIEWS` | Property reviews |

---

## PART 2: Complete Frontend Integration Flow & Architecture

### 1. Recommended Frontend Folder Structure (Next.js App Router)

```text
frontend/src/app/
├── host/
│   └── properties/
│       └── [propertyId]/
│           └── co-hosts/
│               ├── page.tsx                 // Property Co-Hosts list & status overview
│               ├── components/
│               │   ├── CoHostCard.tsx       // Co-Host status card
│               │   ├── InviteCoHostModal.tsx// Invite form (Email/Phone + Presets + Payout)
│               │   ├── PermissionSelector.tsx// Checkbox grid for granular permissions
│               │   ├── PayoutConfigModal.tsx// Payout setup (Fixed/Percentage)
│               │   └── RemoveCoHostModal.tsx// Revoke confirmation modal
│               └── [coHostId]/
│                   └── page.tsx             // Co-Host detail & permission management
│
├── co-host/
│   ├── page.tsx                             // Co-Host Portal Home (List of assigned properties)
│   ├── invitations/
│   │   └── [token]/
│   │       └── page.tsx                     // Accept/Decline Invitation Landing Page
│   └── properties/
│       └── [propertyId]/
│           ├── layout.tsx                   // Co-Host Dashboard Shell (Renders tabs by permissions)
│           ├── page.tsx                     // Co-Host Overview Dashboard
│           ├── calendar/page.tsx            // Calendar View
│           ├── bookings/page.tsx            // Bookings View
│           ├── messages/page.tsx            // Messages View
│           ├── maintenance/page.tsx         // Maintenance View
│           └── reviews/page.tsx             // Reviews View
```

---

### 2. Step-by-Step Frontend Integration Workflows

```text
HOST
  │
  ├── Select Property -> Manage Co-Hosts -> Add Co-Host
  ├── Sends Invite (POST /properties/:propertyId/co-hosts/invite)
  └── Returns raw inviteToken
          │
          ▼
CO-HOST INVITATION LANDING (/co-hosts/invitations/[token])
  │
  ├── Fetches invite details (GET /co-hosts/invitations/:token)
  ├── Reviews property, inviter & permissions
  └── Accepts Invitation (POST /co-hosts/invitations/:token/accept)
          │
          ▼
CO-HOST WORKSPACE PORTAL (/co-host)
  │
  ├── Fetches co-hosted properties (GET /co-host/me/properties)
  └── Opens property workspace (/co-host/properties/[propertyId])
          │
          └── Renders active tabs according to granted permissions
```

---

### 3. Step 1: Host Side — Inviting a Co-Host Component (`InviteCoHostModal.tsx`)

```tsx
import { useState } from 'react';
import { api } from '@/lib/api-client';

export function InviteCoHostModal({ propertyId, onSuccess }: { propertyId: string; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('FULL_ACCESS');
  const [enablePayout, setEnablePayout] = useState(false);
  const [payoutType, setPayoutType] = useState('PERCENTAGE');
  const [percentage, setPercentage] = useState(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        email,
        permissionLevel,
      };

      if (enablePayout) {
        payload.payoutConfig = {
          type: payoutType,
          percentage: payoutType === 'PERCENTAGE' ? Number(percentage) : undefined,
        };
      }

      const res = await api.post(`/properties/${propertyId}/co-hosts/invite`, payload);
      alert(`Invitation created! Share link: ${window.location.origin}/co-hosts/invitations/${res.inviteToken}`);
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-xl">
      <h3 className="text-lg font-bold">Invite Co-Host</h3>
      
      <div>
        <label className="block text-sm font-medium">Co-Host Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded-lg"
          placeholder="cohost@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Permission Preset</label>
        <select
          value={permissionLevel}
          onChange={(e) => setPermissionLevel(e.target.value)}
          className="w-full border p-2 rounded-lg"
        >
          <option value="FULL_ACCESS">Full Access (All Management)</option>
          <option value="OPERATIONS">Operations (Calendar, Bookings, Maintenance)</option>
          <option value="CALENDAR_MESSAGING">Calendar + Messaging</option>
          <option value="CALENDAR_ONLY">Calendar Only</option>
        </select>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={enablePayout}
            onChange={(e) => setEnablePayout(e.target.checked)}
          />
          <span className="text-sm font-semibold">Configure Co-Host Payout (Max 1 Paid Co-Host)</span>
        </label>

        {enablePayout && (
          <div className="mt-3 space-y-2 pl-6">
            <select
              value={payoutType}
              onChange={(e) => setPayoutType(e.target.value)}
              className="w-full border p-2 rounded-lg"
            >
              <option value="PERCENTAGE">Percentage of Booking</option>
              <option value="FIXED_AMOUNT">Fixed Amount per Booking</option>
              <option value="CLEANING_FEE">Cleaning Fee Only</option>
            </select>
            {payoutType === 'PERCENTAGE' && (
              <input
                type="number"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full border p-2 rounded-lg"
                placeholder="Percentage (e.g. 10)"
              />
            )}
          </div>
        )}
      </div>

      <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-lg font-bold">
        Send Co-Host Invitation
      </button>
    </form>
  );
}
```

---

### 4. Step 2: Co-Host Acceptance Page (`/co-hosts/invitations/[token]`)

```tsx
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function InvitationAcceptancePage() {
  const { token } = useParams();
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInvite() {
      try {
        const data = await api.get(`/co-hosts/invitations/${token}`);
        setInvitation(data);
      } catch (err: any) {
        setError(err.message || 'Invitation is invalid or expired.');
      } finally {
        setLoading(false);
      }
    }
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    try {
      await api.post(`/co-hosts/invitations/${token}/accept`);
      alert('Invitation accepted successfully!');
      router.push('/co-host');
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
    }
  };

  const handleDecline = async () => {
    try {
      await api.post(`/co-hosts/invitations/${token}/decline`);
      alert('Invitation declined');
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading invitation...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;

  return (
    <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border text-center">
      <h2 className="text-2xl font-bold mb-2">Co-Host Invitation</h2>
      <p className="text-gray-600 mb-6">
        <strong>{invitation.invitedBy.name}</strong> invited you to co-host <strong>{invitation.property.title}</strong> in {invitation.property.city}.
      </p>

      <div className="bg-amber-50 p-4 rounded-xl text-left mb-6 text-sm">
        <p className="font-semibold mb-1">Permission Level: {invitation.permissionLevel}</p>
        <p className="text-gray-600">Permissions granted: {invitation.requestedPermissions.length} modules</p>
      </div>

      <div className="flex gap-4">
        <button onClick={handleDecline} className="flex-1 border border-gray-300 py-2.5 rounded-xl font-semibold">
          Decline
        </button>
        <button onClick={handleAccept} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-semibold">
          Accept Invitation
        </button>
      </div>
    </div>
  );
}
```

---

### 5. Step 3: Co-Host Dynamic Navigation Layout (`/co-host/properties/[propertyId]/layout.tsx`)

Filters navigation tabs dynamically based on the permissions granted by the server:

```tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function CoHostPropertyLayout({ children }: { children: React.ReactNode }) {
  const { propertyId } = useParams();
  const pathname = usePathname();
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get(`/co-host/properties/${propertyId}/dashboard`);
        setDashboardData(res);
      } catch (err: any) {
        console.error('Co-host access denied:', err.message);
      }
    }
    loadData();
  }, [propertyId]);

  if (!dashboardData) return <div className="p-8">Loading co-host workspace...</div>;

  const permissions = new Set(dashboardData.grantedPermissions || []);

  const navItems = [
    { label: 'Overview', path: `/co-host/properties/${propertyId}`, allow: true },
    { label: 'Calendar', path: `/co-host/properties/${propertyId}/calendar`, allow: permissions.has('VIEW_CALENDAR') },
    { label: 'Bookings', path: `/co-host/properties/${propertyId}/bookings`, allow: permissions.has('VIEW_BOOKINGS') },
    { label: 'Messages', path: `/co-host/properties/${propertyId}/messages`, allow: permissions.has('MESSAGE_GUESTS') },
    { label: 'Maintenance', path: `/co-host/properties/${propertyId}/maintenance`, allow: permissions.has('MANAGE_MAINTENANCE') },
    { label: 'Reviews', path: `/co-host/properties/${propertyId}/reviews`, allow: permissions.has('VIEW_REVIEWS') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Property Header */}
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-amber-600 font-bold uppercase">CO-HOST WORKSPACE</span>
          <h1 className="text-xl font-bold">{dashboardData.property.title}</h1>
        </div>
        <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">
          {dashboardData.permissionLevel}
        </span>
      </header>

      {/* Permission-Filtered Tab Bar */}
      <nav className="bg-white border-b px-8 flex gap-6 text-sm font-medium">
        {navItems.filter(item => item.allow).map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={`py-3 border-b-2 ${pathname === item.path ? 'border-amber-600 text-amber-600 font-bold' : 'border-transparent text-gray-500'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="p-8">{children}</main>
    </div>
  );
}
```

---

### 6. Security Checklist for Frontend Developers

1. **Frontend Restrictions are UX Only**: Always handle `403 Forbidden` API responses gracefully by displaying a permission warning banner.
2. **Never Calculate Authoritative Payout Amounts on Frontend**: Payout calculations and transaction recording are executed server-side.
3. **Handle Suspended States**: If a co-host is suspended, redirect them to the Co-Host portal home (`/co-host`) with a status notice.
