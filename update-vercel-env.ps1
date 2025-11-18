# PowerShell script to update Vercel environment variables for VexNexa
Write-Host "🚀 Updating Vercel environment variables for vexnexa project..." -ForegroundColor Cyan
Write-Host ""

# Function to set environment variable
function Set-VercelEnv {
    param (
        [string]$Name,
        [string]$Value,
        [string]$Env = "production"
    )

    Write-Host "Setting $Name..." -ForegroundColor Yellow
    $Value | vercel env add $Name $Env --force
}

# Database URLs
Set-VercelEnv "DATABASE_URL" "postgresql://postgres.zoljdbuiphzlsqzxdxyy:Destiney1982%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
Set-VercelEnv "DIRECT_URL" "postgresql://postgres:Destiney1982%21@db.zoljdbuiphzlsqzxdxyy.supabase.co:5432/postgres?sslmode=require"

# Supabase
Set-VercelEnv "NEXT_PUBLIC_SUPABASE_URL" "https://zoljdbuiphzlsqzxdxyy.supabase.co"
Set-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbGpkYnVpcGh6bHNxenhkeHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjI2OTAsImV4cCI6MjA3MjgzODY5MH0.K2cLamkHo4KH0POi8XOgUBRSiYlpRXmhBambxyeCI8s"

# App URLs
Set-VercelEnv "NEXT_PUBLIC_APP_URL" "https://vexnexa.com"
Set-VercelEnv "BILLING_SUPPORT_EMAIL" "info@vexnexa.com"

# API Keys
Set-VercelEnv "MOLLIE_API_KEY" "live_vur5Jktfz6jkdU23SrUWdkst9GJqpa"
Set-VercelEnv "MOLLIE_WEBHOOK_SECRET" "z8KeVppjBS559rBquWBcrtNFfn7zVet5"
Set-VercelEnv "RESEND_API_KEY" "re_iYpjertR_BvJ9YbZGn34zxdLGdbudrSZ6"

Write-Host ""
Write-Host "✅ Environment variables updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update Supabase dashboard redirect URLs"
Write-Host "2. Deploy to Vercel: vercel --prod"
