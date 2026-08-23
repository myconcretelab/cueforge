import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/client/lib/api.js';

describe('client API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('n’envoie pas de type JSON pour une suppression sans corps', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);

    await api.deleteProject('11111111-1111-4111-8111-111111111111');

    expect(fetcher).toHaveBeenCalledWith('/api/projects/11111111-1111-4111-8111-111111111111', expect.objectContaining({
      method: 'DELETE',
      headers: undefined,
    }));
  });

  it('conserve le type JSON lorsqu’un corps est envoyé', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ project: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);

    await api.createProject('Test');

    expect(fetcher).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
  });

  it('enregistre une couleur dans la palette du spectacle', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ projectColor: { color: '#f97316' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);

    await api.createProjectColor('11111111-1111-4111-8111-111111111111', '#f97316');

    expect(fetcher).toHaveBeenCalledWith('/api/projects/11111111-1111-4111-8111-111111111111/colors', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ color: '#f97316' }),
    }));
  });

  it('crée puis met à jour une playlist avec ses options', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ playlist: { id: 'playlist-id' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);
    const projectId = '11111111-1111-4111-8111-111111111111';
    const input = { name: 'Entrée public', color: '#8b5cf6', autostart: true, loop: false, random: true, gapMs: 0, crossfadeMs: 1_500, trackIds: ['22222222-2222-4222-8222-222222222222'] };

    await api.savePlaylist(projectId, undefined, input);
    await api.savePlaylist(projectId, '33333333-3333-4333-8333-333333333333', input);

    expect(fetcher).toHaveBeenNthCalledWith(1, `/api/projects/${projectId}/playlists`, expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }));
    expect(fetcher).toHaveBeenNthCalledWith(2, `/api/projects/${projectId}/playlists/33333333-3333-4333-8333-333333333333`, expect.objectContaining({ method: 'PATCH', body: JSON.stringify(input) }));
  });

  it('enregistre le nouvel ordre des cartes playlist', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ playlist: { id: '33333333-3333-4333-8333-333333333333', position: 2.5 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);
    const projectId = '11111111-1111-4111-8111-111111111111';
    const playlistId = '33333333-3333-4333-8333-333333333333';

    await api.positionPlaylist(projectId, playlistId, 2.5);

    expect(fetcher).toHaveBeenCalledWith(`/api/projects/${projectId}/playlists/${playlistId}/position`, expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ position: 2.5 }) }));
  });
});
