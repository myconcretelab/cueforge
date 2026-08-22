import { describe, expect, it, vi } from 'vitest';
import { buildFreesoundSearchUrl, searchFreesound } from '../src/server/services/freesound.js';

describe('Freesound search', () => {
  it('construit une recherche limitée aux licences compatibles', () => {
    const url = buildFreesoundSearchUrl({ query: 'door slam', license: 'compatible', minDuration: 3, maxDuration: 30, page: 2 });
    expect(url.origin).toBe('https://freesound.org');
    expect(url.searchParams.get('query')).toBe('door slam');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('filter')).toContain('Creative Commons 0');
    expect(url.searchParams.get('filter')).toContain('Attribution');
    expect(url.searchParams.get('filter')).toContain('duration:[3 TO 30]');
  });

  it('accepte une durée minimale sans maximum', () => {
    const url = buildFreesoundSearchUrl({ query: 'ambience', license: 'cc0', minDuration: 60, page: 1 });
    expect(url.searchParams.get('filter')).toContain('duration:[60 TO *]');
  });

  it('protège la clé et normalise les résultats utiles', async () => {
    const fetcher = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
      expect(init?.headers).toEqual({ Authorization: 'Token secret-api-key' });
      return new Response(JSON.stringify({
        count: 1,
        results: [{
          id: 42,
          name: 'Thunder.wav',
          username: 'sound-author',
          duration: 3.25,
          license: 'https://creativecommons.org/licenses/by/4.0/',
          url: 'https://freesound.org/people/sound-author/sounds/42/',
          tags: ['thunder', 'storm'],
          previews: { 'preview-hq-mp3': 'https://cdn.freesound.org/previews/42/42.mp3' },
        }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    const result = await searchFreesound({ apiKey: 'secret-api-key', query: 'thunder', license: 'by', page: 1 }, fetcher as typeof fetch);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(result.results).toEqual([expect.objectContaining({
      id: 42,
      previewUrl: 'https://cdn.freesound.org/previews/42/42.mp3',
      license: expect.objectContaining({ code: 'by', attributionRequired: true }),
    })]);
  });

  it('écarte une préécoute située hors de Freesound', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      count: 1,
      results: [{
        id: 7,
        name: 'Invalid.wav',
        username: 'author',
        duration: 1,
        license: 'http://creativecommons.org/publicdomain/zero/1.0/',
        url: 'https://freesound.org/people/author/sounds/7/',
        tags: [],
        previews: { 'preview-hq-mp3': 'https://example.com/audio.mp3' },
      }],
    }), { status: 200 }));
    const result = await searchFreesound({ apiKey: 'key', query: 'invalid', license: 'cc0', page: 1 }, fetcher as typeof fetch);
    expect(result.results).toHaveLength(0);
  });
});
