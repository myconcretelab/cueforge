const AUDIO_CACHE = 'cueforge-audio-v1';
const SHELL_CACHE = 'cueforge-shell-v2';
const LEGACY_AUDIO_CACHE = 's1-audio-v1';

async function migrateLegacyAudioCache() {
  const cacheNames = await caches.keys();
  if (!cacheNames.includes(LEGACY_AUDIO_CACHE)) return;
  const legacyCache = await caches.open(LEGACY_AUDIO_CACHE);
  const currentCache = await caches.open(AUDIO_CACHE);
  for (const request of await legacyCache.keys()) {
    if (await currentCache.match(request)) continue;
    const response = await legacyCache.match(request);
    if (response) await currentCache.put(request, response);
  }
  await caches.delete(LEGACY_AUDIO_CACHE);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    migrateLegacyAudioCache(),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => (
      (key.startsWith('cueforge-shell-') && key !== SHELL_CACHE) || key.startsWith('s1-shell-')
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
