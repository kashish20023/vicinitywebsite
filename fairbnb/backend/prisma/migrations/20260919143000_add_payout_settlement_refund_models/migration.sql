-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "amountPaise" BIGINT,
ADD COLUMN     "operationReference" TEXT,
ADD COLUMN     "reservationStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'VALID';

-- CreateTable
CREATE TABLE "RefundComponent" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "accommodationPaise" BIGINT NOT NULL DEFAULT 0,
    "cleaningPaise" BIGINT NOT NULL DEFAULT 0,
    "platformPaise" BIGINT NOT NULL DEFAULT 0,
    "taxPaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaise" BIGINT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "reviewStatus" TEXT NOT NULL DEFAULT 'VALID',
    "reviewReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "holdReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currentRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementRevision" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "totalGrossPaise" BIGINT NOT NULL,
    "totalRefundedPaise" BIGINT NOT NULL DEFAULT 0,
    "totalNetPaise" BIGINT NOT NULL,
    "hostNetPaise" BIGINT NOT NULL,
    "coHostNetPaise" BIGINT NOT NULL DEFAULT 0,
    "platformNetPaise" BIGINT NOT NULL,
    "taxNetPaise" BIGINT NOT NULL,
    "isExecuted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementAllocation" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "allocationKey" TEXT NOT NULL,
    "grossPaise" BIGINT NOT NULL,
    "refundDeductionPaise" BIGINT NOT NULL DEFAULT 0,
    "netEntitledPaise" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "holdReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutTransferIntent" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "allocationKey" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "amountPaise" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "operationReference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "beneficiaryDetails" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'MOCK_PROVIDER',
    "providerTransferId" TEXT,
    "providerResponse" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutTransferIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutTransferAttempt" (
    "id" TEXT NOT NULL,
    "transferIntentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" TEXT NOT NULL,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutTransferAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutAdjustment" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "sourceEvent" TEXT NOT NULL,
    "sourceReferenceId" TEXT,
    "originalRevisionId" TEXT,
    "affectedRecipientUserId" TEXT,
    "affectedRecipientRole" TEXT NOT NULL,
    "alreadyPaidPaise" BIGINT NOT NULL,
    "revisedEntitlementPaise" BIGINT NOT NULL,
    "recoveryObligationPaise" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "actorUserId" TEXT,
    "evidenceNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAuditEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "settlementId" TEXT,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundComponent_refundId_idx" ON "RefundComponent"("refundId");

-- CreateIndex
CREATE INDEX "RefundComponent_reviewStatus_idx" ON "RefundComponent"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_bookingId_key" ON "Settlement"("bookingId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "Settlement_bookingId_idx" ON "Settlement"("bookingId");

-- CreateIndex
CREATE INDEX "SettlementRevision_settlementId_idx" ON "SettlementRevision"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementRevision_settlementId_revisionNumber_key" ON "SettlementRevision"("settlementId", "revisionNumber");

-- CreateIndex
CREATE INDEX "SettlementAllocation_revisionId_idx" ON "SettlementAllocation"("revisionId");

-- CreateIndex
CREATE INDEX "SettlementAllocation_recipientUserId_idx" ON "SettlementAllocation"("recipientUserId");

-- CreateIndex
CREATE INDEX "SettlementAllocation_status_idx" ON "SettlementAllocation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementAllocation_revisionId_allocationKey_key" ON "SettlementAllocation"("revisionId", "allocationKey");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutTransferIntent_operationReference_key" ON "PayoutTransferIntent"("operationReference");

-- CreateIndex
CREATE INDEX "PayoutTransferIntent_settlementId_idx" ON "PayoutTransferIntent"("settlementId");

-- CreateIndex
CREATE INDEX "PayoutTransferIntent_recipientUserId_idx" ON "PayoutTransferIntent"("recipientUserId");

-- CreateIndex
CREATE INDEX "PayoutTransferIntent_status_idx" ON "PayoutTransferIntent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutTransferAttempt_idempotencyKey_key" ON "PayoutTransferAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PayoutTransferAttempt_transferIntentId_idx" ON "PayoutTransferAttempt"("transferIntentId");

-- CreateIndex
CREATE INDEX "PayoutTransferAttempt_status_idx" ON "PayoutTransferAttempt"("status");

-- CreateIndex
CREATE INDEX "PayoutAdjustment_settlementId_idx" ON "PayoutAdjustment"("settlementId");

-- CreateIndex
CREATE INDEX "PayoutAdjustment_affectedRecipientUserId_idx" ON "PayoutAdjustment"("affectedRecipientUserId");

-- CreateIndex
CREATE INDEX "PayoutAdjustment_status_idx" ON "PayoutAdjustment"("status");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_bookingId_idx" ON "FinancialAuditEvent"("bookingId");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_settlementId_idx" ON "FinancialAuditEvent"("settlementId");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_eventType_idx" ON "FinancialAuditEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_operationReference_key" ON "Refund"("operationReference");

-- CreateIndex
CREATE INDEX "Refund_operationReference_idx" ON "Refund"("operationReference");

-- AddForeignKey
ALTER TABLE "RefundComponent" ADD CONSTRAINT "RefundComponent_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRevision" ADD CONSTRAINT "SettlementRevision_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementAllocation" ADD CONSTRAINT "SettlementAllocation_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SettlementRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementAllocation" ADD CONSTRAINT "SettlementAllocation_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutTransferIntent" ADD CONSTRAINT "PayoutTransferIntent_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutTransferIntent" ADD CONSTRAINT "PayoutTransferIntent_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutTransferAttempt" ADD CONSTRAINT "PayoutTransferAttempt_transferIntentId_fkey" FOREIGN KEY ("transferIntentId") REFERENCES "PayoutTransferIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutAdjustment" ADD CONSTRAINT "PayoutAdjustment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAuditEvent" ADD CONSTRAINT "FinancialAuditEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAuditEvent" ADD CONSTRAINT "FinancialAuditEvent_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
