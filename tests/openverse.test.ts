import { describe, expect, it, vi } from 'vitest';
import { buildOpenverseSearchUrl, isAllowedOpenverseAudioUrl, searchOpenverse } from '../src/server/services/openverse.js';

describe('recherche Openverse', () => {
  it('transmet plusieurs sources et la licence à l’API', () => {
    const url = buildOpenverseSearchUrl({ query: 'door slam', license: 'cc0', sources: ['freesound', 'wikimedia_audio'], page: 2 });
    expect(url.origin).toBe('https://api.openverse.org');
    expect(url.pathname).toBe('/v1/audio/');
    expect(url.searchParams.get('source')).toBe('freesound,wikimedia_audio');
    expect(url.searchParams.get('license')).toBe('cc0');
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('normalise un résultat et sa source', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result_count: 1,
      page_count: 1,
      results: [{
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Rain.wav',
        creator: 'Auteur',
        duration: 1_250,
        url: 'https://upload.wikimedia.org/wikipedia/commons/a/audio.ogg',
        foreign_landing_url: 'https://commons.wikimedia.org/wiki/File:audio.ogg',
        license: 'by',
        license_version: '4.0',
        license_url: 'https://creativecommons.org/licenses/by/4.0/',
        source: 'wikimedia_audio',
        tags: [{ name: 'rain' }],
      }],
    }), { status: 200 }));
    const result = await searchOpenverse({ query: 'rain', license: 'all', sources: ['wikimedia_audio'], page: 1 }, fetcher as typeof fetch);
    expect(result.results[0]).toMatchObject({
      source: 'wikimedia_audio',
      sourceLabel: 'Wikimedia',
      durationSeconds: 1.25,
      tags: ['rain'],
      license: { label: 'CC BY 4.0', attributionRequired: true },
    });
  });

  it('n’autorise que les hôtes audio des sources Openverse prises en charge', () => {
    expect(isAllowedOpenverseAudioUrl('https://cdn.freesound.org/previews/1/one.mp3')).toBe(true);
    expect(isAllowedOpenverseAudioUrl('https://prod-1.storage.jamendo.com/?trackid=1&format=mp32')).toBe(true);
    expect(isAllowedOpenverseAudioUrl('https://upload.wikimedia.org/wikipedia/commons/a/audio.ogg')).toBe(true);
    expect(isAllowedOpenverseAudioUrl('https://example.com/audio.mp3')).toBe(false);
    expect(isAllowedOpenverseAudioUrl('http://cdn.freesound.org/audio.mp3')).toBe(false);
  });
});
