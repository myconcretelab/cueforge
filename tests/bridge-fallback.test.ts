import { afterEach, describe, expect, it, vi } from 'vitest';
import { BridgeClient, BridgeUnavailableError } from '../src/client/lib/bridge-client.js';

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
