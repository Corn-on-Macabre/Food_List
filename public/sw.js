const CACHE_NAME = 'bobby-menu-v2';
const PRECACHE_URLS = [
  '/',
  '/restaurants.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never cache Supabase responses — the visits table is private (RLS,
  // admin-only) and its rows must not land in shared Cache Storage.
  if (new URL(event.request.url).hostname.endsWith('.supabase.co')) {
    return; // fall through to the network
  }

  // Network-first for navigation and API calls, cache-first for assets
  if (event.request.mode === 'navigate' || event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
