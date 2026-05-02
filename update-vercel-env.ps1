# Updates Vercel environment variables from the current shell environment.
# Usage:
#   $env:DATABASE_URL="..."
#   $env:CRON_SECRET="..."
#   .\update-vercel-env.ps1

$ErrorActionPreference = "Stop"

$TargetEnvironment = if ($env:VERCEL_TARGET_ENV) { $env:VERCEL_TARGET_ENV } else { "production" }

$RequiredVariables = @(
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "BILLING_SUPPORT_EMAIL",
  "MOLLIE_API_KEY",
  "MOLLIE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "CRON_SECRET"
)

function Get-RequiredEnvValue {
  param ([string]$Name)

  $Value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Missing required environment variable: $Name"
  }
  return $Value
}

function Set-VercelEnv {
  param (
    [string]$Name,
    [string]$Value,
    [string]$Environment
  )

  Write-Host "Setting $Name in Vercel $Environment..." -ForegroundColor Yellow
  $Value | vercel env add $Name $Environment --force
}

Write-Host "Updating Vercel environment variables for $TargetEnvironment..." -ForegroundColor Cyan

foreach ($Name in $RequiredVariables) {
  Set-VercelEnv -Name $Name -Value (Get-RequiredEnvValue $Name) -Environment $TargetEnvironment
}

Write-Host "Environment variables updated. Redeploy the app to apply them." -ForegroundColor Green
