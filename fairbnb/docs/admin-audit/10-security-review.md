# DELIVERABLE 10 — SECURITY AUDIT

**Project:** Fairbnb Multi-Sided Marketplace  
**Subsystem:** Admin Security, Authentication, Authorization & Vulnerability Review  
**Audit Date:** September 2026  
**Auditor:** Senior Engineering Team (Pre-Implementation Phase)  

---

## 1. Security Architecture Assessment

### 1.1 Enforcement Level Summary
| Security Layer | Enforcement Status | Assessment |
| :--- | :---: | :--- |
| **API Authentication** | **Frontend + Backend ✅** | All admin controller routes require `JwtAuthGuard` |
| **API Role Authorization**| **Frontend + Backend ✅** | All admin controller routes require `@Roles(UserRole.ADMIN)` |
| **Route Boundary (SSR/Edge)**| **Frontend Only ❌** | No `middleware.ts` at Next.js Edge; admin layout renders on client before 401 |
| **Input Validation** | **Backend Only ⚠️** | Handled by NestJS `ValidationPipe` with `class-validator` DTOs |
| **Token Storage** | **Frontend (Vulnerable) ⚠️** | JWT stored in `localStorage` (`fairbnb_token`) — vulnerable to XSS |
| **Rate Limiting** | **Missing ❌** | Admin endpoints currently lack rate limiting guards (`ThrottlerGuard`) |
| **Audit Logging** | **Partial ⚠️** | Core operations logged; system settings & host impersonation unlogged |

---

## 2. Detailed Vulnerability & Risk Analysis

### 2.1 Critical Risk: Absence of Edge Route Guard (Next.js Middleware)
- **Status:** **Frontend Only ❌**
- **Mechanism:** When a regular user (`USER` or `HOST`) directly visits `https://fairbnb.com/admin/dashboard`, the Next.js App Router renders the Admin Layout and shell HTML before client-side `useEffect` queries `/admin/overview` and receives a 401/403.
- **Remediation:** Implement `src/middleware.ts` to inspect the session token/cookie and redirect non-admin users to `/login?redirect=/admin` prior to rendering layout HTML.

### 2.2 Token Storage in LocalStorage vs HttpOnly Cookies
- **Status:** **Frontend Only ⚠️**
- **Mechanism:** In `src/lib/api-client.ts`, authentication tokens are read directly from `localStorage.getItem('fairbnb_token')`.
- **Risk:** Any client-side XSS vulnerability can extract the administrator's JWT, granting full administrative access to attackers.
- **Remediation:** Migrate authentication token to an `httpOnly`, `secure`, `SameSite=Lax` cookie.

### 2.3 Unrestricted Host Impersonation
- **Status:** **Backend Only ⚠️**
- **Mechanism:** Calling `POST /admin/hosts/:id/impersonate` produces host dashboard preview context without recording the event in `AuditLog`.
- **Remediation:** 
  1. Add mandatory audit logging on impersonation.
  2. Implement a 2-step confirmation dialog with explicit justification prompt in the frontend.

### 2.4 Sensitive Data Exposure in User & Property Endpoints
- **Status:** **Frontend + Backend ✅ (Verified Good)**
- **Audit Findings:** 
  - Password hashes (`passwordHash`), OTP hashes (`phoneOtpHash`), and reset token hashes (`resetTokenHash`) are explicitly excluded or stripped via `sanitizeUser(...)` in `admin.service.ts`:
    ```typescript
    private sanitizeUser(user: any) {
      const { passwordHash, phoneOtpHash, resetTokenHash, ...safeUser } = user;
      return safeUser;
    }
    ```
  - Admin endpoints do **not** leak password hashes.

### 2.5 Input Validation & SQL Injection Protection
- **Status:** **Backend Only ⚠️ (Standard Best Practice)**
- **Mechanism:** Prisma ORM parameterizes all SQL queries by default, protecting against standard SQL injection.
- **DTOs:** DTOs (`AdminVerifyPropertyDto`, `AdminUpdateUserStatusDto`, `AdminTransferPropertyDto`) enforce strict string types and enum validation via `class-validator`.

---

## 3. Security Findings Summary Table

| Asset / Endpoint | Vulnerability | Severity | Enforcement Level | Proposed Fix |
| :--- | :--- | :---: | :---: | :--- |
| `/admin/*` routes | Unauthorized client layout render | High | Frontend Only ❌ | Add Next.js `middleware.ts` edge guard |
| `fairbnb_token` | XSS extraction risk | High | Frontend Only ⚠️ | Transition to `httpOnly` secure cookies |
| `/admin/hosts/:id/impersonate`| Unaudited host impersonation | High | Backend Only ⚠️ | Call `auditLogService.logAction` on invocation |
| `/admin-settings` | Unaudited feature toggling | Medium | Backend Only ⚠️ | Call `auditLogService.logAction` on update |
| All `/admin/*` APIs | Potential brute-force / DDoS | Medium | Missing ❌ | Apply NestJS `ThrottlerGuard` |

---

## 4. Policy for Audit Phase

**Rule:** As required by the audit guidelines, **NO security policies, guards, or code have been modified** during this audit phase.
