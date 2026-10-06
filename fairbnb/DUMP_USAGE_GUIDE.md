# 🚀 Fairbnb - Friend Quickstart & Dummy Data Guide

Aapke friend ke liye Fairbnb project setup aur sample dummy data load karne ki step-by-step guide.

---

## 📁 Ready-to-Use Dummy Files Included

Project folder me ye 3 ready-to-use files create kar di gayi hain:

1. **`fairbnb_dump.sql`** - Ready-to-import PostgreSQL Database Dump File.
2. **`fairbnb_dummy_data.json`** - Standalone JSON Mock Dataset (Users, Hosts & Properties).
3. **`backend/prisma/seed.ts`** - Automatic Prisma Seed Script.

---

## ⚙️ How Your Friend Can Use This (3 Easy Ways)

### Option 1: Automatic Prisma Seed (⭐ Recommended)

Aapka friend project clone karke backend me directly ye command run kar sakta hai:

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
```

*Ye command auto-create karke saare sample Users, Hosts, aur Properties database me load kar dega!*

---

### Option 2: Direct PostgreSQL Dump Import (`fairbnb_dump.sql`)

Agar unhe psql CLI ya PgAdmin/DBeaver se database dump direct load karna hai:

```bash
# Terminal Command:
psql -U postgres_user -d fairbnb_db -f fairbnb_dump.sql
```

Ya phir `.env` file ka `DATABASE_URL` use karke:

```bash
psql $DATABASE_URL -f fairbnb_dump.sql
```

---

### Option 3: JSON Mock Data (`fairbnb_dummy_data.json`)

Agar unhe frontend mock testing ya custom backend API me sample JSON load karna hai, toh wo directly `fairbnb_dummy_data.json` file import kar sakte hain.

---

## 🔑 Ready-to-Use Test Accounts

Sabhi sample accounts ka default password: **`Password123!`**

| User Role | Name | Email | Phone Number |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Fairbnb System Admin | `admin@fairbnb.com` | `+919876543210` |
| **HOST** | Rahul Sharma | `rahul.sharma@fairbnb.com` | `+919811122233` |
| **HOST** | Ananya Roy | `ananya.roy@fairbnb.com` | `+919822233344` |
| **USER** | Priya Singh | `priya.singh@example.com` | `+919844455566` |
| **USER** | Amit Patel | `amit.patel@example.com` | `+919855566677` |

---

## 🏡 Included Sample Listings (Properties)

- **Villa Ocean Breeze - Calangute Beachfront** *(Goa)* - 4BHK Villa with Pool (₹14,500/night)
- **Himalayan Cloud Retreat & Spa** *(Manali)* - 3BHK Mountain Chalet (₹8,900/night)
- **The Royal Heritage Haveli** *(Jaipur)* - 5BHK Historic Haveli (₹18,000/night)
- **Penthouse Sky Lounge** *(Mumbai)* - 2BHK Oceanfront Penthouse (₹25,000/night)
- **Serene Lakeview Chalet** *(Udaipur)* - 3BHK Lake Pichola Cottage (₹12,500/night)

---
