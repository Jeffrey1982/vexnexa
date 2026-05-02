#!/bin/bash
# Test the new deployment URL

DEPLOYMENT_URL="${DEPLOYMENT_URL:-https://www.vexnexa.com}"
CRON_SECRET="${CRON_SECRET:-${CRON_TOKEN:-}}"
if [ -z "$CRON_SECRET" ]; then
  echo "Set CRON_SECRET before running this script."
  exit 1
fi

echo "Testing new deployment at: $DEPLOYMENT_URL"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$DEPLOYMENT_URL/api/cron/ingest-gsc" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "401" ]; then
  echo "❌ Still failing authentication"
elif [ "$http_code" = "200" ]; then
  echo "✅ Authentication successful on new deployment!"
  echo "The main domain (www.vexnexa.com) should update shortly."
else
  echo "⚠️  Status code: $http_code"
fi
