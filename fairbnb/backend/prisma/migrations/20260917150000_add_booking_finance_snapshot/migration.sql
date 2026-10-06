-- CreateTable
CREATE TABLE "BookingFinanceSnapshot" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captureProvenance" TEXT NOT NULL DEFAULT 'BOOKING_CREATION',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "basePaise" BIGINT,
    "cleaningPaise" BIGINT,
    "serviceFeePaise" BIGINT,
    "taxPaise" BIGINT,
    "discountPaise" BIGINT,
    "guestTotalPaise" BIGINT,
    "hostUserId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "discountFunding" TEXT NOT NULL DEFAULT 'UNRESOLVED',
    "coHostAgreementStatus" TEXT NOT NULL DEFAULT 'UNRESOLVED',
    "coHostRecipientUserId" TEXT,
    "coHostRuleId" TEXT,
    "coHostRuleType" TEXT,
    "coHostPercentageBps" BIGINT,
    "coHostFixedPaise" BIGINT,
    "coHostRuleTerms" JSONB,
    "policyVersion" TEXT NOT NULL DEFAULT 'DRAFT_V1',
    "reviewStatus" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
    "reviewReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingFinanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingFinanceSnapshot_bookingId_key" ON "BookingFinanceSnapshot"("bookingId");

-- CreateIndex
CREATE INDEX "BookingFinanceSnapshot_hostUserId_idx" ON "BookingFinanceSnapshot"("hostUserId");

-- CreateIndex
CREATE INDEX "BookingFinanceSnapshot_propertyId_idx" ON "BookingFinanceSnapshot"("propertyId");

-- CreateIndex
CREATE INDEX "BookingFinanceSnapshot_reviewStatus_idx" ON "BookingFinanceSnapshot"("reviewStatus");

-- AddForeignKey
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "BookingFinanceSnapshot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddRowLocalConstraints
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_version_positive" CHECK ("snapshotVersion" > 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_base_non_negative" CHECK ("basePaise" IS NULL OR "basePaise" >= 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_cleaning_non_negative" CHECK ("cleaningPaise" IS NULL OR "cleaningPaise" >= 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_service_fee_non_negative" CHECK ("serviceFeePaise" IS NULL OR "serviceFeePaise" >= 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_tax_non_negative" CHECK ("taxPaise" IS NULL OR "taxPaise" >= 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_discount_non_negative" CHECK ("discountPaise" IS NULL OR "discountPaise" >= 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_total_non_negative" CHECK ("guestTotalPaise" IS NULL OR "guestTotalPaise" >= 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_cohost_bps_bounds" CHECK ("coHostPercentageBps" IS NULL OR ("coHostPercentageBps" >= 0 AND "coHostPercentageBps" <= 10000));
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_cohost_fixed_non_negative" CHECK ("coHostFixedPaise" IS NULL OR "coHostFixedPaise" >= 0);
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_discount_funding_enum" CHECK ("discountFunding" IN ('NONE', 'PLATFORM', 'HOST', 'UNRESOLVED'));
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_cohost_status_enum" CHECK ("coHostAgreementStatus" IN ('NONE', 'AGREED', 'UNRESOLVED'));
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_review_status_enum" CHECK ("reviewStatus" IN ('VALID', 'NEEDS_REVIEW'));
ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_cohost_rule_type_enum" CHECK ("coHostRuleType" IS NULL OR "coHostRuleType" IN ('PERCENTAGE', 'FIXED', 'CLEANING_FEE_PLUS_PERCENTAGE'));
