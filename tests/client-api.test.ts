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

  it('transmet le forfait et la périodicité lors de la création du compte', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ user: {}, checkoutUrl: 'https://checkout.stripe.com/test', checkoutRequired: true }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);
    const input = {
      displayName: 'Camille',
      email: 'camille@example.com',
      password: 'mot-de-passe',
      planCode: 'solo',
      billingInterval: 'month' as const,
      requestId: '11111111-1111-4111-8111-111111111111',
    };

    await api.register(input);

    expect(fetcher).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(input),
    }));
  });

  it('active un forfait gratuit sans appeler Checkout', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);

    await api.activateFreePlan('gratuit');

    expect(fetcher).toHaveBeenCalledWith('/api/billing/free-plan', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ planCode: 'gratuit' }),
    }));
  });

  it('crée et interroge une association CueForge Bridge', async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => init?.body
      ? new Response(JSON.stringify({ status: 'pending' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      : new Response(JSON.stringify({ ticket: 'ticket-test', expiresAt: '2030-01-01T00:05:00.000Z' }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);

    await api.createBridgePairing();
    await api.bridgePairingStatus('ticket-test');

    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/bridge/pairings', expect.objectContaining({ method: 'POST' }));
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/bridge/pairings/status', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ ticket: 'ticket-test' }),
    }));
  });

  it('récupère et acquitte les notes de version', async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'POST'
      ? new Response(null, { status: 204 })
      : new Response(JSON.stringify({ currentVersion: '0.2.0', releases: [], unseenVersions: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);

    await api.releases();
    await api.markReleaseSeen('0.2.0');

    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/releases', expect.objectContaining({ credentials: 'include' }));
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/releases/0.2.0/seen', expect.objectContaining({ method: 'POST' }));
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
    const input = { name: 'Entrée public', categoryId: '44444444-4444-4444-8444-444444444444', color: '#8b5cf6', autostart: true, loop: false, random: true, gapMs: 0, crossfadeMs: 1_500, trackIds: ['22222222-2222-4222-8222-222222222222'] };

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

  it('déplace une playlist dans une autre catégorie avec sa position', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ playlist: { id: '33333333-3333-4333-8333-333333333333', position: 4 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);
    const projectId = '11111111-1111-4111-8111-111111111111';
    const playlistId = '33333333-3333-4333-8333-333333333333';
    const categoryId = '44444444-4444-4444-8444-444444444444';

    await api.positionPlaylist(projectId, playlistId, 4, categoryId);

    expect(fetcher).toHaveBeenCalledWith(`/api/projects/${projectId}/playlists/${playlistId}/position`, expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ position: 4, categoryId }) }));
  });

  it('supprime un forfait commercial sans envoyer de corps JSON', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);

    await api.deleteAdminPlan('studio');

    expect(fetcher).toHaveBeenCalledWith('/api/admin/plans/studio', expect.objectContaining({
      method: 'DELETE',
      headers: undefined,
    }));
  });
});
