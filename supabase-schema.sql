-- Create Lead table for newsletter signups
CREATE TABLE IF NOT EXISTS "Lead" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  source TEXT DEFAULT 'newsletter',
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
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