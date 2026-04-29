# PWA Service Worker API Bypass Configuration

## Problem

The VexNexa PWA service worker was intercepting `/api/*` requests. When the network was unavailable, API calls could receive the offline HTML fallback page instead of reaching the server.

## Fix Applied

In `public/sw.js`, all `/api/*` requests bypass the service worker entirely. The fetch event handler returns early for any URL whose pathname starts with `/api/`.

- `GET /api/*` goes straight to the network
- `POST /api/*` goes straight to the network
- `PUT /api/*` and `DELETE /api/*` go straight to the network

The offline fallback HTML page is only served for document navigations, never for API requests.

## Verifying The Fix

```http
GET https://www.vexnexa.com/api/_debug/pwa
```

If this returns JSON, the service worker is not intercepting API requests.

## Architecture Notes

- The service worker is a custom implementation in `public/sw.js`.
- Service worker registration happens in the app layout.
- The fetch event handler checks `url.pathname.startsWith('/api/')` and returns early.
