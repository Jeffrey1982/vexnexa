/**
 * Creates the email_templates table in Supabase (PostgreSQL) via Prisma.
 * Usage: npx dotenv -e .env.migration -- npx tsx scripts/create-email-templates-table.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Creating email_templates table...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      subject TEXT NOT NULL DEFAULT '',
      html TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      variables JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log('Table created (or already exists).');

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates (name);
  `);
  console.log('Index created (or already exists).');

  console.log('Done! email_templates table is ready.');
}

main()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
