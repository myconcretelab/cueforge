import { describe, expect, it, vi } from 'vitest';
import { consumeBridgePairingStatus } from '../src/server/services/bridge-pairing.js';

describe('CueForge Bridge pairing consumption', () => {
  const now = new Date('2030-01-01T12:00:00Z');
  const claimed = {
    expiresAt: new Date('2030-01-01T12:05:00Z'),
    claimedAt: new Date('2030-01-01T12:00:10Z'),
    consumedAt: null,
    claimedDeviceId: '11111111-1111-4111-8111-111111111111',
  };

  it('renvoie la clé locale avant de l’effacer du ticket', async () => {
    const events: string[] = [];
    const status = await consumeBridgePairingStatus({
      load: async () => claimed,
      consume: async () => {
        events.push('consumed');
        return { deviceId: claimed.claimedDeviceId, localToken: 'local-secret' };
      },
      clearLocalToken: async () => { events.push('cleared'); },
    }, now);

    expect(status).toEqual({ status: 'paired', deviceId: claimed.claimedDeviceId, localToken: 'local-secret' });
    expect(events).toEqual(['consumed', 'cleared']);
  });

  it('ne renvoie jamais une seconde fois une association consommée', async () => {
    const consume = vi.fn();
    const clearLocalToken = vi.fn();
    const status = await consumeBridgePairingStatus({
      load: async () => ({ ...claimed, consumedAt: new Date('2030-01-01T12:00:20Z') }),
      consume,
      clearLocalToken,
    }, now);

    expect(status).toEqual({ status: 'consumed', deviceId: claimed.claimedDeviceId });
    expect(consume).not.toHaveBeenCalled();
    expect(clearLocalToken).not.toHaveBeenCalled();
  });

  it('laisse un ticket non réclamé en attente', async () => {
    const status = await consumeBridgePairingStatus({
      load: async () => ({ ...claimed, claimedAt: null, claimedDeviceId: null }),
      consume: vi.fn(),
      clearLocalToken: vi.fn(),
    }, now);

    expect(status).toEqual({ status: 'pending' });
  });
});
