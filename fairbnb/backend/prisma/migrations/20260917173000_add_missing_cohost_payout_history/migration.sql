-- CreateEnum
CREATE TYPE "CoHostStatus" AS ENUM ('INVITED', 'ACCEPTED', 'VERIFICATION_PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "CoHostInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutRuleStatus" AS ENUM ('PENDING_CONFIRMATION', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "CoHostPermissionEnum" AS ENUM ('VIEW_PROPERTY', 'EDIT_LISTING', 'VIEW_CALENDAR', 'MANAGE_CALENDAR', 'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'CANCEL_BOOKINGS', 'VIEW_GUESTS', 'MESSAGE_GUESTS', 'VIEW_PRICING', 'MANAGE_PRICING', 'MANAGE_MAINTENANCE', 'MANAGE_CLEANING', 'VIEW_REVIEWS', 'RESPOND_TO_REVIEWS', 'MANAGE_COUPONS', 'VIEW_COHOSTS', 'MANAGE_COHOSTS', 'VIEW_EARNINGS', 'VIEW_PAYOUTS', 'MANAGE_PAYOUT_SETTINGS');

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "couponId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "triggerType" TEXT NOT NULL DEFAULT 'delay',
    "triggerValue" INTEGER NOT NULL DEFAULT 5,
    "actionType" TEXT NOT NULL DEFAULT 'form',
    "targetPages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "bannerId" TEXT,
    "couponCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoHostRelationship" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "coHostUserId" TEXT NOT NULL,
    "status" "CoHostStatus" NOT NULL DEFAULT 'ACCEPTED',
    "permissionLevel" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoHostRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoHostPermission" (
    "id" TEXT NOT NULL,
    "coHostRelationshipId" TEXT NOT NULL,
    "permission" "CoHostPermissionEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoHostPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoHostInvitation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tokenHash" TEXT NOT NULL,
    "requestedPermissions" "CoHostPermissionEnum"[] DEFAULT ARRAY[]::"CoHostPermissionEnum"[],
    "permissionLevel" TEXT,
    "payoutConfig" JSONB,
    "status" "CoHostInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoHostInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRule" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "coHostRelationshipId" TEXT,
    "type" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION,
    "fixedAmount" DOUBLE PRECISION,
    "status" "PayoutRuleStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "propertyId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "recipientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "propertyOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAmenity" (
    "propertyId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "PropertyAmenity_pkey" PRIMARY KEY ("propertyId","amenityId")
);

-- CreateIndex
CREATE INDEX "CoHostRelationship_propertyId_idx" ON "CoHostRelationship"("propertyId");

-- CreateIndex
CREATE INDEX "CoHostRelationship_coHostUserId_idx" ON "CoHostRelationship"("coHostUserId");

-- CreateIndex
CREATE INDEX "CoHostRelationship_hostUserId_idx" ON "CoHostRelationship"("hostUserId");

-- CreateIndex
CREATE INDEX "CoHostRelationship_status_idx" ON "CoHostRelationship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CoHostRelationship_propertyId_coHostUserId_key" ON "CoHostRelationship"("propertyId", "coHostUserId");

-- CreateIndex
CREATE INDEX "CoHostPermission_coHostRelationshipId_idx" ON "CoHostPermission"("coHostRelationshipId");

-- CreateIndex
CREATE UNIQUE INDEX "CoHostPermission_coHostRelationshipId_permission_key" ON "CoHostPermission"("coHostRelationshipId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "CoHostInvitation_tokenHash_key" ON "CoHostInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "CoHostInvitation_propertyId_idx" ON "CoHostInvitation"("propertyId");

-- CreateIndex
CREATE INDEX "CoHostInvitation_email_idx" ON "CoHostInvitation"("email");

-- CreateIndex
CREATE INDEX "CoHostInvitation_phone_idx" ON "CoHostInvitation"("phone");

-- CreateIndex
CREATE INDEX "CoHostInvitation_tokenHash_idx" ON "CoHostInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "PayoutRule_propertyId_idx" ON "PayoutRule"("propertyId");

-- CreateIndex
CREATE INDEX "PayoutRule_recipientUserId_idx" ON "PayoutRule"("recipientUserId");

-- CreateIndex
CREATE INDEX "PayoutRule_coHostRelationshipId_idx" ON "PayoutRule"("coHostRelationshipId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_bookingId_idx" ON "FinancialTransaction"("bookingId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_propertyId_idx" ON "FinancialTransaction"("propertyId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_recipientId_idx" ON "FinancialTransaction"("recipientId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_type_idx" ON "FinancialTransaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_name_key" ON "Amenity"("name");

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoHostRelationship" ADD CONSTRAINT "CoHostRelationship_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoHostRelationship" ADD CONSTRAINT "CoHostRelationship_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoHostRelationship" ADD CONSTRAINT "CoHostRelationship_coHostUserId_fkey" FOREIGN KEY ("coHostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoHostPermission" ADD CONSTRAINT "CoHostPermission_coHostRelationshipId_fkey" FOREIGN KEY ("coHostRelationshipId") REFERENCES "CoHostRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoHostInvitation" ADD CONSTRAINT "CoHostInvitation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoHostInvitation" ADD CONSTRAINT "CoHostInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRule" ADD CONSTRAINT "PayoutRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRule" ADD CONSTRAINT "PayoutRule_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRule" ADD CONSTRAINT "PayoutRule_coHostRelationshipId_fkey" FOREIGN KEY ("coHostRelationshipId") REFERENCES "CoHostRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

