#!/bin/bash
# Script to manually trigger SEO health monitoring cron jobs
# This will populate initial data for the SEO Health dashboard

CRON_TOKEN="${CRON_TOKEN:-vGsiw1+JJ7YB+IWwWqerbB8o3bDk2Ryib9grk8LyHrU=}"
BASE_URL="${BASE_URL:-https://www.vexnexa.com}"

echo "🚀 Triggering SEO Health Monitoring Cron Jobs"
echo "=============================================="
echo "Base URL: $BASE_URL"
echo ""

# Function to trigger a cron job
trigger_cron() {
  local endpoint=$1
  local name=$2

  echo "📊 Triggering: $name"
  echo "   POST $BASE_URL$endpoint"

  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
    -H "X-CRON-TOKEN: $CRON_TOKEN" \
    -H "Content-Type: application/json")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo "   ✅ Success (HTTP $http_code)"
    echo "   Response: $body" | head -c 200
    echo ""
  else
    echo "   ❌ Failed (HTTP $http_code)"
    echo "   Response: $body"
    echo ""
  fi
}

# 1. Ingest Google Search Console data
trigger_cron "/api/cron/ingest-gsc" "Google Search Console Ingestion"
sleep 2

# 2. Ingest Google Analytics 4 data
trigger_cron "/api/cron/ingest-ga4" "Google Analytics 4 Ingestion"
sleep 2

# 3. Ingest PageSpeed data
trigger_cron "/api/cron/ingest-pagespeed" "PageSpeed Insights Ingestion"
sleep 2

# 4. Compute SEO Health Score
trigger_cron "/api/cron/compute-score" "SEO Health Score Computation"
sleep 2

# 5. Run alerts check
trigger_cron "/api/cron/run-alerts" "Alerts Detection"

echo ""
echo "=============================================="
echo "✨ All cron jobs triggered!"
echo ""
echo "Next steps:"
echo "1. Check the SEO Health dashboard: $BASE_URL/admin/seo"
echo "2. View detailed metrics: $BASE_URL/admin/seo/index-health"
echo "3. Monitor alerts: $BASE_URL/admin/seo/alerts"
echo ""
echo "Note: Data processing may take a few minutes."
