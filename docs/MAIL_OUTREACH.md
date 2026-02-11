# VexNexa Outreach / Campaigns System

## Overview

The Outreach system allows VexNexa admins to manage companies, contacts, and send mass email campaigns safely via Mailgun. It includes CSV import, audience filtering, template-based personalization, batched sending with rate limiting, and full compliance features (unsubscribe links, suppression checks).

## Architecture

```
Admin UI (/admin/outreach/*)
  ↓ Server Actions (actions.ts)
  ↓ supabaseAdmin (direct DB queries)
  ↓ Send Engine (src/lib/outreach/send-engine.ts)
  ↓ Mailgun (src/lib/mailgun.ts)
  ↓ email_logs (existing logging)
```

## Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `outreach_companies` | Company records (name, website, domain, country, industry) |
| `outreach_contacts` | Contact records with email, tags, do_not_email, unsubscribed flags |
| `outreach_campaigns` | Campaign definitions with subject, body, status, send counts |
| `outreach_campaign_recipients` | Snapshot of recipients per campaign with send status |
| `outreach_unsubscribes` | Global unsubscribe list (HMAC-verified) |

All tables have RLS disabled (admin-only access via service_role key).

## Environment Variables

```env
# Optional — defaults shown
OUTREACH_BATCH_SIZE=25
OUTREACH_RATE_LIMIT_PER_MIN=50
OUTREACH_UNSUBSCRIBE_SECRET=your-hmac-secret-here
OUTREACH_FROM_NAME=VexNexa
OUTREACH_FROM_EMAIL=hello@vexnexa.com
OUTREACH_REPLY_TO=hello@vexnexa.com

# Required (already configured)
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
MAILGUN_REGION=EU
```

If `OUTREACH_UNSUBSCRIBE_SECRET` is not set, falls back to `ADMIN_DASH_SECRET`.

## Setup

1. **Run the migration script** to create tables:
   ```bash
   npx dotenv -e .env.migration -- npx tsx scripts/create-outreach-tables.ts
   ```

2. **Configure env vars** in Vercel dashboard or `.env.local`.

3. **Verify Mailgun domain** has proper DKIM/SPF/MX records via Admin → Mail → Domains & DNS.

## How to Import Leads

1. Navigate to **Admin → Outreach → Import CSV**
2. Prepare a CSV with header row:
   ```
   company_name, website, country, first_name, last_name, email, position, tags
   ```
3. Upload the file — preview shows first 5 rows
4. Click **Import** — report shows imported/updated/skipped counts
5. Companies are upserted by domain (preferred) or name
6. Contacts are upserted by email

## How to Create a Campaign

1. Navigate to **Admin → Outreach → Campaigns → New Campaign**
2. Optionally select an existing email template (from Admin → Mail → Templates)
3. Fill in campaign name, subject line, and email body
4. Use personalization variables:
   - `{{first_name}}` — falls back to "there" if empty
   - `{{last_name}}`
   - `{{company_name}}`
   - `{{website}}`
   - `{{country}}`
   - `{{email}}`
   - `{{unsubscribe_url}}` — auto-appended if not in template
5. Click **Create Campaign**

## How to Send

1. Open the campaign detail page
2. **Build Audience**: set filters (country, tag, has website) and click "Build Recipients"
   - Creates a snapshot — the list is frozen even if contacts change later
   - Automatically excludes: unsubscribed, do_not_email, globally suppressed
3. **Preview**: click "Preview Email" to see the rendered HTML with sample data
4. **Send Batch**: click "Send Next Batch" to send 25 emails at a time
   - Rate limited to 50 emails/minute by default
   - Uses DB row lock to prevent concurrent sends
   - Each recipient is sent exactly once (deduplication by campaign + email)
   - Status transitions: `pending → sent/failed/skipped`
5. Repeat "Send Next Batch" until all recipients are processed
6. Campaign status changes to `completed` when no pending recipients remain

## Deliverability Best Practices

### Warm-Up Schedule
If using a new domain or IP:
- **Week 1**: 50 emails/day
- **Week 2**: 100 emails/day
- **Week 3**: 250 emails/day
- **Week 4**: 500 emails/day
- **Week 5+**: Gradually increase to full volume

### Headers
Every outreach email includes:
- `Reply-To` header (configurable per campaign)
- `List-Unsubscribe` header with HMAC-signed unsubscribe URL
- `List-Unsubscribe-Post` header for one-click unsubscribe
- Mailgun tag for tracking (`outreach` by default)

### Suppression Checks
Before sending, each recipient is checked against:
1. `outreach_contacts.do_not_email` flag
2. `outreach_contacts.unsubscribed` flag
3. `outreach_unsubscribes` table (global)
4. `email_suppressions` table (Mailgun webhook data)

## Unsubscribe Flow

1. Every email contains an unsubscribe link: `/unsubscribe?email=...&token=...`
2. Token is HMAC-SHA256 signed with `OUTREACH_UNSUBSCRIBE_SECRET`
3. Clicking the link:
   - Verifies the HMAC token
   - Inserts into `outreach_unsubscribes`
   - Sets `outreach_contacts.unsubscribed = true`
   - Shows confirmation page
4. Future sends automatically skip unsubscribed contacts

## Viewing Logs

All outreach emails are logged to the existing `email_logs` table with tag `outreach`. View them in:
- **Admin → Mail → Message Logs** (filter by tag "outreach")
- **Admin → Mail → Delivery Health** (aggregate metrics)

## Admin Pages

| Path | Description |
|------|-------------|
| `/admin/outreach` | Dashboard with KPI cards and quick actions |
| `/admin/outreach/companies` | CRUD for companies |
| `/admin/outreach/contacts` | CRUD for contacts with filters |
| `/admin/outreach/import` | CSV import wizard |
| `/admin/outreach/campaigns` | Campaign list |
| `/admin/outreach/campaigns/new` | Create new campaign |
| `/admin/outreach/campaigns/[id]` | Campaign detail: audience, preview, send |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/outreach/send-engine.ts` | Batched send with locking, throttling, suppression |
| `src/lib/outreach/personalize.ts` | Variable merging with HTML escaping |
| `src/lib/outreach/unsubscribe.ts` | HMAC token generation/verification |
| `src/app/admin/outreach/actions.ts` | Server actions for all CRUD + send + preview |
| `src/app/unsubscribe/page.tsx` | Public unsubscribe confirmation page |
| `supabase/migrations/20260211_create_outreach_tables.sql` | Database schema |
| `scripts/create-outreach-tables.ts` | Migration runner script |

## Manual Test Checklist

- [ ] Import CSV → verify companies and contacts created
- [ ] Create campaign from template → verify body populated
- [ ] Build recipients with filters → verify correct count
- [ ] Preview email → verify personalization works
- [ ] Send batch → verify emails arrive and logs appear
- [ ] Click unsubscribe link → verify contact marked unsubscribed
- [ ] Re-send batch → verify unsubscribed contact is skipped
- [ ] Check Admin → Mail → Message Logs for outreach tag
