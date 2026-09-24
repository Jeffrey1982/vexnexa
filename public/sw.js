// Retire the former accessibility SaaS worker. Do not cache studio pages.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('vexnexa-')) await caches.delete(key);
    }
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
