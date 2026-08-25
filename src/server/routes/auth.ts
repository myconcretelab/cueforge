import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { accountMemberships, accounts, plans, projects, subscriptions, users } from '../db/schema.js';
import { config } from '../config.js';
import { CURRENT_VERSION } from '../releases.js';
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
        platformRole: config.SUPER_ADMIN_EMAILS.includes(input.email) ? 'super_admin' : 'user',
        lastSeenRelease: CURRENT_VERSION,
      }).returning();
      const [defaultPlan] = await tx.select().from(plans).where(eq(plans.isDefault, true)).limit(1);
      if (!defaultPlan) throw new Error('Aucun forfait par défaut n’est configuré.');
      const trialEndsAt = new Date(Date.now() + defaultPlan.trialDays * 24 * 60 * 60 * 1000);
      const [account] = await tx.insert(accounts).values({
        name: `Espace de ${created.displayName}`,
        planCode: defaultPlan.code,
        accessStatus: 'trialing',
        trialEndsAt,
      }).returning();
      await tx.insert(accountMemberships).values({ accountId: account.id, userId: created.id, role: 'owner' });
      await tx.insert(subscriptions).values({ accountId: account.id });
      await tx.insert(projects).values({ accountId: account.id, name: 'Mon premier spectacle' });
      return created;
    });
    await startSession(user.id, reply);
    return reply.code(201).send({ user: { id: user.id, email: user.email, displayName: user.displayName, platformRole: user.platformRole } });
  });

  app.post('/api/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = credentialsSchema.parse(request.body);
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user || user.disabledAt || !(await verifyPassword(input.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Adresse ou mot de passe incorrect.' });
    }
    await startSession(user.id, reply);
    return { user: { id: user.id, email: user.email, displayName: user.displayName, platformRole: user.platformRole } };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    await endSession(request, reply);
    return reply.code(204).send();
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return { user: { id: user.id, email: user.email, displayName: user.displayName, platformRole: user.platformRole } };
  });
}
