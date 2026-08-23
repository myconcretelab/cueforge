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
});
