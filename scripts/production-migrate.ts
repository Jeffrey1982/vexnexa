#!/usr/bin/env tsx

/**
 * PRODUCTION MIGRATION SCRIPT
 * 
 * Safe migration runner for production environments.
 * Only allows safe operations (migrate deploy, generate).
 * Blocks any destructive commands.
 */

import { execSync } from 'child_process'

const ALLOWED_COMMANDS = [
  'prisma migrate deploy',
  'prisma generate',
  'prisma migrate status',
]

const DANGEROUS_COMMANDS = [
  'prisma db push',
  'prisma migrate reset',
  'prisma migrate dev',
  '--force-reset',
  '--force',
]

function checkCommand(args: string[]): void {
  const command = args.join(' ')
  
  // Check for dangerous patterns
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (command.includes(dangerous)) {
      console.error('🚨 DANGEROUS COMMAND BLOCKED:', command)
      console.error('Use "npx prisma migrate deploy" for production migrations.')
      process.exit(1)
    }
  }
  
  // Verify it's an allowed command
  const isAllowed = ALLOWED_COMMANDS.some(allowed => command.includes(allowed))
  if (!isAllowed) {
    console.error('❌ Command not allowed in production:', command)
    console.error('Allowed commands:', ALLOWED_COMMANDS.join(', '))
    process.exit(1)
  }
}

function main() {
  const args = process.argv.slice(2)
  
  console.log('🔒 Production migration runner')
  console.log('Checking command safety...\n')
  
  checkCommand(args)
  
  try {
    console.log('✅ Command approved. Executing:', args.join(' '))
    execSync(`npx ${args.join(' ')}`, { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Command failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
