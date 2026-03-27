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
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
