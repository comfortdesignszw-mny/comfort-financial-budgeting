const CACHE_NAME = 'comfort-budgeting-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/comfort_logo_brand.png',
  '/manifest.json'
];

// Install Event: cache core shell items immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Comfort SW] Pre-caching essential offline assets...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Comfort SW] Pre-caching completed with some missing optional assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Comfort SW] Clearing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: handle offline cache strategies (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local scope origins
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // If successful response, cache it for future offline usage
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.log('[Comfort SW] Network unavailable. Serving offline fallback for:', event.request.url);
          // Return cached response if available
          return cachedResponse;
        });

      // Serve cached asset immediately if available for high-speed offline startup,
      // otherwise fetch from network.
      return cachedResponse || fetchPromise;
    })
  );
});
