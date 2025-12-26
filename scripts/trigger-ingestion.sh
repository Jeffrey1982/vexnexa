#!/bin/bash
# Trigger all Google Health Score cron jobs
# Usage: bash scripts/trigger-ingestion.sh https://www.vexnexa.com

DOMAIN=${1:-"https://www.vexnexa.com"}
TOKEN=${CRON_TOKEN:-"your-cron-token"}

echo "🚀 Triggering Google Health Score data ingestion..."
echo "Domain: $DOMAIN"
echo ""

echo "1️⃣ Ingesting Google Search Console data..."
curl -X POST "$DOMAIN/api/cron/ingest-gsc" \
  -H "X-CRON-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  -s | jq .

echo "2️⃣ Ingesting Google Analytics 4 data..."
curl -X POST "$DOMAIN/api/cron/ingest-ga4" \
  -H "X-CRON-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  -s | jq .

echo "3️⃣ Ingesting PageSpeed Insights data (optional)..."
curl -X POST "$DOMAIN/api/cron/ingest-pagespeed" \
  -H "X-CRON-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  -s | jq .

echo "4️⃣ Computing health scores..."
curl -X POST "$DOMAIN/api/cron/compute-score" \
  -H "X-CRON-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  -s | jq .

echo "5️⃣ Running alert engine..."
curl -X POST "$DOMAIN/api/cron/run-alerts" \
  -H "X-CRON-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n" \
  -s | jq .

echo "✅ All cron jobs triggered!"
echo "View dashboard at: $DOMAIN/admin/seo"
