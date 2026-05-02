#!/bin/bash
# Test compute score endpoint

CRON_SECRET="${CRON_SECRET:-${CRON_TOKEN:-}}"
if [ -z "$CRON_SECRET" ]; then
  echo "Set CRON_SECRET before running this script."
  exit 1
fi

echo "Testing compute score endpoint..."
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "https://www.vexnexa.com/api/cron/compute-score" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
