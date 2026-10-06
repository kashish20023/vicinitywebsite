# Studio I + FairBnB Integration — Current State Analysis

**Date:** 2026-09-22  
**Phase:** Chunk 0 (Source Identification & Baseline Capture)  

---

## 1. Source Feature Comparison Overview

| Feature / Domain | FairBnB Source | Studio I Source | Target Integration Plan |
| :--- | :--- | :--- | :--- |
| **Branding & Theme** | Green/White FairBnB hospitality theme | Studio I Magenta `#FF007A`, Dark Mode `#0A0A0A`, Plus Jakarta Sans | **Preserve Studio I** theme, layout, fonts, and brand assets across all screens |
| **Homepage & Hero** | Hotel/Stay search & property listings | Luxury coworking hero with phone mockup animation, search & FAQ | **Preserve Studio I** homepage, navbar, footer, and animations |
| **Inventory Model** | Properties -> Rooms/Beds (Nightly) | Workspaces -> Buildings -> Floors -> Zones -> Units (Desks/Cabins/Rooms) | **Use Studio I Coworking Model**; adapt FairBnB property editor to Workspaces & Floors |
| **Floor Plan 2D** | None (Card & list based only) | Full 2D SVG Viewer (`FloorPlan2DViewer`) + 2D Editor (`FloorPlan2DEditor`) | **Preserve Studio I 2D Engine**; integrate with Host/Admin editor and User viewer |
| **Public Discovery** | Public property feed | Jaipur flagship campuses only (`Lehariya`, `Horizon`). Alwar removed. | **Preserve Jaipur only** public discovery (Alwar removal maintained) |
| **Roles** | USER, HOST, ADMIN + Co-host delegation | USER, ADMIN (2-role previously) | **Expand to 4 Roles:** USER, HOST, COHOST, ADMIN with backend guards & role switching |
| **Host Experience** | Complete host portal (today, listings, calendar, earnings, messages) | None (Admin-only management) | **Import FairBnB Host Portal**, restyle with Studio I theme & adapt to Coworking |
| **Co-host Experience**| Scoped permissions (`CohostPermission`), invitations, delegated views | None | **Import FairBnB Co-host Engine**, scoped to Workspaces/Floors with Studio I styling |
| **Pricing & Plans** | Nightly rates, seasonal pricing, cleaning fee | Hourly, Daily, Monthly booking plans with min commitment rules | **Use Studio I Coworking Plans & Authoritative Quotes**; adapt FairBnB coupon logic |
| **Availability & Holds** | Date ranges, buffer days | Real-time interval `[start, end)` with 10-minute atomic holds | **Combine:** Atomic advisory locking on `InventoryHold` + FairBnB lifecycle |
| **Payments & Finance** | Simulated gateway, host payouts, settlement ledger | Mock payment order verification, BigInt paise tracking | **Combine:** Full financial snapshot ledger + host earnings calculation in paise |
| **Digital Pass & QR** | Generic booking confirmation | Digital access pass with QR token & reception check-in session | **Preserve Studio I Digital Pass**; link to confirmed bookings |
| **Support & Messaging**| Chat, Maintenance tickets, Dispute management | Simple issue reports | **Import FairBnB Chat, Maintenance & Dispute workflows**, restyled to Studio I |
| **Banners & Reviews** | Banner rules, verified guest reviews, wishlist | Public reviews & rating stars | **Import FairBnB Banners & Wishlist**, unified with Coworking reviews |

---

## 2. Identified Adaptations & Coworking Translations

1. **Hospitality to Coworking Translation:**
   - Property &rarr; **Coworking Workspace / Campus**
   - Room / Bed &rarr; **Physical Unit (Hot Desk, Dedicated Desk, Private Cabin, Boardroom)**
   - Check-in Date / Check-out Date &rarr; **Start Date/Time / End Date/Time (Hourly/Daily/Monthly)**
   - Nightly Rate &rarr; **Plan Rate (Hourly, Daily, Monthly)**
   - Host Payout &rarr; **Campus Operator / Franchise Partner Revenue Share Settlement**
2. **Role Authorization Hierarchy:**
   - **USER:** Explores campuses, selects seats on 2D floor plans, holds units, books, receives digital passes, chats with support, logs maintenance requests.
   - **HOST:** Onboards new workspaces, configures buildings/floors, edits 2D floor plans, views assigned bookings, tracks earnings/settlements, invites co-hosts.
   - **CO-HOST:** Accepts invitations, manages assigned workspaces/floors according to granted permissions (`canManageListing`, `canViewFinances`, `canManageBookings`, etc.).
   - **ADMIN:** Global oversight, user/host moderation, workspace publication, financial reconciliation, coupon/banner management, audit logs.
