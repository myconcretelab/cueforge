import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { accountMemberships, accounts, plans, projects, subscriptions, users } from '../db/schema.js';
import { config } from '../config.js';
import { CURRENT_VERSION } from '../releases.js';
import { endSession, hashPassword, requireUser, startSession, verifyPassword } from '../services/auth.js';
import { sendPasswordResetEmail } from '../services/mail.js';
import { issuePasswordResetToken, resetPassword, revokePasswordResetToken } from '../services/password-reset.js';

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

const registerSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(80),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(128),
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

  app.post('/api/auth/password/forgot', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const input = forgotPasswordSchema.parse(request.body);
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      disabledAt: users.disabledAt,
    }).from(users).where(eq(users.email, input.email)).limit(1);

    if (user && !user.disabledAt) {
      const reset = await issuePasswordResetToken(user.id);
      try {
        await sendPasswordResetEmail({ email: user.email, displayName: user.displayName, token: reset.token });
      } catch (error) {
        await revokePasswordResetToken(reset.token);
        request.log.error({ err: error, userId: user.id }, 'Échec de l’envoi du lien de réinitialisation');
      }
    }

    return reply.code(202).send({
      message: 'Si cette adresse correspond à un compte actif, un lien de réinitialisation vient d’être envoyé.',
    });
  });

  app.post('/api/auth/password/reset', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const input = resetPasswordSchema.parse(request.body);
    const changed = await resetPassword(input.token, input.password);
    if (!changed) return reply.code(400).send({ error: 'Ce lien de réinitialisation est invalide ou a expiré.' });
    return reply.code(204).send();
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
