import type { FastifyInstance } from 'fastify';
import { accountUsage } from '../services/accounts.js';
import { requireUser } from '../services/auth.js';

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/account', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const result = await accountUsage(user.id);
    if (!result) return reply.code(404).send({ error: 'Espace de travail introuvable.' });
    const { account, usedBytes } = result;
    return {
      account: {
        id: account.id,
        name: account.name,
        planCode: account.planCode,
        subscriptionStatus: account.subscriptionStatus,
        storageQuotaBytes: account.storageQuotaBytes,
        storageUsedBytes: usedBytes,
        trialEndsAt: account.trialEndsAt,
      },
    };
  });
}
