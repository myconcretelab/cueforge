const AUDIO_CACHE = 'sonoriva-audio-v1';
const BUILD_REVISION = '__SONORIVA_BUILD_REVISION__';
const SHELL_CACHE = `sonoriva-shell-${BUILD_REVISION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll([
    '/',
    '/manifest.webmanifest',
    '/icon.png',
    '/icon.svg',
    '/sonoriva-logo.svg',
  ])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => (
      key.startsWith('sonoriva-shell-') && key !== SHELL_CACHE
    )).map((key) => caches.delete(key)))),
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
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
