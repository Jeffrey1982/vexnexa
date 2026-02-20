-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "DeliverFormat" AS ENUM ('PDF', 'PDF_AND_DOCX', 'PDF_AND_HTML');

-- CreateTable
CREATE TABLE "ScanSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "frequency" "ScheduleFrequency" NOT NULL DEFAULT 'WEEKLY',
    "daysOfWeek" INTEGER[],
    "dayOfMonth" INTEGER,
    "timeOfDay" TEXT NOT NULL DEFAULT '09:00',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "recipients" TEXT[],
    "deliverFormat" "DeliverFormat" NOT NULL DEFAULT 'PDF',
    "includeExecutiveSummaryOnly" BOOLEAN NOT NULL DEFAULT false,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRun" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "windowKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "scanScore" INTEGER,
    "emailSentAt" TIMESTAMP(3),
    "emailId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanSchedule_userId_idx" ON "ScanSchedule"("userId");
CREATE INDEX "ScanSchedule_siteId_idx" ON "ScanSchedule"("siteId");
CREATE INDEX "ScanSchedule_isEnabled_nextRunAt_idx" ON "ScanSchedule"("isEnabled", "nextRunAt");
CREATE INDEX "ScanSchedule_nextRunAt_idx" ON "ScanSchedule"("nextRunAt");

CREATE UNIQUE INDEX "ScheduleRun_scheduleId_windowKey_key" ON "ScheduleRun"("scheduleId", "windowKey");
CREATE INDEX "ScheduleRun_scheduleId_idx" ON "ScheduleRun"("scheduleId");
CREATE INDEX "ScheduleRun_status_idx" ON "ScheduleRun"("status");

-- AddForeignKey
ALTER TABLE "ScanSchedule" ADD CONSTRAINT "ScanSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScanSchedule" ADD CONSTRAINT "ScanSchedule_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleRun" ADD CONSTRAINT "ScheduleRun_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ScanSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
