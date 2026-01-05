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
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
