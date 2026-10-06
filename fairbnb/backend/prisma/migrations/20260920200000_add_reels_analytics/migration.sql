-- CreateTable
CREATE TABLE "ReelAnalytics" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
    "totalWatchDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completions25" INTEGER NOT NULL DEFAULT 0,
    "completions50" INTEGER NOT NULL DEFAULT 0,
    "completions75" INTEGER NOT NULL DEFAULT 0,
    "completions100" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReelAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelViewSession" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "watchDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxMilestone" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReelViewSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReelAnalytics_reelId_key" ON "ReelAnalytics"("reelId");

-- CreateIndex
CREATE INDEX "ReelAnalytics_reelId_idx" ON "ReelAnalytics"("reelId");

-- CreateIndex
CREATE INDEX "ReelViewSession_reelId_userId_idx" ON "ReelViewSession"("reelId", "userId");

-- CreateIndex
CREATE INDEX "ReelViewSession_reelId_createdAt_idx" ON "ReelViewSession"("reelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReelViewSession_reelId_sessionId_key" ON "ReelViewSession"("reelId", "sessionId");

-- AddForeignKey
ALTER TABLE "ReelAnalytics" ADD CONSTRAINT "ReelAnalytics_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelViewSession" ADD CONSTRAINT "ReelViewSession_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
