# Mailgun Email Integration – Admin Guide

## Environment Variables

Add the following to your `.env.local` (or Vercel environment settings):

```env
# Mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_WEBHOOK_SIGNING_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_REGION=EU          # "EU" or "US"

# Supabase (service role – server only)
SUPABASE_URL=https://xxxxx.supabase.co        # or use NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Admin dashboard secret
ADMIN_DASH_SECRET=your-random-secret-here
```

## Database Setup

Run the SQL migration to create the required tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in your Supabase dashboard:
# File: supabase/migrations/20260208_create_email_tables.sql
```

Tables created:
- **`email_logs`** – one row per sent message (status, tags, message-id)
- **`email_events`** – one row per Mailgun webhook event (raw payload stored as JSONB)

## API Endpoints

### Send Email

```bash
POST /api/email/send
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Welcome to VexNexa",
  "html": "<h1>Hello!</h1><p>Welcome aboard.</p>",
  "tag": "onboarding",
  "user_id": "user_abc123",
  "meta": {
    "campaign": "launch-2026"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "abc123@mg.yourdomain.com",
  "mailgun_response": "Queued. Thank you."
}
```

### Webhook (Mailgun → VexNexa)

```
POST /api/email/webhook
```

Mailgun sends events here automatically. The endpoint:
1. Verifies the HMAC-SHA256 signature
2. Inserts the event into `email_events`
3. Updates `email_logs.status` for critical events (delivered, failed, complained, unsubscribed)

### Admin Health Metrics

```bash
GET /api/admin/email/health?range=24h
# Ranges: 24h, 7d, 30d

# Header required:
x-admin-secret: your-random-secret-here
```

### Admin Message Logs

```bash
GET /api/admin/email/logs?query=user@example.com&tag=onboarding&status=delivered&limit=50&offset=0

# Header required:
x-admin-secret: your-random-secret-here
```

## Admin UI

Visit `/admin/email` (requires authenticated admin user). The page shows:
- KPI cards for sent, delivered, failed, opened, clicked, complained, unsubscribed
- Range selector (24h / 7d / 30d)
- Searchable/filterable message log table with pagination

## Mailgun Dashboard Settings

### Setting Up Webhooks

1. Log in to [Mailgun Dashboard](https://app.mailgun.com/) (or [EU Dashboard](https://app.eu.mailgun.com/))
2. Go to **Sending** → **Webhooks**
3. Add a new webhook for your domain
4. Set the URL to: `https://www.vexnexa.com/api/email/webhook`
5. Enable the following events:
   - **Delivered**
   - **Permanent Failure**
   - **Temporary Failure**
   - **Opened**
   - **Clicked**
   - **Unsubscribed**
   - **Complained**

### Finding Your Webhook Signing Key

1. Go to **Settings** → **API Security** → **Webhook signing key**
2. Copy the key and set it as `MAILGUN_WEBHOOK_SIGNING_KEY`

## Testing the Webhook Locally

You can simulate a Mailgun webhook event using curl. First, generate a valid signature:

```javascript
// Node.js snippet to generate test signature
const crypto = require('crypto');
const signingKey = 'your-webhook-signing-key';
const timestamp = Math.floor(Date.now() / 1000).toString();
const token = crypto.randomBytes(32).toString('hex');
const signature = crypto.createHmac('sha256', signingKey)
  .update(timestamp + token)
  .digest('hex');

console.log(JSON.stringify({ timestamp, token, signature }));
```

Then send the test event:

```bash
curl -X POST http://localhost:3000/api/email/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "signature": {
      "timestamp": "TIMESTAMP",
      "token": "TOKEN",
      "signature": "SIGNATURE"
    },
    "event-data": {
      "event": "delivered",
      "timestamp": 1234567890,
      "recipient": "user@example.com",
      "message": {
        "headers": {
          "message-id": "abc123@mg.yourdomain.com"
        }
      }
    }
  }'
```

### Signature Verification

The webhook verifies signatures using:
```
HMAC_SHA256(signing_key, timestamp + token) === signature.signature
```

If the signature doesn't match, the webhook returns `403 Forbidden`.

## Troubleshooting

- **401 on admin endpoints**: Check that `x-admin-secret` header matches `ADMIN_DASH_SECRET`
- **500 on send**: Verify `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are correct
- **403 on webhook**: Check `MAILGUN_WEBHOOK_SIGNING_KEY` matches your Mailgun dashboard
- **Empty admin UI**: Run the SQL migration and verify `SUPABASE_SERVICE_ROLE_KEY` is set
