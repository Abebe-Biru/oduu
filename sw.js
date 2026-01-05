const CACHE_NAME = 'oduu-v1';
const DYNAMIC_CACHE = 'oduu-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/notiflix/dist/notiflix-3.2.6.min.css',
  'https://cdn.jsdelivr.net/npm/notiflix/dist/notiflix-3.2.6.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap'
];

// 1. Install Event (Cache Static Assets)
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching Shell Assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 2. Activate Event (Cleanup Old Caches)
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      );
    })
  );
});

// 3. Fetch Event (The Offline Logic)
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);

  // Strategy A: API Calls (Network First, then Fallback to Cache)
  if (url.pathname.includes('/articles')) {
    evt.respondWith(
      fetch(evt.request)
        .then((fetchRes) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(evt.request.url, fetchRes.clone()); // Update cache with new news
            return fetchRes;
          });
        })
        .catch(() => {
          // If offline, return cached news
          return caches.match(evt.request);
        })
    );
  }
  // Strategy B: Static Assets (Cache First, then Network)
  else {
    evt.respondWith(
      caches.match(evt.request).then((cacheRes) => {
        return cacheRes || fetch(evt.request).then(fetchRes => {
            return caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(evt.request.url, fetchRes.clone());
                return fetchRes;
            })
        });
      })
    );
  }
});