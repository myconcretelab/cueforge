const AUDIO_CACHE = 's1-audio-v1';
const SHELL_CACHE = 's1-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/^\/api\/tracks\/[^/]+\/stream$/.test(url.pathname)) {
    event.respondWith(caches.open(AUDIO_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreVary: true });
      return cached ?? fetch(event.request);
    }));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
    return;
  }
  if (['style', 'script', 'font', 'image'].includes(event.request.destination)) {
    event.respondWith(caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }));
  }
});
