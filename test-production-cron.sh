#!/bin/bash
# Test production CRON endpoint with local token

echo "Testing CRON_TOKEN authentication on production..."
echo ""

# Use the token from .env.local
CRON_TOKEN="vGsiw1+JJ7YB+IWwWqerbB8o3bDk2Ryib9grk8LyHrU="

echo "Making request to: https://www.vexnexa.com/api/cron/ingest-gsc"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "https://www.vexnexa.com/api/cron/ingest-gsc" \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "401" ]; then
  echo "❌ Authentication failed - CRON_TOKEN mismatch!"
  echo ""
  echo "The token in Vercel Production doesn't match your local token."
  echo "You need to update it in Vercel."
elif [ "$http_code" = "200" ]; then
  echo "✅ Authentication successful!"
else
  echo "⚠️  Unexpected status code: $http_code"
fi
