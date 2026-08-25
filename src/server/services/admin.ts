import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { auditLogs, type User } from '../db/schema.js';
import { requireUser } from './auth.js';

export async function requirePlatformAdmin(request: FastifyRequest, reply: FastifyReply): Promise<User | null> {
  const user = await requireUser(request, reply);
  if (!user) return null;
  if (user.platformRole !== 'admin' && user.platformRole !== 'super_admin') {
    await reply.code(403).send({ error: 'Accès administrateur requis.' });
    return null;
  }
  return user;
}

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply): Promise<User | null> {
  const user = await requirePlatformAdmin(request, reply);
  if (!user) return null;
  if (user.platformRole !== 'super_admin') {
    await reply.code(403).send({ error: 'Accès super-administrateur requis.' });
    return null;
  }
  return user;
}

export async function writeAuditLog(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await db.insert(auditLogs).values({
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details ?? {},
    ipAddress: input.ipAddress,
  });
}
