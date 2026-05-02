#!/usr/bin/env bash
set -euo pipefail

# Adds analytics and cron environment variables to Vercel from the current shell.
# No secret values are stored in this file.

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is not installed. Install it with: npm i -g vercel" >&2
  exit 1
fi

target_env="${VERCEL_TARGET_ENV:-production}"

required_vars=(
  GOOGLE_CLIENT_EMAIL
  GOOGLE_PRIVATE_KEY
  GSC_SITE_URL
  GA4_PROPERTY_ID
  NEXT_PUBLIC_GA4_MEASUREMENT_ID
  CRON_SECRET
)

for name in "${required_vars[@]}"; do
  value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi

  echo "Setting $name in Vercel $target_env..."
  printf '%s' "$value" | vercel env add "$name" "$target_env" --force
done

echo "Environment variables added. Redeploy the app and run migrations if needed."
