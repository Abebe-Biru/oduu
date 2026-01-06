const CACHE_NAME = 'oduu-static-v5';
const DYNAMIC_CACHE = 'oduu-dynamic-v5';

// 1. Local Assets (MUST be cached perfectly)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// 2. External Assets (CDN links that might have CORS issues)
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/notiflix/dist/notiflix-3.2.6.min.css',
  'https://cdn.jsdelivr.net/npm/notiflix/dist/notiflix-3.2.6.min.js',
  'https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/css/shepherd.css',
  'https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/js/shepherd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap'
];

// INSTALL: Split caching strategy
self.addEventListener('install', (evt) => {
  console.log('[SW] Installing...');
  self.skipWaiting();

  evt.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      
      // A. Cache Local Files (Standard)
      console.log('[SW] Caching Local Files...');
      await cache.addAll(LOCAL_ASSETS);

      // B. Cache External Files (With 'no-cors' to fix your error)
      console.log('[SW] Caching External CDNs...');
      const externalPromises = EXTERNAL_ASSETS.map(async (url) => {
        try {
          // We use { mode: 'no-cors' } to allow caching "opaque" responses from CDNs
          const req = new Request(url, { mode: 'no-cors' });
          const response = await fetch(req);
          return cache.put(req, response);
        } catch (err) {
          console.warn('[SW] Failed to cache external asset:', url, err);
          // We don't throw here, so one failed CDN doesn't break the whole app
        }
      });

      return Promise.all(externalPromises);
    })
  );
});

// ACTIVATE: Clean old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// FETCH: Serve from Cache -> Fallback to Network
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);

  // 1. API Calls (Network First)
  if (url.pathname.includes('/articles')) {
    evt.respondWith(
      fetch(evt.request)
        .then((fetchRes) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(evt.request.url, fetchRes.clone());
            return fetchRes;
          });
        })
        .catch(() => caches.match(evt.request))
    );
  }
  
  // 2. Static Assets (Cache First)
  else {
    evt.respondWith(
      caches.match(evt.request).then((cacheRes) => {
        return cacheRes || fetch(evt.request).then((fetchRes) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(evt.request.url, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
  }
});