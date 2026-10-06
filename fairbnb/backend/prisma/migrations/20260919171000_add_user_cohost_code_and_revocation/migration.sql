-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coHostCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_coHostCode_key" ON "User"("coHostCode");

-- AlterTable
ALTER TABLE "CoHostRelationship" ADD COLUMN IF NOT EXISTS "revokedById" TEXT;
ALTER TABLE "CoHostRelationship" ADD COLUMN IF NOT EXISTS "revocationReason" TEXT;
