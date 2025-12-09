# ⚡ URGENT ACTION CHECKLIST

## 🔴 CRITICAL - DO TODAY

### ☐ 1. Rotate Exposed Secrets (30 mins)

**Supabase Database**:
```bash
# 1. Go to: https://supabase.com/dashboard/project/zoljdbuiphzlsqzxdxyy/settings/database
# 2. Change database password
# 3. Update in Vercel:
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
```

**Mollie Payment API**:
```bash
# 1. Go to: https://www.mollie.com/dashboard/developers/api-keys
# 2. Delete old key: live_vur5Jktfz6jkdU23SrUWdkst9GJqpa
# 3. Generate new key
# 4. Update in Vercel:
vercel env add MOLLIE_API_KEY production
vercel env add MOLLIE_WEBHOOK_SECRET production
```

**Resend Email**:
```bash
# 1. Go to: https://resend.com/api-keys
# 2. Delete old key: re_5KGENYCh_GGHLe2EXS4abT4ugyZjnNCpf
# 3. Generate new key
# 4. Update in Vercel:
vercel env add RESEND_API_KEY production
```

---

### ☐ 2. Add Missing CRON_SECRET (5 mins)

```bash
# Generate a secure secret
openssl rand -base64 32

# Add to Vercel
vercel env add CRON_SECRET production
# Paste the generated secret

# Add to local .env
echo "CRON_SECRET=your-generated-secret" >> .env
```

---

### ☐ 3. Remove Secrets from Git History (15 mins)

```bash
# WARNING: This rewrites git history
# Coordinate with team before running!

# 1. Backup your repo
git clone --mirror https://github.com/yourusername/vexnexa.git backup

# 2. Remove sensitive files
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.production .env.vercel.production" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (DANGEROUS - tell team first!)
git push origin --force --all
git push origin --force --tags

# 4. Everyone on team must re-clone:
# git clone <repo-url> fresh-copy
```

---

### ☐ 4. Verify Changes (10 mins)

```bash
# 1. Check Vercel environment variables
vercel env ls

# Expected output:
# ✓ DATABASE_URL (production)
# ✓ DIRECT_URL (production)
# ✓ MOLLIE_API_KEY (production)
# ✓ RESEND_API_KEY (production)
# ✓ CRON_SECRET (production)

# 2. Deploy to production
vercel --prod

# 3. Test critical flows:
# - User registration (tests Supabase)
# - Payment checkout (tests Mollie)
# - Contact form (tests Resend)
# - Scheduled scans (tests CRON_SECRET)
```

---

## 🟡 HIGH PRIORITY - THIS WEEK

### ☐ 5. Protect Remaining Test Routes (30 mins)

Apply to these files:
- `src/app/api/test-email/route.ts`
- `src/app/api/test-scan/route.ts`
- `src/app/api/test-signup/route.ts`
- `src/app/api/test-gdpr-flow/route.ts`
- `src/app/api/test-pdf/route.ts`
- `src/app/api/chromium-test/route.ts`
- `src/app/api/auth-test/route.ts`
- `src/app/api/dbtest/route.ts`
- `src/app/api/test-new-user-notification/route.ts`
- `src/app/api/test-resend-detailed/route.ts`
- `src/app/api/test-newsletter-email/route.ts`
- `src/app/api/test-email-headers/route.ts`

Add to each:
```typescript
import { requireDevelopment } from '@/lib/dev-only'

export async function GET(request: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck

  // ... rest of code
}
```

---

### ☐ 6. Remove Production Console Logs (1 hour)

**File**: `src/app/api/mollie/checkout/route.ts`

Remove or wrap in development check:
```typescript
// Bad
console.log('Request body:', body)

// Good
if (process.env.NODE_ENV === 'development') {
  console.log('Checkout initiated')
}
```

---

### ☐ 7. Update .env.example (15 mins)

Add missing variables:
```bash
# Add to .env.example:

# Cron job authentication (required)
CRON_SECRET=generate-with-openssl-rand-base64-32

# Email service (required)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Payment processing (required for production)
MOLLIE_API_KEY=live_xxxxxxxxxxxx
MOLLIE_WEBHOOK_SECRET=your-webhook-secret-from-mollie

# Database (required)
DATABASE_URL=postgresql://user:pass@host:port/db
DIRECT_URL=postgresql://user:pass@host:port/db

# Application URL (required)
NEXT_PUBLIC_APP_URL=https://vexnexa.com
BILLING_SUPPORT_EMAIL=support@vexnexa.com
```

---

## 🟢 MEDIUM PRIORITY - THIS SPRINT

### ☐ 8. Fix Favicon Fallback

**File**: Components that display favicons

```tsx
<img
  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
  onError={(e) => {
    e.currentTarget.src = '/placeholder-favicon.png'
  }}
  alt="Favicon"
/>
```

Create placeholder:
```bash
# Add a default favicon to public folder
cp public/icon-192.png public/placeholder-favicon.png
```

---

### ☐ 9. Configure Custom Email Domain

1. Go to https://resend.com/domains
2. Add domain: `vexnexa.com`
3. Add DNS records from Resend
4. Wait for verification (5-10 mins)
5. Update email.ts:
   ```typescript
   from: 'VexNexa <support@vexnexa.com>' // instead of onboarding@resend.dev
   ```

---

### ☐ 10. Plan Soft-Delete Implementation

Create migration plan:
```sql
-- Add to all relevant tables:
ALTER TABLE sites ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE sites ADD COLUMN deleted_by VARCHAR(255) NULL;
ALTER TABLE scans ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE scans ADD COLUMN deleted_by VARCHAR(255) NULL;
-- etc.
```

Update `src/lib/soft-delete.ts` with actual implementation.

---

## ✅ COMPLETED

- [x] Fixed CRON_SECRET authentication (no fallback)
- [x] Added DOMPurify to blog editor
- [x] Created dev-only utility for test routes
- [x] Protected `/api/test-resend` endpoint
- [x] Fixed service worker favicon handling

---

## 📊 PROGRESS TRACKER

| Task | Priority | Time | Status |
|------|----------|------|--------|
| Rotate secrets | 🔴 Critical | 30m | ☐ |
| Add CRON_SECRET | 🔴 Critical | 5m | ☐ |
| Remove secrets from git | 🔴 Critical | 15m | ☐ |
| Verify changes | 🔴 Critical | 10m | ☐ |
| Protect test routes | 🟡 High | 30m | ☐ |
| Remove console logs | 🟡 High | 1h | ☐ |
| Update .env.example | 🟡 High | 15m | ☐ |
| Fix favicon fallback | 🟢 Medium | 30m | ☐ |
| Configure email domain | 🟢 Medium | 1h | ☐ |
| Plan soft-delete | 🟢 Medium | 2h | ☐ |

**Estimated Total Time**: ~6 hours

---

## 🆘 HELP NEEDED?

If you need assistance:
1. **Rotating secrets**: Follow each service's documentation
2. **Git history**: Consider hiring a DevOps consultant if uncertain
3. **Email domain**: Resend has good documentation and support
4. **General questions**: Check SECURITY_AUDIT_REPORT.md for details

---

**Last Updated**: December 9, 2024
**Next Review**: After critical issues resolved
