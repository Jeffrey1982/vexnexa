/**
 * Creates outreach tables in Supabase via Prisma.
 * Usage: npx dotenv -e .env.migration -- npx tsx scripts/create-outreach-tables.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run(label: string, sql: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('OK:', label);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('ERR:', label, '->', msg.substring(0, 120));
  }
}

async function main(): Promise<void> {
  // 1) Companies
  await run('outreach_companies', `
    CREATE TABLE IF NOT EXISTS outreach_companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      website TEXT,
      domain TEXT,
      country TEXT,
      industry TEXT,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // 2) Contacts
  await run('outreach_contacts', `
    CREATE TABLE IF NOT EXISTS outreach_contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES outreach_companies(id) ON DELETE SET NULL,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      position TEXT DEFAULT '',
      country TEXT DEFAULT '',
      tags TEXT[] DEFAULT '{}',
      do_not_email BOOLEAN NOT NULL DEFAULT false,
      unsubscribed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // 3) Campaigns
  await run('outreach_campaigns', `
    CREATE TABLE IF NOT EXISTS outreach_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      template_name TEXT,
      html_body TEXT NOT NULL DEFAULT '',
      text_body TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      from_name TEXT DEFAULT '',
      from_email TEXT DEFAULT '',
      reply_to TEXT DEFAULT '',
      tag TEXT DEFAULT '',
      filters JSONB DEFAULT '{}'::jsonb,
      total_recipients INT NOT NULL DEFAULT 0,
      sent_count INT NOT NULL DEFAULT 0,
      failed_count INT NOT NULL DEFAULT 0,
      created_by TEXT DEFAULT '',
      send_started_at TIMESTAMPTZ,
      send_completed_at TIMESTAMPTZ,
      send_lock BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // 4) Campaign Recipients
  await run('outreach_campaign_recipients', `
    CREATE TABLE IF NOT EXISTS outreach_campaign_recipients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
      contact_id UUID REFERENCES outreach_contacts(id) ON DELETE SET NULL,
      email TEXT NOT NULL,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      company_name TEXT DEFAULT '',
      website TEXT DEFAULT '',
      country TEXT DEFAULT '',
      variables JSONB DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      mailgun_message_id TEXT,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT uq_campaign_recipient UNIQUE (campaign_id, email)
    )
  `);

  // 5) Unsubscribes
  await run('outreach_unsubscribes', `
    CREATE TABLE IF NOT EXISTS outreach_unsubscribes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      reason TEXT DEFAULT 'unsubscribe_link',
      campaign_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Indexes
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_oc_domain ON outreach_companies (domain)`,
    `CREATE INDEX IF NOT EXISTS idx_oc_country ON outreach_companies (country)`,
    `CREATE INDEX IF NOT EXISTS idx_ocon_email ON outreach_contacts (email)`,
    `CREATE INDEX IF NOT EXISTS idx_ocon_company ON outreach_contacts (company_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ocon_country ON outreach_contacts (country)`,
    `CREATE INDEX IF NOT EXISTS idx_ocon_tags ON outreach_contacts USING GIN (tags)`,
    `CREATE INDEX IF NOT EXISTS idx_ocamp_status ON outreach_campaigns (status)`,
    `CREATE INDEX IF NOT EXISTS idx_ocr_campaign ON outreach_campaign_recipients (campaign_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ocr_status ON outreach_campaign_recipients (status)`,
    `CREATE INDEX IF NOT EXISTS idx_ocr_email ON outreach_campaign_recipients (email)`,
    `CREATE INDEX IF NOT EXISTS idx_ounsub_email ON outreach_unsubscribes (email)`,
  ];
  for (const idx of indexes) {
    await run(idx.substring(0, 60), idx);
  }

  // Disable RLS
  const tables = ['outreach_companies', 'outreach_contacts', 'outreach_campaigns', 'outreach_campaign_recipients', 'outreach_unsubscribes'];
  for (const t of tables) {
    await run(`RLS off ${t}`, `ALTER TABLE ${t} DISABLE ROW LEVEL SECURITY`);
    await run(`GRANT ${t}`, `GRANT ALL PRIVILEGES ON TABLE ${t} TO anon, authenticated, service_role`);
  }

  // Schema usage
  await run('GRANT USAGE schema', `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role`);

  console.log('\nDone! All outreach tables ready.');
}

main()
  .catch((e) => { console.error('Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
