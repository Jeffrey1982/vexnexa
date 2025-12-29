#!/bin/bash
# Test the new deployment URL

DEPLOYMENT_URL="https://vexnexa-5ekbydzvi-jeffreyaay-gmailcoms-projects.vercel.app"
CRON_TOKEN="vGsiw1+JJ7YB+IWwWqerbB8o3bDk2Ryib9grk8LyHrU="

echo "Testing new deployment at: $DEPLOYMENT_URL"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$DEPLOYMENT_URL/api/cron/ingest-gsc" \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
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
