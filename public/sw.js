const CACHE_NAME = 'advertorial-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // COMPLETELY skip tracking scripts - let browser handle them naturally
  if (
    url.hostname.includes('googletagmanager.com') ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('facebook.net') ||
    url.hostname.includes('clarity.ms') ||
    url.hostname.includes('config-security.com') || // TripleWhale
    url.hostname.includes('doubleclick.net')
  ) {
    // Do NOT intercept - return immediately
    return;
  }

  // Skip cross-origin requests except Supabase
  if (url.origin !== location.origin && !url.hostname.includes('supabase.co')) {
    return;
  }

  // API calls - Network first, fallback to cache
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/published_pages')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache it
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            // Return offline page or error
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          // Cache the fetched resource
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }


  // All other requests - network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
