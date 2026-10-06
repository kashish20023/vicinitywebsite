-- AlterTable
ALTER TABLE "Reel" ADD COLUMN "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Reel_status_rankingScore_id_idx" ON "Reel"("status", "rankingScore", "id");
