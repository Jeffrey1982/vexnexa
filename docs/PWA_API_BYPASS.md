# PWA Service Worker – API Bypass Configuration

## Problem

The VexNexa PWA service worker was intercepting `/api/*` requests. When the network was unavailable (or during certain race conditions), API calls — including Mailgun webhook POSTs — received the "You're Offline" HTML fallback page instead of reaching the server.

## Fix Applied

In `public/sw.js`, **all `/api/*` requests now bypass the service worker entirely**. The SW's `fetch` event handler returns early (no `event.respondWith()`) for any URL whose pathname starts with `/api/`. This means:

- **GET /api/*** → goes straight to the network
- **POST /api/*** → goes straight to the network (webhooks, form submissions)
- **PUT/DELETE /api/*** → goes straight to the network

The offline fallback HTML page is **only** served for document navigations (HTML pages), never for API requests.

### Cache Version

The cache name was bumped from `vexnexa-v11-ga4-regional` to `vexnexa-v12-api-bypass`. On the next visit, the new SW will activate and delete the old cache automatically.

## Verifying the Fix

### Debug Endpoint

A debug endpoint exists at:

```
GET https://www.vexnexa.com/api/_debug/pwa
```

Expected response (JSON):
```json
{
  "ok": true,
  "ts": "2026-02-08T13:00:00.000Z",
  "note": "If you see this JSON, the service worker is NOT intercepting /api/* requests."
}
```

If you see the "You're Offline" HTML page instead, the old service worker is still active. See clearing instructions below.

## Clearing the Service Worker Cache

After deploying the fix, existing users may still have the old SW cached. The new SW should auto-update on the next visit, but if it doesn't:

### Chrome (Desktop)

1. Open DevTools → **Application** tab
2. In the left sidebar, click **Service Workers**
3. Click **Unregister** next to the VexNexa service worker
4. Check **Update on reload** for future deployments
5. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

Alternatively, clear all site data:
1. DevTools → **Application** → **Storage**
2. Click **Clear site data** (check all boxes)
3. Reload the page

### Chrome (Android)

1. Open Chrome → tap the three-dot menu → **Settings**
2. Go to **Site settings** → **All sites**
3. Find `vexnexa.com` → tap **Clear & reset**
4. Revisit the site

### iOS Safari / PWA

If VexNexa is installed as a PWA on iOS:

1. **Delete the PWA**: Long-press the app icon → tap the **X** or **Remove App**
2. Open Safari → go to `https://www.vexnexa.com`
3. Clear Safari cache: **Settings** → **Safari** → **Clear History and Website Data**
4. Revisit the site and re-add to Home Screen if desired

### Firefox

1. Open DevTools → **Application** (or **Storage**) tab
2. Under **Service Workers**, click **Unregister**
3. Under **Cache Storage**, delete all VexNexa caches
4. Hard refresh: `Ctrl+Shift+R`

## Mailgun Webhook Configuration

Ensure your Mailgun webhook URL points to:

```
https://www.vexnexa.com/api/email/webhook
```

This endpoint:
- Runs on `runtime = "nodejs"`
- Is **never** intercepted by the service worker
- Verifies Mailgun HMAC-SHA256 signatures
- Accepts POST requests with JSON body

## Architecture Notes

- The service worker is a **custom implementation** in `public/sw.js` (not next-pwa)
- SW registration happens in the app layout
- The `fetch` event handler checks `url.pathname.startsWith('/api/')` and returns early, which means the browser's default fetch behavior is used (no `event.respondWith()`)
- This is the most reliable bypass method — it's equivalent to Workbox's `NetworkOnly` but without any error-handling wrapper that could interfere
