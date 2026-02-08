# API Route Debug & Verification Guide

## Debug Endpoints

After deployment, verify that API routes are reachable and NOT intercepted by the PWA service worker.

### 1. PWA Debug

```
GET https://vexnexa.com/api/_debug/pwa
```

**Expected response (200 JSON):**
```json
{
  "ok": true,
  "ts": "2026-02-08T14:00:00.000Z",
  "host": "vexnexa.com",
  "url": "https://vexnexa.com/api/_debug/pwa",
  "note": "If you see this JSON, the service worker is NOT intercepting /api/* requests."
}
```

If you see the "You're Offline" HTML page instead, the old service worker is still cached. See clearing instructions below.

### 2. Email Webhook (GET test)

```
GET https://vexnexa.com/api/email/webhook
```

**Expected response (200 JSON):**
```json
{
  "ok": true,
  "hint": "POST only for Mailgun",
  "host": "vexnexa.com"
}
```

The actual Mailgun webhook uses POST with signature verification.

### 3. Email Send (GET test)

```
GET https://vexnexa.com/api/email/send
```

**Expected response (200 JSON):**
```json
{
  "ok": true,
  "hint": "POST to send",
  "host": "vexnexa.com"
}
```

The actual send endpoint uses POST with a JSON body.

## Canonical Host

All requests to `www.vexnexa.com` are redirected (308 Permanent) to `vexnexa.com`. This is enforced by middleware at `src/middleware.ts`.

Test:
```bash
curl -I https://www.vexnexa.com/api/_debug/pwa
# Should return 308 -> https://vexnexa.com/api/_debug/pwa
```

## Cache-Control

All `/api/*` responses include `Cache-Control: no-store` to prevent any caching by browsers, CDNs, or service workers.

## Clearing Service Worker Caches

If the old service worker is still serving offline HTML for API routes:

### Chrome (Desktop)

1. Open DevTools (`F12`) → **Application** tab
2. Click **Service Workers** in the left sidebar
3. Click **Unregister** next to the VexNexa worker
4. Optionally check **Update on reload**
5. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

Or clear all site data:
1. DevTools → **Application** → **Storage**
2. Click **Clear site data** (check all boxes)
3. Reload

### Chrome (Android)

1. Chrome menu → **Settings** → **Site settings** → **All sites**
2. Find `vexnexa.com` → **Clear & reset**
3. Revisit the site

### iOS Safari

1. **Settings** → **Safari** → **Clear History and Website Data**
2. Revisit `https://vexnexa.com`

### iOS PWA (Home Screen App)

1. Long-press the VexNexa app icon → **Remove App**
2. Clear Safari data (above)
3. Revisit and re-add to Home Screen

### Firefox

1. DevTools → **Application** → **Service Workers** → **Unregister**
2. **Cache Storage** → delete all VexNexa caches
3. Hard refresh: `Ctrl+Shift+R`

## Runtime

All email API routes use `export const runtime = "nodejs"` to ensure they run on the Node.js runtime (required for `crypto` module used in webhook signature verification).
