-- CreateTable
CREATE TABLE "ScheduledScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timeOfDay" TEXT NOT NULL DEFAULT '00:00',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "emailOnComplete" BOOLEAN NOT NULL DEFAULT true,
    "emailOnIssues" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledScan_userId_idx" ON "ScheduledScan"("userId");

-- CreateIndex
CREATE INDEX "ScheduledScan_siteId_idx" ON "ScheduledScan"("siteId");

-- CreateIndex
CREATE INDEX "ScheduledScan_active_nextRunAt_idx" ON "ScheduledScan"("active", "nextRunAt");

-- CreateIndex
CREATE INDEX "ScheduledScan_nextRunAt_idx" ON "ScheduledScan"("nextRunAt");

-- AddForeignKey
ALTER TABLE "ScheduledScan" ADD CONSTRAINT "ScheduledScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledScan" ADD CONSTRAINT "ScheduledScan_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
