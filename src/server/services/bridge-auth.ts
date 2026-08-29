import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { bridgeDevices, type BridgeDevice } from '../db/schema.js';

export const bridgePairingLifetimeMs = 5 * 60 * 1000;

export function hashBridgeToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createBridgeToken(): string {
  return randomBytes(32).toString('base64url');
}

export function bridgePairingExpiration(now = new Date()): Date {
  return new Date(now.getTime() + bridgePairingLifetimeMs);
}

export function bearerToken(authorization: string | undefined): string | undefined {
  const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(authorization ?? '');
  return match?.[1];
}

export async function requireBridgeDevice(request: FastifyRequest, reply: FastifyReply): Promise<BridgeDevice | null> {
  const token = bearerToken(request.headers.authorization);
  if (!token) {
    await reply.code(401).send({ error: 'Jeton CueForge Bridge requis.' });
    return null;
  }
  const now = new Date();
  const [device] = await db.update(bridgeDevices)
    .set({ lastSeenAt: now, updatedAt: now })
    .where(and(
      eq(bridgeDevices.tokenHash, hashBridgeToken(token)),
      isNull(bridgeDevices.revokedAt),
    ))
    .returning();
  if (!device) {
    await reply.code(401).send({ error: 'Ce bridge n’est pas associé ou a été révoqué.' });
    return null;
  }
  return device;
}
