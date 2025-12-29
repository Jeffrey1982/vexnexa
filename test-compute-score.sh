#!/bin/bash
# Test compute score endpoint

CRON_TOKEN="vGsiw1+JJ7YB+IWwWqerbB8o3bDk2Ryib9grk8LyHrU="

echo "Testing compute score endpoint..."
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "https://www.vexnexa.com/api/cron/compute-score" \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
