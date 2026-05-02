#!/usr/bin/env bash
set -euo pipefail

# Updates Vercel environment variables from the current shell environment.
# Usage:
#   export DATABASE_URL='...'
#   export CRON_SECRET='...'
#   ./update-vercel-env.sh

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is not installed. Install it with: npm i -g vercel" >&2
  exit 1
fi

target_env="${VERCEL_TARGET_ENV:-production}"

required_vars=(
  DATABASE_URL
  DIRECT_URL
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_APP_URL
  BILLING_SUPPORT_EMAIL
  MOLLIE_API_KEY
  MOLLIE_WEBHOOK_SECRET
  RESEND_API_KEY
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

echo "Environment variables updated. Redeploy the app to apply them."
