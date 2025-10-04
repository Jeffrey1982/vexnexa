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
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
