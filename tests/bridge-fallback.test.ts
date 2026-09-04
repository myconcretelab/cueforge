import { afterEach, describe, expect, it, vi } from 'vitest';
import { BridgeClient, BridgeUnavailableError, remotePreviewBridgeId } from '../src/client/lib/bridge-client.js';

describe('bascule du Bridge vers Web Audio', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('identifie un Bridge local arrêté et conserve son association', async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const client = new BridgeClient();
    client.saveAssociation('bridge-local', 'token-local');
    client.setMode('bridge');

    await expect(client.discover()).rejects.toBeInstanceOf(BridgeUnavailableError);
    expect(client.fallbackToBrowser()).toBe(true);
    expect(client.getMode()).toBe('browser');
    expect(client.isAssociated()).toBe(true);
  });
});

describe('compatibilité des préécoutes Openverse', () => {
  const uuid = 'baf7990c-657a-47ab-83c0-4ec2437095c3';

  it('convertit l’UUID en identifiant numérique accepté par les Bridges distribués', () => {
    expect(remotePreviewBridgeId(uuid)).toBe(Number.parseInt('baf7990c657a4', 16));
  });
});
