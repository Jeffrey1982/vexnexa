#!/usr/bin/env tsx

/**
 * SAFE MIGRATION SCRIPT
 * 
 * This script replaces dangerous prisma commands with safety checks.
 * It will NOT run in production environments.
 * 
 * FOR DEVELOPMENT ONLY:
 * - Use this instead of `prisma db push --force-reset`
 * - It will check environment before proceeding
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

const PRODUCTION_ENVIRONMENTS = ['production', 'prod']
const SUPABASE_PROD_PATTERNS = [
  'zoljdbuiphzlsqzxdxyy.supabase.co',  // Current production
  'pooler.supabase.com',               // Supabase pooler URLs
]

function isProduction(): boolean {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase()
  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase()
  
  if (PRODUCTION_ENVIRONMENTS.includes(nodeEnv || '')) return true
  if (PRODUCTION_ENVIRONMENTS.includes(vercelEnv || '')) return true
  
  return false
}

function isProductionSupabase(): boolean {
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_URL || ''
  
  return SUPABASE_PROD_PATTERNS.some(pattern => 
    dbUrl.includes(pattern) || directUrl.includes(pattern)
  )
}

function abort(message: string): never {
  console.error('🚨 SAFETY ABORT:', message)
  console.error('This command is blocked to prevent production data loss.')
  process.exit(1)
}

function main() {
  console.log('🔍 Running safety checks before database operations...\n')
  
  // Check 1: Environment
  if (isProduction()) {
    abort('Running in production environment')
  }
  
  // Check 2: Supabase URL
  if (isProductionSupabase()) {
    abort('Connected to production Supabase instance')
  }
  
  // Check 3: Force flag confirmation
  const forceFlag = process.argv.includes('--force')
  if (!forceFlag) {
    console.log('⚠️  This is a destructive operation.')
    console.log('To proceed, add --force flag and confirm:')
    console.log('   npx tsx scripts/safe-migrate.ts --force')
    process.exit(0)
  }
  
  // Check 4: Interactive confirmation
  if (!process.env.CI && !process.env.AUTOMATED) {
    console.log('\n🚨 WARNING: This will reset your local database!')
    console.log('All data will be permanently deleted.')
    console.log('\nType "DELETE ALL DATA" to continue:')
    
    process.stdin.setEncoding('utf8')
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read()
      if (chunk === null) return
      
      const input = chunk.toString().trim()
      if (input === 'DELETE ALL DATA') {
        console.log('\n✅ Confirmation received. Proceeding with reset...')
        executeReset()
      } else {
        console.log('❌ Confirmation failed. Operation cancelled.')
        process.exit(0)
      }
    })
  } else {
    console.log('⚠️  Running in CI/CD mode - proceeding with reset...')
    executeReset()
  }
}

function executeReset() {
  try {
    console.log('🔄 Resetting database...')
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' })
    console.log('✅ Database reset complete.')
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
