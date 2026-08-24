import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { accountMemberships, accounts, projects, users } from '../db/schema.js';
import { config } from '../config.js';
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
      const [created] = await tx.insert(users).values({
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      }).returning();
      const trialEndsAt = config.SAAS_MODE ? new Date(Date.now() + config.TRIAL_DAYS * 24 * 60 * 60 * 1000) : null;
      const [account] = await tx.insert(accounts).values({
        name: `Espace de ${created.displayName}`,
        planCode: config.SAAS_MODE ? 'trial' : 'community',
        subscriptionStatus: config.SAAS_MODE ? 'trialing' : 'active',
        storageQuotaBytes: config.SAAS_MODE ? config.TRIAL_STORAGE_BYTES : null,
        trialEndsAt,
      }).returning();
      await tx.insert(accountMemberships).values({ accountId: account.id, userId: created.id, role: 'owner' });
      await tx.insert(projects).values({ accountId: account.id, name: 'Mon premier spectacle' });
      return created;
    });
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
