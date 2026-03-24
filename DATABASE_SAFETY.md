# Database Safety Guidelines

## 🚨 CRITICAL: PRODUCTION DATABASE PROTECTION

### NEVER RUN THESE COMMANDS IN PRODUCTION:
```bash
# ❌ DANGEROUS - WILL DELETE ALL DATA
npx prisma db push --force-reset
npx prisma migrate reset --force
npm run db:reset

# ❌ DANGEROUS - CAN CAUSE DATA LOSS
npx prisma db push
npx prisma migrate dev
```

### ✅ SAFE PRODUCTION COMMANDS:
```bash
# Apply migrations safely
npx prisma migrate deploy

# Generate client
npx prisma generate

# Check migration status
npx prisma migrate status
```

## Environment Separation

### Local Development:
- Use `.env` file
- Contains production Supabase URL ⚠️
- MUST use safe-migrate.ts for destructive operations

### Production:
- Uses Vercel environment variables
- Should NOT have DATABASE_URL in `.env.production`
- Only allows safe migrations

## Recovery Procedures

### If Production Data is Lost:
1. Create new Supabase project
2. Restore from backup (before incident)
3. Update environment variables
4. Apply safe migrations only
5. Test thoroughly

### Safe Migration Script:
```bash
# For local development (with safety checks)
npx tsx scripts/safe-migrate.ts --force

# For production (safe only)
npx tsx scripts/production-migrate.ts migrate deploy
```

## Incident Response Checklist

1. **STOP**: Pause all deployments
2. **PRESERVE**: Document current state
3. **RECOVER**: Create new project, restore from backup
4. **VALIDATE**: Check data integrity
5. **HARDEN**: Apply safeguards
6. **REVIEW**: Audit all database scripts

## Root Causes to Address

- Local `.env` pointing to production
- No environment checks in scripts
- Dangerous commands in package.json
- No confirmation prompts for destructive operations
