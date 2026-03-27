import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for ContactMessage table...')

  try {
    // Try to query the table
    await prisma.$queryRaw`SELECT 1 FROM "ContactMessage" LIMIT 1`
    console.log('✅ ContactMessage table exists')
  } catch (error: any) {
    if (error.code === 'P2010' || error.message.includes('does not exist')) {
      console.log('Creating ContactMessage table...')

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ContactMessage" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'new',
          "replied" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx" ON "ContactMessage"("email")
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "ContactMessage_status_idx" ON "ContactMessage"("status")
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt")
      `

      console.log('✅ ContactMessage table created successfully')
    } else {
      console.error('Error checking table:', error)
      throw error
    }
  }

  // Blog locale migration
  console.log('\nChecking for BlogPost locale column...')
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'BlogPost'
      AND column_name = 'locale';
    `

    if (result.length === 0) {
      console.log('Adding locale support to BlogPost table...')

      // Add locale column
      await prisma.$executeRaw`
        ALTER TABLE "BlogPost"
        ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
      `
      console.log('✓ Locale column added')

      // Drop old unique constraint
      try {
        await prisma.$executeRaw`
          ALTER TABLE "BlogPost"
          DROP CONSTRAINT IF EXISTS "BlogPost_slug_key";
        `
        console.log('✓ Old slug constraint dropped')
      } catch (e) {
        console.log('⚠ Slug constraint already dropped or does not exist')
      }

      // Add new compound unique constraint
      try {
        await prisma.$executeRaw`
          ALTER TABLE "BlogPost"
          ADD CONSTRAINT "BlogPost_slug_locale_key" UNIQUE ("slug", "locale");
        `
        console.log('✓ New slug+locale constraint added')
      } catch (e) {
        console.log('⚠ Constraint may already exist')
      }

      // Add locale index
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "BlogPost_locale_idx" ON "BlogPost"("locale");
      `
      console.log('✓ Locale index created')

      console.log('✅ BlogPost locale migration completed')
    } else {
      console.log('✅ BlogPost locale column already exists')
    }
  } catch (error: any) {
    console.error('⚠ BlogPost locale migration error (non-fatal):', error.message)
    // Don't fail the build if this migration has issues
  }

  // Plan enum migration: TRIAL → FREE
  console.log('\nChecking Plan enum for FREE value...')
  try {
    // Check if FREE already exists in the Plan enum
    const enumValues = await prisma.$queryRaw<any[]>`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Plan')
      ORDER BY enumsortorder;
    `
    const labels = enumValues.map((r: any) => r.enumlabel)
    console.log('Current Plan enum values:', labels.join(', '))

    if (!labels.includes('FREE')) {
      console.log('Adding FREE to Plan enum...')
      await prisma.$executeRawUnsafe(`ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'FREE' BEFORE 'STARTER'`)
      console.log('✓ FREE added to Plan enum')
    } else {
      console.log('✅ Plan enum already includes FREE')
    }

    // Migrate any remaining TRIAL users to FREE
    if (labels.includes('TRIAL')) {
      const trialCount = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM "User" WHERE plan = 'TRIAL'
      `
      const count = trialCount[0]?.count ?? 0
      if (count > 0) {
        console.log(`Migrating ${count} TRIAL users to FREE...`)
        await prisma.$executeRaw`
          UPDATE "User" SET plan = 'FREE', "subscriptionStatus" = 'active'
          WHERE plan = 'TRIAL'
        `
        console.log(`✓ ${count} users migrated from TRIAL to FREE`)
      } else {
        console.log('✅ No TRIAL users to migrate')
      }

      // Update trialing subscription statuses
      const trialingCount = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM "User" WHERE "subscriptionStatus" = 'trialing'
      `
      const tCount = trialingCount[0]?.count ?? 0
      if (tCount > 0) {
        console.log(`Migrating ${tCount} trialing statuses to active...`)
        await prisma.$executeRaw`
          UPDATE "User" SET "subscriptionStatus" = 'active'
          WHERE "subscriptionStatus" = 'trialing'
        `
        console.log(`✓ ${tCount} subscription statuses updated`)
      }
    }
  } catch (error: any) {
    console.error('⚠ Plan enum migration error (non-fatal):', error.message)
    // Don't fail the build — the app should still work with TRIAL in the enum
  }

  // Public scan reports tables
  console.log('\nChecking for public_scan_sites table...')
  try {
    await prisma.$queryRaw`SELECT 1 FROM "public_scan_sites" LIMIT 1`
    console.log('✅ public_scan_sites table exists')
  } catch (error: any) {
    if (error.code === 'P2010' || error.message?.includes('does not exist')) {
      console.log('Creating public scan report tables...')

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "public_scan_sites" (
          "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "normalized_domain" TEXT NOT NULL UNIQUE,
          "display_domain" TEXT NOT NULL,
          "first_scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "last_scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "latest_public_report_id" TEXT,
          "public_page_enabled" BOOLEAN NOT NULL DEFAULT true,
          "total_scans" INTEGER NOT NULL DEFAULT 0,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_pss_normalized_domain" ON "public_scan_sites"("normalized_domain")
      `
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_pss_public_enabled" ON "public_scan_sites"("public_page_enabled", "last_scanned_at" DESC)
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "public_scan_reports" (
          "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "site_id" TEXT NOT NULL REFERENCES "public_scan_sites"("id") ON DELETE CASCADE,
          "scan_id" TEXT,
          "normalized_domain" TEXT NOT NULL,
          "display_domain" TEXT NOT NULL,
          "score" INTEGER,
          "issues_total" INTEGER NOT NULL DEFAULT 0,
          "impact_critical" INTEGER NOT NULL DEFAULT 0,
          "impact_serious" INTEGER NOT NULL DEFAULT 0,
          "impact_moderate" INTEGER NOT NULL DEFAULT 0,
          "impact_minor" INTEGER NOT NULL DEFAULT 0,
          "pages_scanned" INTEGER NOT NULL DEFAULT 1,
          "scan_type" TEXT NOT NULL DEFAULT 'single_page',
          "summary" JSONB DEFAULT '{}',
          "top_violations" JSONB DEFAULT '[]',
          "wcag_aa_compliance" FLOAT,
          "wcag_aaa_compliance" FLOAT,
          "performance_score" FLOAT,
          "seo_score" FLOAT,
          "scanned_url" TEXT,
          "is_public" BOOLEAN NOT NULL DEFAULT true,
          "allow_indexing" BOOLEAN NOT NULL DEFAULT true,
          "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_psr_site_id" ON "public_scan_reports"("site_id")
      `
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_psr_normalized_domain" ON "public_scan_reports"("normalized_domain", "published_at" DESC)
      `
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_psr_scan_id" ON "public_scan_reports"("scan_id")
      `
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_psr_public" ON "public_scan_reports"("is_public", "allow_indexing", "published_at" DESC)
      `

      console.log('✅ Public scan report tables created successfully')
    } else {
      console.error('⚠ Public scan tables check error (non-fatal):', error.message)
    }
  }
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
