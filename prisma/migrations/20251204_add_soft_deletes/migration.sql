-- Add soft delete functionality to major tables

-- Add deletedAt column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

-- Add deletedAt column to Site table
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Site_deletedAt_idx" ON "Site"("deletedAt");

-- Add deletedAt column to Scan table
ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Scan_deletedAt_idx" ON "Scan"("deletedAt");

-- Add deletedAt column to Team table
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Team_deletedAt_idx" ON "Team"("deletedAt");

-- Add deletedAt column to BlogPost table
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");

-- Add deletedAt column to SupportTicket table
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "SupportTicket_deletedAt_idx" ON "SupportTicket"("deletedAt");

-- Add deletedAt column to ManualAudit table
ALTER TABLE "ManualAudit" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "ManualAudit_deletedAt_idx" ON "ManualAudit"("deletedAt");

-- Add deletedBy column to track who deleted (for audit purposes)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "ManualAudit" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
