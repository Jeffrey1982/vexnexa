#!/bin/bash
# Script to update Vercel environment variables for VexNexa

echo "🚀 Updating Vercel environment variables for vexnexa project..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo "📦 Setting environment variables..."
echo ""

# Database URLs
vercel env add DATABASE_URL production <<< 'postgresql://postgres.zoljdbuiphzlsqzxdxyy:Destiney1982%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require'
vercel env add DIRECT_URL production <<< 'postgresql://postgres:Destiney1982%21@db.zoljdbuiphzlsqzxdxyy.supabase.co:5432/postgres?sslmode=require'

# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< 'https://zoljdbuiphzlsqzxdxyy.supabase.co'
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbGpkYnVpcGh6bHNxenhkeHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjI2OTAsImV4cCI6MjA3MjgzODY5MH0.K2cLamkHo4KH0POi8XOgUBRSiYlpRXmhBambxyeCI8s'

# App URLs
vercel env add NEXT_PUBLIC_APP_URL production <<< 'https://vexnexa.com'
vercel env add BILLING_SUPPORT_EMAIL production <<< 'info@vexnexa.com'

# API Keys
vercel env add MOLLIE_API_KEY production <<< 'live_vur5Jktfz6jkdU23SrUWdkst9GJqpa'
vercel env add MOLLIE_WEBHOOK_SECRET production <<< 'z8KeVppjBS559rBquWBcrtNFfn7zVet5'
vercel env add RESEND_API_KEY production <<< 're_iYpjertR_BvJ9YbZGn34zxdLGdbudrSZ6'

echo ""
echo "✅ Environment variables updated successfully!"
echo ""
echo "Next steps:"
echo "1. Go to Supabase dashboard and update redirect URLs"
echo "2. Deploy to Vercel: vercel --prod"
