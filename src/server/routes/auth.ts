import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { projects, users } from '../db/schema.js';
import { endSession, hashPassword, requireUser, startSession, verifyPassword } from '../services/auth.js';

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

const registerSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(80),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const passwordHash = await hashPassword(input.password);
    const user = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(824731905)`);
      const existing = await tx.select({ id: users.id }).from(users).limit(1);
      if (existing.length) return null;
      const [created] = await tx.insert(users).values({
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      }).returning();
      await tx.insert(projects).values({ ownerId: created.id, name: 'Mon premier spectacle' });
      return created;
    });
    if (!user) return reply.code(403).send({ error: 'Le compte administrateur a déjà été créé.' });
    await startSession(user.id, reply);
    return reply.code(201).send({ user: { id: user.id, email: user.email, displayName: user.displayName } });
  });

  app.post('/api/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = credentialsSchema.parse(request.body);
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Adresse ou mot de passe incorrect.' });
    }
    await startSession(user.id, reply);
    return { user: { id: user.id, email: user.email, displayName: user.displayName } };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    await endSession(request, reply);
    return reply.code(204).send();
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return { user: { id: user.id, email: user.email, displayName: user.displayName } };
  });
}
