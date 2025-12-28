#!/bin/bash
# Test script to verify CRON_TOKEN authentication

BASE_URL="${BASE_URL:-https://www.vexnexa.com}"

echo "🔐 Testing CRON_TOKEN Authentication"
echo "====================================="
echo ""
echo "If you don't know your CRON_TOKEN, you can:"
echo "1. Check Vercel Dashboard → Settings → Environment Variables"
echo "2. Or generate a new one: openssl rand -base64 32"
echo ""
read -p "Enter your CRON_TOKEN: " CRON_TOKEN
echo ""

echo "📊 Testing: /api/cron/ingest-gsc"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/cron/ingest-gsc" \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "✅ Authentication successful!"
  echo "Response: $body" | head -c 300
  echo ""
  echo ""
  echo "Your CRON_TOKEN is correct. You can now run:"
  echo "  CRON_TOKEN='$CRON_TOKEN' bash scripts/trigger-seo-crons.sh"
elif [ "$http_code" = "401" ]; then
  echo "❌ Authentication failed (HTTP 401)"
  echo "Response: $body"
  echo ""
  echo "Please check:"
  echo "1. The CRON_TOKEN in Vercel matches what you entered"
  echo "2. The deployment has completed"
  echo "3. Environment variables are set for 'production' environment"
else
  echo "⚠️  Unexpected response (HTTP $http_code)"
  echo "Response: $body"
fi
