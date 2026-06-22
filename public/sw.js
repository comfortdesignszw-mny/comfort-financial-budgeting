const CACHE_NAME = 'comfort-finance-suite-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/comfort_logo_brand.png',
  '/comfort_brand_192.png',
  '/comfort_brand_512.png',
  '/comfort_brand_maskable.png',
  '/manifest.json'
];

// Install Event: Cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Comfort SW] Pre-caching critical application shell resources...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Comfort SW] Install pre-caching incomplete, some optional assets skipped:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear stale cache storage vaults
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Comfort SW] Removing outdated offline storage cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache dynamic content with Stale-while-Revalidate strategy & Single-Page Application (SPA) navigation fallback
self.addEventListener('fetch', (event) => {
  // We only cache GET requests pointing back to our own site origin or trusted google fonts CDN
  const isGoogleFont = event.request.url.startsWith('https://fonts.googleapis.com') || 
                       event.request.url.startsWith('https://fonts.gstatic.com');

  if (event.request.method !== 'GET' || (!event.request.url.startsWith(self.location.origin) && !isGoogleFont)) {
    return;
  }

  const url = new URL(event.request.url);

  // If navigating pages (navigation request), serve standard index shell as offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Keep a cloned copy of latest navigation file in shell cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          console.log('[Comfort SW] Offline navigation detected. Redirecting client to cached shell index.');
          return caches.match('/index.html', { ignoreSearch: true }) || caches.match('/', { ignoreSearch: true });
        })
    );
    return;
  }

  // General App Assets & Font Caching: Stale-While-Revalidate strategy with ignoreSearch for query robustness
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.log('[Comfort SW] Network failure serving fallback resource:', url.pathname, err);
          return cachedResponse;
        });

      // If we have a cached response, serve it immediately for extreme offline speed; 
      // otherwise, fall back to the dynamic fetch promise, with a safety catch to avoid TypeErrors.
      return cachedResponse || fetchPromise.catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html', { ignoreSearch: true });
        }
        return new Response('Comfort Finance Suite: Offline Resource Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

// Listen to post-install message events to quickly update workers or execute sync operations
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
