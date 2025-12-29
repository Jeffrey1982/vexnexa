#!/bin/bash
# Resolve all migration conflicts

# Extract DB URLs without trailing newlines
DATABASE_URL=$(grep "DATABASE_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')
DIRECT_URL=$(grep "DIRECT_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')

export DATABASE_URL
export DIRECT_URL

echo "Resolving migration conflicts..."

# List of migrations that might be failing
migrations=(
  "20250101000000_google_health_score"
  "20250105_add_logging_models"
)

for migration in "${migrations[@]}"; do
  echo "Marking $migration as applied..."
  npx prisma migrate resolve --applied "$migration" 2>&1 | grep -v "warn"
done

echo ""
echo "Deploying remaining migrations..."
npx prisma migrate deploy 2>&1 | grep -v "warn"
