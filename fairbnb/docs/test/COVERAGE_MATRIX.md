# FairBnB QA Audit Coverage Matrix

**Run ID**: `run-20260921-1150`  
**Backend Endpoints Discovered**: 211  
**Frontend Routes Discovered**: 81  

---

## 1. Backend API Endpoint Coverage

| Module | Method | Endpoint Path | Role Required | Target Scenario | Test Type | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `admin` | **GET** | `/admin/overview` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/users` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/users/hosts` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/users/verification` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PATCH** | `/admin/users/:id/verify` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/users/blocked` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PATCH** | `/admin/users/:id/status` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/properties` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/properties/pending` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/properties/approved` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/properties/rejected` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PATCH** | `/admin/properties/:id/verify` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/guests` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PATCH** | `/admin/guests/:id/block` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/hosts` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **POST** | `/admin/hosts/:id/impersonate` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **POST** | `/admin/properties/:id/transfer` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/stats` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/analytics/overview` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/verifications/pending` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PUT** | `/admin/users/:id/verify` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PUT** | `/admin/property/approve/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PUT** | `/admin/property/reject/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/collections` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **POST** | `/admin/messages/send` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/payouts` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PATCH** | `/admin/payouts/:id/approve` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/co-hosts` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/co-hosts/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **GET** | `/admin/hosts/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin` | **PATCH** | `/admin/co-hosts/:id/status` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin-settings` | **GET** | `/admin-settings` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin-settings` | **GET** | `/admin-settings/:key` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `admin-settings` | **PATCH** | `/admin-settings` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `ai-assistant` | **POST** | `/ai-assistant/query` | `PUBLIC` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `amenities` | **GET** | `/amenities` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `amenities` | **POST** | `/amenities` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `amenities` | **PATCH** | `/amenities/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `amenities` | **DELETE** | `/amenities/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `amenities` | **POST** | `/amenities/property/:propertyId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `amenities` | **GET** | `/amenities/property/:propertyId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `app.controller.ts` | **GET** | `/` | `PUBLIC` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `app.controller.ts` | **GET** | `/health` | `PUBLIC` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `audit-logs` | **GET** | `/admin/audit-logs` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **POST** | `/auth/register` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **POST** | `/auth/login` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **GET** | `/auth/me` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **POST** | `/auth/send-otp` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **POST** | `/auth/verify-otp` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **POST** | `/auth/change-password` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **POST** | `/auth/forgot-password` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `auth` | **POST** | `/auth/reset-password` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `automated-messages` | **POST** | `/automated-messages` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `automated-messages` | **GET** | `/automated-messages` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `automated-messages` | **PATCH** | `/automated-messages/:id/toggle` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `automated-messages` | **DELETE** | `/automated-messages/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **GET** | `/banners/active` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **POST** | `/banners/:id/impression` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **POST** | `/banners/:id/submit-lead` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **POST** | `/banners` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **GET** | `/banners` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **GET** | `/banners/leads` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **PATCH** | `/banners/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `banners` | **DELETE** | `/banners/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/admin/bookings` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/admin/bookings/summary` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/admin/bookings/cancelled` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/admin/bookings/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **PATCH** | `/admin/bookings/:id/status` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **PATCH** | `/admin/bookings/:id/cancel` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/admin/refunds` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/admin/refunds/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/admin/bookings/:bookingId/refund` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **PATCH** | `/admin/refunds/:id/process` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **PATCH** | `/admin/refunds/:id/fail` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/properties/:propertyId/availability` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/bookings/quote` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/bookings` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/bookings/my-bookings` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/bookings/my-trips` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/bookings/checkout-preview` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **GET** | `/bookings/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/bookings/:id/cancel` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/bookings/cleanup-expired` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/bookings/:id/host-cancel` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **PATCH** | `/bookings/:id/no-show` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **POST** | `/bookings/:id/reschedule-request` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `bookings` | **PATCH** | `/bookings/:id/reschedule-respond` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `calendar` | **GET** | `/calendar/property/:propertyId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `calendar` | **POST** | `/calendar/block-dates` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `calendar` | **POST** | `/calendar/pricing-rules` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `chat` | **POST** | `/chat/send` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `chat` | **GET** | `/chat/threads` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `chat` | **GET** | `/chat/user/:otherUserId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `chat` | **PATCH** | `/chat/messages/:id/read` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **POST** | `/properties/:propertyId/co-hosts/invite` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/properties/:propertyId/co-hosts` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/properties/:propertyId/co-hosts/:coHostId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **PATCH** | `/co-hosts/:coHostId/permissions` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **PATCH** | `/co-hosts/:coHostId/payout` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **POST** | `/co-hosts/:coHostId/suspend` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **POST** | `/co-hosts/:coHostId/reactivate` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **DELETE** | `/co-hosts/:coHostId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-hosts/invitations/:token` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **POST** | `/co-hosts/invitations/:token/accept` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **POST** | `/co-hosts/invitations/:token/decline` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **DELETE** | `/co-hosts/invitations/:invitationId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-hosts/me/invitations` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-host/me/properties` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **POST** | `/co-hosts/payout-rules/:ruleId/confirm` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-host/properties/:propertyId/dashboard` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-host/properties/:propertyId/calendar` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-host/properties/:propertyId/bookings` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-host/properties/:propertyId/messages` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-host/properties/:propertyId/maintenance` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `co-host` | **GET** | `/co-host/properties/:propertyId/reviews` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `coupons` | **POST** | `/coupons` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `coupons` | **POST** | `/coupons/validate` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `coupons` | **GET** | `/coupons` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `disputes` | **POST** | `/disputes` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `disputes` | **GET** | `/disputes` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `disputes` | **PATCH** | `/disputes/:id/resolve` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `hosts` | **GET** | `/hosts/profile/:hostId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `hosts` | **GET** | `/hosts/dashboard/stats` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `ical` | **GET** | `/ical/properties/:id/calendar.ics` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `ical` | **POST** | `/ical/feeds` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `ical` | **GET** | `/ical/properties/:id/feeds` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `ical` | **POST** | `/ical/feeds/:id/sync` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `maintenance` | **POST** | `/maintenance` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `maintenance` | **GET** | `/maintenance` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `maintenance` | **PATCH** | `/maintenance/:id/status` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `media` | **POST** | `/media/upload` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `media` | **POST** | `/media/upload-multiple` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `notifications` | **GET** | `/notifications` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `notifications` | **PATCH** | `/notifications/:id/read` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `notifications` | **PATCH** | `/notifications/read-all` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payments` | **POST** | `/payments/create-order` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payments` | **POST** | `/payments/webhook` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payments` | **GET** | `/payments/booking/:bookingId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **GET** | `/admin/settlements` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **GET** | `/admin/settlements/:bookingId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **POST** | `/admin/settlements/:bookingId/refresh` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **POST** | `/admin/settlements/:bookingId/authorize` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **POST** | `/admin/settlements/:bookingId/execute` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **GET** | `/admin/settlements/:bookingId/adjustments` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **POST** | `/admin/settlements/:bookingId/reconcile` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **POST** | `/admin/settlements/:bookingId/refund` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **POST** | `/admin/settlements/webhook` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **GET** | `/admin/settlements/entitlements` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `payouts` | **GET** | `/admin/settlements/bookings/:bookingId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `profile` | **GET** | `/profile/me` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `profile` | **PATCH** | `/profile/me` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `profile` | **POST** | `/profile/kyc` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **GET** | `/properties` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **GET** | `/properties/my-properties` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **GET** | `/properties/admin/all` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **GET** | `/properties/:idOrSlug` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **POST** | `/properties` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **PATCH** | `/properties/:id/approve` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **PATCH** | `/properties/:id/reject` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **PATCH** | `/properties/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `properties` | **DELETE** | `/properties/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/api/reels` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/creator/:creatorId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/:reelId/like` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/:reelId/like` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **DELETE** | `/reels/:reelId/like` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **DELETE** | `/reels/api/reels/:reelId/like` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/:reelId/comments` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/:reelId/comments` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/:reelId/comments` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/api/reels/:reelId/comments` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **DELETE** | `/reels/:reelId/comments/:commentId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **DELETE** | `/reels/api/reels/:reelId/comments/:commentId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/:reelId/report` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/:reelId/report` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/:reelId/comments/:commentId/report` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/:reelId/comments/:commentId/report` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/admin/reports` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/api/reels/admin/reports` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **PATCH** | `/reels/admin/reports/:reportId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **PATCH** | `/reels/api/reels/admin/reports/:reportId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **PATCH** | `/reels/admin/:reelId/status` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **PATCH** | `/reels/api/reels/admin/:reelId/status` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/:reelId/share` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/:reelId/share` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/:reelId/events` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/:reelId/events` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/:reelId/analytics` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **GET** | `/reels/api/reels/:reelId/analytics` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/upload-signature` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/upload-signature` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/webhook` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reels` | **POST** | `/reels/api/reels/webhook` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reviews` | **POST** | `/reviews` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reviews` | **GET** | `/properties/:propertyId/reviews` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `reviews` | **POST** | `/reviews/:id/reply` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `tags` | **GET** | `/tags` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `tags` | **POST** | `/tags` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `tags` | **PATCH** | `/tags/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `tags` | **DELETE** | `/tags/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `users` | **GET** | `/users` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `users` | **GET** | `/users/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `users` | **PATCH** | `/users/:id/role` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `users` | **PATCH** | `/users/:id/status` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `wishlists` | **POST** | `/wishlists` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `wishlists` | **GET** | `/wishlists` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `wishlists` | **POST** | `/wishlists/:id/properties/:propertyId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `wishlists` | **DELETE** | `/wishlists/:id/properties/:propertyId` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |
| `wishlists` | **DELETE** | `/wishlists/:id` | `PUBLIC/AUTH_DEFAULT` | Valid request / RBAC / Error handling | API Integration | PLANNED | API_REPORT.md |

---

## 2. Frontend Page Route Coverage

| Route Path | Primary Persona | User Journey / Scenario | Test Type | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/about` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/account/wallet` | **Guest** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/analytics` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/audit-logs` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/bookings` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/co-hosts` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/co-hosts/[id]` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/coupons` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/dashboard` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/finance` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/hosts` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/hosts/[id]` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/listings` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/marketing/banners` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/moderation` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/properties/[id]` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/properties/[id]/edit` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/settings` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/settings/amenities-tags` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/settlements` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/support` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/users` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/admin/verification` | **Admin** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/book/[id]` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/broker/commissions` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/broker/cross-listings` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/broker/dashboard` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/broker/leads` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/broker/listings` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/cancellation-policy` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/bookings` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/calendar` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/earnings` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/hosts` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/maintenance` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/messages` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/properties` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/properties/[propertyId]` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/properties/[propertyId]/bookings` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/properties/[propertyId]/calendar` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/properties/[propertyId]/maintenance` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/properties/[propertyId]/messages` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/properties/[propertyId]/reviews` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-host/settings` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/co-hosts/invitations/[token]` | **Co-Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/contact` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/events` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/forgot-password` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/guest/dashboard` | **Guest** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/guest/trips` | **Guest** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/bookings` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/calendar` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/co-hosts/own` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/earnings` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/insights` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/invites` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/listings` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/listings/new` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/messages` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/properties/[propertyId]` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/properties/[propertyId]/co-hosts` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/properties/[propertyId]/edit` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/settings` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/support` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/host/today` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/hosts/[id]` | **Host** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/login` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/privacy` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/properties/[id]` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/reels` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/register` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/reset-password` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/search` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/terms` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/terms-and-conditions` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/users/[id]` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/verify-otp` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
| `/vicinity-events` | **Public** | Navigation, render, interactive elements | Browser / Perf | PLANNED | PLAYWRIGHT_REPORT.md |
