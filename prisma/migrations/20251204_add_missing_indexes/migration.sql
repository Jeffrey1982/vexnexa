-- Add missing indexes for better query performance

-- SupportTicket.updatedAt is frequently used for sorting
CREATE INDEX IF NOT EXISTS "SupportTicket_updatedAt_idx" ON "SupportTicket"("updatedAt" DESC);

-- Composite index for user admin events (userId + createdAt) for efficient filtering
CREATE INDEX IF NOT EXISTS "UserAdminEvent_userId_createdAt_idx" ON "UserAdminEvent"("userId", "createdAt" DESC);

-- Scan.status for filtering scans by status
CREATE INDEX IF NOT EXISTS "Scan_status_idx" ON "Scan"("status");

-- ContactMessage.createdAt + status composite for admin dashboard queries
CREATE INDEX IF NOT EXISTS "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt" DESC);

-- User.email for faster lookups (may already exist via unique constraint)
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- BlogPost.publishedAt for public blog listing
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_desc_idx" ON "BlogPost"("publishedAt" DESC);

-- Issue.status + priority composite for kanban views
CREATE INDEX IF NOT EXISTS "Issue_status_priority_idx" ON "Issue"("status", "priority");
