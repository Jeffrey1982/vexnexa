#!/bin/bash
# Test production CRON endpoint with local token

echo "Testing CRON_SECRET authentication on production..."
echo ""

CRON_SECRET="${CRON_SECRET:-${CRON_TOKEN:-}}"
if [ -z "$CRON_SECRET" ]; then
  echo "Set CRON_SECRET before running this script."
  exit 1
fi

echo "Making request to: https://www.vexnexa.com/api/cron/ingest-gsc"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "https://www.vexnexa.com/api/cron/ingest-gsc" \
  -H "Authorization: Bearer $CRON_SECRET" \
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
