-- Add soft delete functionality to major tables
-- Adds nullable deletedAt timestamp + index for each model.
-- Only User gets deletedBy to track which admin performed the deletion.

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

-- Site
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Site_deletedAt_idx" ON "Site"("deletedAt");

-- Scan
ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Scan_deletedAt_idx" ON "Scan"("deletedAt");

-- Team
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Team_deletedAt_idx" ON "Team"("deletedAt");

-- BlogPost
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");

-- SupportTicket
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "SupportTicket_deletedAt_idx" ON "SupportTicket"("deletedAt");

-- ManualAudit
ALTER TABLE "ManualAudit" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "ManualAudit_deletedAt_idx" ON "ManualAudit"("deletedAt");
