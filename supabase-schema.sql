-- Create Lead table for newsletter signups with GDPR compliance
CREATE TABLE IF NOT EXISTS "Lead" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  source TEXT DEFAULT 'newsletter',
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  -- GDPR/AVG compliance fields
  "isConfirmed" BOOLEAN DEFAULT FALSE,
  "confirmationToken" TEXT UNIQUE,
  "confirmedAt" TIMESTAMP WITH TIME ZONE,
  "isUnsubscribed" BOOLEAN DEFAULT FALSE,
  "unsubscribeToken" TEXT UNIQUE,
  "unsubscribedAt" TIMESTAMP WITH TIME ZONE,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ContactMessage table for contact form submissions
CREATE TABLE IF NOT EXISTS "ContactMessage" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead" (email);
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead" ("createdAt");
CREATE INDEX IF NOT EXISTS "Lead_confirmationToken_idx" ON "Lead" ("confirmationToken");
CREATE INDEX IF NOT EXISTS "Lead_unsubscribeToken_idx" ON "Lead" ("unsubscribeToken");
CREATE INDEX IF NOT EXISTS "Lead_isConfirmed_idx" ON "Lead" ("isConfirmed");
CREATE INDEX IF NOT EXISTS "Lead_isUnsubscribed_idx" ON "Lead" ("isUnsubscribed");
CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx" ON "ContactMessage" (email);
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage" ("createdAt");

-- Enable Row Level Security (optional but recommended)
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;

-- Create policies to allow inserts (for your API routes)
CREATE POLICY "Allow public inserts to Lead" ON "Lead"
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public inserts to ContactMessage" ON "ContactMessage"  
  FOR INSERT TO anon
  WITH CHECK (true);