/**
 * Creates the email_templates table in Supabase (PostgreSQL) via Prisma.
 * Usage: npx dotenv -e .env.migration -- npx tsx scripts/create-email-templates-table.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Check current role
  const role = await prisma.$queryRawUnsafe<{ current_user: string }[]>('SELECT current_user');
  console.log('Connected as:', JSON.stringify(role));

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
  console.log('Index created.');

  // Disable RLS
  await prisma.$executeRawUnsafe(`ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;`);
  console.log('RLS disabled.');

  // Grant schema-level usage
  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;`);
  console.log('Schema USAGE granted.');

  // Grant table-level permissions
  await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON TABLE email_templates TO anon, authenticated, service_role;`);
  console.log('Table privileges granted.');

  // Grant sequence permissions (for gen_random_uuid if needed)
  await prisma.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`);
  console.log('Sequence privileges granted.');

  // Also set default privileges for future tables
  await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`);
  console.log('Default privileges set.');

  // Verify by checking table privileges
  const privs = await prisma.$queryRawUnsafe<{ grantee: string; privilege_type: string }[]>(
    `SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = 'email_templates'`
  );
  console.log('Current table privileges:', JSON.stringify(privs, null, 2));

  console.log('Done! email_templates table is ready.');
}

main()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
