#!/bin/bash
# Load environment and run migrations

# Extract DB URLs without trailing newlines
DATABASE_URL=$(grep "DATABASE_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')
DIRECT_URL=$(grep "DIRECT_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')

echo "Running Prisma migrations against production database..."
export DATABASE_URL
export DIRECT_URL

npx prisma migrate deploy
