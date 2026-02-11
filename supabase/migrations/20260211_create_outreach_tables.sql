-- ============================================================
-- Outreach / Campaign tables for VexNexa Admin
-- ============================================================

-- 1) Companies
CREATE TABLE IF NOT EXISTS outreach_companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  website     TEXT,
  domain      TEXT,
  country     TEXT,
  industry    TEXT,
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_companies_domain ON outreach_companies (domain);
CREATE INDEX IF NOT EXISTS idx_outreach_companies_country ON outreach_companies (country);

-- 2) Contacts
CREATE TABLE IF NOT EXISTS outreach_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES outreach_companies(id) ON DELETE SET NULL,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL UNIQUE,
  position        TEXT DEFAULT '',
  country         TEXT DEFAULT '',
  tags            TEXT[] DEFAULT '{}',
  do_not_email    BOOLEAN NOT NULL DEFAULT false,
  unsubscribed    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_email ON outreach_contacts (email);
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_company ON outreach_contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_country ON outreach_contacts (country);
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_tags ON outreach_contacts USING GIN (tags);

-- 3) Campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  subject         TEXT NOT NULL DEFAULT '',
  template_name   TEXT,
  html_body       TEXT NOT NULL DEFAULT '',
  text_body       TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft',
  from_name       TEXT DEFAULT '',
  from_email      TEXT DEFAULT '',
  reply_to        TEXT DEFAULT '',
  tag             TEXT DEFAULT '',
  filters         JSONB DEFAULT '{}'::jsonb,
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count      INT NOT NULL DEFAULT 0,
  failed_count    INT NOT NULL DEFAULT 0,
  created_by      TEXT DEFAULT '',
  send_started_at TIMESTAMPTZ,
  send_completed_at TIMESTAMPTZ,
  send_lock       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_campaign_status CHECK (status IN ('draft','sending','paused','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON outreach_campaigns (status);

-- 4) Campaign Recipients (snapshot)
CREATE TABLE IF NOT EXISTS outreach_campaign_recipients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES outreach_contacts(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  first_name      TEXT DEFAULT '',
  last_name       TEXT DEFAULT '',
  company_name    TEXT DEFAULT '',
  website         TEXT DEFAULT '',
  country         TEXT DEFAULT '',
  variables       JSONB DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'pending',
  error           TEXT,
  mailgun_message_id TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_recipient_status CHECK (status IN ('pending','skipped','sent','failed')),
  CONSTRAINT uq_campaign_recipient UNIQUE (campaign_id, email)
);
CREATE INDEX IF NOT EXISTS idx_cr_campaign ON outreach_campaign_recipients (campaign_id);
CREATE INDEX IF NOT EXISTS idx_cr_status ON outreach_campaign_recipients (status);
CREATE INDEX IF NOT EXISTS idx_cr_email ON outreach_campaign_recipients (email);

-- 5) Global unsubscribes (if not already present via email_suppressions)
CREATE TABLE IF NOT EXISTS outreach_unsubscribes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  reason      TEXT DEFAULT 'unsubscribe_link',
  campaign_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_unsub_email ON outreach_unsubscribes (email);

-- Disable RLS on all outreach tables (admin-only access via service_role)
ALTER TABLE outreach_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaign_recipients DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_unsubscribes DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE outreach_companies TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE outreach_contacts TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE outreach_campaigns TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE outreach_campaign_recipients TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE outreach_unsubscribes TO anon, authenticated, service_role;
