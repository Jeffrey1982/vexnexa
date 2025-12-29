#!/bin/bash
# Fix migration state and apply remaining migrations

# Extract DB URLs without trailing newlines
DATABASE_URL=$(grep "DATABASE_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')
DIRECT_URL=$(grep "DIRECT_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')

export DATABASE_URL
export DIRECT_URL

echo "Resolving migration conflict..."
npx prisma migrate resolve --applied 20250101_add_team_collaboration

echo ""
echo "Deploying remaining migrations..."
npx prisma migrate deploy
