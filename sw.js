const CACHE_NAME = 'oduu-static-v8'; // <--- Bumped to v8
const DYNAMIC_CACHE = 'oduu-dynamic-v8';

// 1. Local Assets
const LOCAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// 2. External Assets (Added Tippy & Popper)
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/notiflix/dist/notiflix-3.2.6.min.css',
  'https://cdn.jsdelivr.net/npm/notiflix/dist/notiflix-3.2.6.min.js',
  'https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/css/shepherd.css',
  'https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/js/shepherd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap',
  // NEW TOOLTIP LIBS
  'https://unpkg.com/@popperjs/core@2',
  'https://unpkg.com/tippy.js@6',
  'https://unpkg.com/tippy.js@6/animations/scale.css'
];

// INSTALL
self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(LOCAL_ASSETS);
      const externalPromises = EXTERNAL_ASSETS.map(async (url) => {
        try {
          const req = new Request(url, { mode: 'no-cors' });
          const response = await fetch(req);
          return cache.put(req, response);
        } catch (err) { }
      });
      return Promise.all(externalPromises);
    })
  );
});

// ACTIVATE
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

// FETCH
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);
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
  } else {
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

// PUSH
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'https://cdn-icons-png.flaticon.com/512/2537/2537926.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2537/2537926.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        if (event.notification.data.url) client.navigate(event.notification.data.url);
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});