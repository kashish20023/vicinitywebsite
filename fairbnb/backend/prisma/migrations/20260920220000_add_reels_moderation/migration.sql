-- AlterEnum
ALTER TYPE "ReelStatus" ADD VALUE 'HIDDEN';

-- AlterTable
ALTER TABLE "ReelReport" ADD COLUMN "commentId" TEXT;

-- CreateIndex
CREATE INDEX "ReelReport_commentId_idx" ON "ReelReport"("commentId");

-- AddForeignKey
ALTER TABLE "ReelReport" ADD CONSTRAINT "ReelReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ReelComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
