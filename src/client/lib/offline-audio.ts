export const audioCacheName = 'cueforge-audio-v1';

export function trackStreamUrl(trackId: string): string {
  return `/api/tracks/${trackId}/stream`;
}

export async function cachedTrackIds(trackIds: string[]): Promise<Set<string>> {
  if (!('caches' in globalThis)) return new Set();
  const cache = await caches.open(audioCacheName);
  const matches = await Promise.all(trackIds.map(async (trackId) => [trackId, Boolean(await cache.match(trackStreamUrl(trackId), { ignoreVary: true }))] as const));
  return new Set(matches.flatMap(([trackId, cached]) => cached ? [trackId] : []));
}

export async function cacheTrackOffline(trackId: string): Promise<void> {
  if (!('caches' in globalThis)) throw new Error('Le stockage hors ligne est indisponible dans ce navigateur.');
  const cache = await caches.open(audioCacheName);
  const url = trackStreamUrl(trackId);
  if (await cache.match(url, { ignoreVary: true })) return;
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(`Téléchargement hors ligne impossible (${response.status}).`);
  await cache.put(url, response);
}

export async function fetchTrackAudio(trackId: string): Promise<Response> {
  const url = trackStreamUrl(trackId);
  if ('caches' in globalThis) {
    const cache = await caches.open(audioCacheName);
    const cached = await cache.match(url, { ignoreVary: true });
    if (cached) return cached;
  }
  return fetch(url, { credentials: 'include' });
}

export async function deleteOfflineAudio(): Promise<boolean> {
  return 'caches' in globalThis ? caches.delete(audioCacheName) : false;
}

export async function deleteCachedTracks(trackIds: string[]): Promise<void> {
  if (!('caches' in globalThis) || trackIds.length === 0) return;
  const cache = await caches.open(audioCacheName);
  await Promise.all(trackIds.map((trackId) => cache.delete(trackStreamUrl(trackId), { ignoreVary: true })));
}
