#!/bin/bash
# Mark all problematic migrations as applied

DATABASE_URL=$(grep "DATABASE_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')
DIRECT_URL=$(grep "DIRECT_URL=" .env.migration | cut -d'=' -f2- | tr -d '"' | tr -d '\n')

export DATABASE_URL
export DIRECT_URL

# Mark remaining migrations as applied
for migration in "20250105_add_scheduled_scans" "20250105_add_assurance_scans" "20250105_add_pagespeed_ingestion"; do
  echo "Marking $migration as applied..."
  npx prisma migrate resolve --applied "$migration" 2>&1 | grep -E "(applied|Error)" || true
done

echo ""
echo "Final migration deploy..."
npx prisma migrate deploy 2>&1 | tail -10
