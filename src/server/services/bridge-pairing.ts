export interface BridgePairingRecord {
  expiresAt: Date;
  claimedAt: Date | null;
  consumedAt: Date | null;
  claimedDeviceId: string | null;
}

export type BridgePairingStatus =
  | { status: 'expired' }
  | { status: 'pending' }
  | { status: 'consumed'; deviceId: string }
  | { status: 'paired'; deviceId: string; localToken: string };

interface BridgePairingConsumption {
  load: () => Promise<BridgePairingRecord | undefined>;
  consume: () => Promise<{ deviceId: string | null; localToken: string | null } | undefined>;
  clearLocalToken: () => Promise<void>;
}

export async function consumeBridgePairingStatus(
  storage: BridgePairingConsumption,
  now = new Date(),
): Promise<BridgePairingStatus> {
  const pairing = await storage.load();
  if (!pairing || pairing.expiresAt <= now) return { status: 'expired' };
  if (!pairing.claimedAt || !pairing.claimedDeviceId) return { status: 'pending' };
  if (pairing.consumedAt) return { status: 'consumed', deviceId: pairing.claimedDeviceId };

  const consumed = await storage.consume();
  if (!consumed?.localToken || !consumed.deviceId) {
    return { status: 'consumed', deviceId: pairing.claimedDeviceId };
  }

  const response = {
    status: 'paired' as const,
    deviceId: consumed.deviceId,
    localToken: consumed.localToken,
  };
  await storage.clearLocalToken();
  return response;
}
