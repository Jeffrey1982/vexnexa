# API Route Debug & Verification Guide

## Debug Endpoints

After deployment, verify that API routes are reachable and not intercepted by the PWA service worker.

### PWA Debug

```http
GET https://www.vexnexa.com/api/_debug/pwa
```

Expected response:

```json
{
  "ok": true,
  "ts": "2026-02-08T14:00:00.000Z",
  "host": "www.vexnexa.com",
  "url": "https://www.vexnexa.com/api/_debug/pwa",
  "note": "If you see this JSON, the service worker is NOT intercepting /api/* requests."
}
```

If you see the offline HTML page instead, the old service worker is still cached.

## Canonical Host

The production canonical host is `https://www.vexnexa.com`. Vercel handles the redirect from `vexnexa.com` to `www.vexnexa.com`.

```bash
curl -I https://www.vexnexa.com/api/_debug/pwa
```

## Cache-Control

All `/api/*` responses include `Cache-Control: no-store` to prevent caching by browsers, CDNs, or service workers.
