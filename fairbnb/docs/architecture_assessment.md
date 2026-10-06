# Architecture Assessment & Modularization Plan

Based on the instructions, I have completed a full analysis of the `frontend` and `backend` directories. 

## A. Current Architecture

After running a recursive tree inspection of both the Next.js `frontend` and NestJS `backend` directories, the current state of the "existing" repository is actually **a completely fresh boilerplate initialization**.

**Frontend (Next.js):**
* Consists only of the default `src/app/page.tsx`, `layout.tsx`, and `globals.css`.
* No custom routing, features, hooks, components, or API integrations have been implemented yet.
* State management and authentication are entirely absent.

**Backend (NestJS):**
* Contains only the default `src/app.module.ts`, `app.controller.ts`, and `app.service.ts`.
* No domain modules, entities, database connections, or controllers exist.

**Conclusion:** The platform is currently a greenfield project. 

## B. Problems

Since the codebase is currently empty, we do not have any legacy technical debt to worry about! Specifically:
* **Tight coupling & Duplication:** None.
* **Business logic inside UI:** None.
* **Security risks:** None yet, but authorization needs to be strictly built from day one.
* **Problem to solve:** The primary risk is *how* we begin building. We must immediately adopt the strict domain-boundary architecture proposed to prevent future coupling.

---

## C. Proposed Architecture

As requested, we will avoid Micro-Frontends for our 3–4 developer team and instead build strong modular boundaries within single Next.js and NestJS applications.

### Frontend Architecture (Next.js)

```text
src/
├── app/
│   ├── (public)/          # Guest unauthenticated views (Search, Listing details)
│   ├── (guest)/           # Guest dashboard, bookings, wishlist
│   ├── (host)/            # Host dashboard, listing management, payout setup
│   ├── (broker)/          # Broker dashboard, managed listings, cross-listing
│   └── (admin)/           # Unified moderation queue, KYC review, analytics
│
├── features/              # BUSINESS CAPABILITIES (The core logic)
│   ├── auth/              
│   ├── listings/          
│   ├── bookings/          
│   ├── payments/          
│   ├── messaging/         
│   ├── verification/      
│   ├── broker/            
│   └── admin/             
│
├── components/            # PURE SHARED UI (Dumb components)
│   ├── ui/                # Buttons, Inputs, Modals, Cards
│   ├── layout/            # Navbars, Sidebars
│   └── shared/            
│
├── lib/                   # Infrastructure
│   ├── api/               # Axios/Fetch clients
│   └── auth/              # JWT / Session management
```

### Backend Architecture (NestJS)

```text
src/
├── auth/                  # JWT Strategy, Role Guards
├── users/                 # Base User Entity & Profile Management
│
├── listings/              # Listings, Categories, Availabilities
├── search/                # Complex queries, Filtering
├── bookings/              # Booking State Machine, Approvals
├── payments/              # Stripe Connect integration
├── messaging/             # WebSockets & AI Content Moderation
├── reviews/               
│
├── verification/          # KYC & Identity
├── broker/                # Host-Broker relationships, Commissions
├── moderation/            # Admin queues (KYC, Listings, Cross-lists)
└── analytics/             # Revenue, GMV, Fees
```

---

## D. Implementation Strategy

Based on the analysis, here is how we should proceed with the implementation.

### 1. What should remain as-is
* The base Next.js App Router configuration and NestJS TypeScript compiler setup. 
* The `package.json` configurations.

### 2. What should be refactored
* Remove the boilerplate `page.tsx` code (the default Vercel/Next.js landing page).
* Remove the default `app.controller.ts` and `app.service.ts` from NestJS.

### 3. What should be moved
* N/A (since the codebase is empty).

### 4. What should be newly created
* **Frontend:** Create the base folders for `(guest)`, `(host)`, `(broker)`, `(admin)` under `app/`, as well as the `features/` and `components/ui/` directories.
* **Backend:** Setup the PostgreSQL database connection and scaffold the first foundational modules: `Auth`, `Users`, and `Listings`.

### 5. What should NOT be implemented yet
* **Micro-Frontends:** (e.g., Module Federation) are strictly avoided.
* **Microservices:** The backend will remain a modular monolith.
* **Complex CI/CD pipelines:** Until the local architecture proves stable.

### 6. Recommended Migration (Development) Order

Since we are starting from scratch, the "migration" is our build order:

* **Phase 1: Foundation** 
  * Backend: Auth + Users + PostgreSQL connection.
  * Frontend: Shared UI setup + API client + Login pages.
* **Phase 2: Core Domain**
  * Backend: Listings + Search + Bookings.
  * Frontend: Guest search UI + Host listing creation UI.
* **Phase 3: The Broker Engine**
  * Backend: Broker module + Host permissions + Cross-listing logic.
  * Frontend: Broker Dashboard UI.
* **Phase 4: Admin & Platform**
  * Backend: Moderation queue + Verification APIs.
  * Frontend: Admin unified dashboard.
* **Phase 5: Refinement**
  * Payments (Stripe), Messaging (WebSockets), and Notifications.
