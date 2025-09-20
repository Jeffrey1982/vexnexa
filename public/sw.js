const CACHE_NAME = 'tutusporta-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/teams',
  '/manifest.json',
  // Add more critical routes and assets
];

const API_CACHE_URLS = [
  '/api/auth',
  '/api/user',
  // Add more API endpoints that can be cached
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('💾 Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Caching critical resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('💾 Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('💾 Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('🔄 Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // Use network-first strategy for HTML pages
    event.respondWith(networkFirstStrategy(request));
  } else if (url.pathname.startsWith('/api/')) {
    // Handle API requests
    if (request.method === 'GET' && API_CACHE_URLS.some(pattern => url.pathname.includes(pattern))) {
      // Cache-first for specific GET API requests
      event.respondWith(cacheFirstStrategy(request));
    } else {
      // Network-only for other API requests (POST, PUT, DELETE)
      event.respondWith(networkOnlyStrategy(request));
    }
  } else {
    // Use cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Network-first strategy: try network, fallback to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline page if nothing else works
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>TutuSporta - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f8fafc;
          color: #334155;
        }
        .container {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 { color: #3B82F6; margin-bottom: 0.5rem; }
        p { margin-bottom: 2rem; color: #64748b; }
        .retry-btn {
          background: #3B82F6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
        }
        .retry-btn:hover { background: #2563EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>TutuSporta is not available right now. Please check your internet connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' },
      status: 200
    }
  );
}

// Cache-first strategy: try cache, fallback to network
async function cacheFirstStrategy(request) {
  // Only cache GET requests - Cache API doesn't support other methods
  if (request.method !== 'GET') {
    return networkOnlyStrategy(request);
  }

  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background for GET requests only
    fetch(request).then(response => {
      if (response.ok && request.method === 'GET') {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // Ignore background update errors
    });

    return cachedResponse;
  }

  // Fallback to network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed for:', request.url);
    throw error;
  }
}

// Network-only strategy: always use network
async function networkOnlyStrategy(request) {
  return fetch(request);
}

// Handle background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'scan-retry') {
    event.waitUntil(retryFailedScans());
  }
});

// Retry failed scan requests
async function retryFailedScans() {
  try {
    // Get failed requests from IndexedDB or localStorage
    // Retry them when back online
    console.log('🔄 Retrying failed scans...');
  } catch (error) {
    console.error('❌ Failed to retry scans:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);

  const options = {
    body: event.data ? event.data.text() : 'New accessibility scan completed!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'view',
        title: 'View Report',
        icon: '/icon-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TutuSporta', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  }
});