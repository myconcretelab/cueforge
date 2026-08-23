import { afterEach, describe, expect, it, vi } from 'vitest';
import { cachedTrackIds, cacheTrackOffline, deleteCachedTracks, fetchTrackAudio } from '../src/client/lib/offline-audio.js';

describe('cache audio hors ligne', () => {
  const stored = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (url: string) => stored.get(url)?.clone()),
    put: vi.fn(async (url: string, response: Response) => { stored.set(url, response.clone()); }),
    delete: vi.fn(async (url: string) => stored.delete(url)),
  };

  afterEach(() => {
    stored.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('télécharge une seule fois puis sert le morceau depuis le cache', async () => {
    vi.stubGlobal('caches', { open: vi.fn(async () => cache) });
    const fetcher = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);

    await cacheTrackOffline('track-1');
    expect(await cachedTrackIds(['track-1', 'track-2'])).toEqual(new Set(['track-1']));
    expect(new Uint8Array(await (await fetchTrackAudio('track-1')).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetcher).toHaveBeenCalledOnce();

    await deleteCachedTracks(['track-1']);
    expect(await cachedTrackIds(['track-1'])).toEqual(new Set());
  });

  it('utilise le réseau lorsque le morceau n’est pas encore hors ligne', async () => {
    vi.stubGlobal('caches', { open: vi.fn(async () => cache) });
    const fetcher = vi.fn(async () => new Response(new Uint8Array([4]), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);

    expect(new Uint8Array(await (await fetchTrackAudio('track-2')).arrayBuffer())).toEqual(new Uint8Array([4]));
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
