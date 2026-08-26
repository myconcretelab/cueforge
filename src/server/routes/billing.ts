import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  BillingError,
  constructStripeEvent,
  createCheckoutSession,
  createCustomerPortalSession,
  processStripeEvent,
  reconcileStripeAccount,
  synchronizeStripePlan,
} from '../services/billing.js';
import { requireSuperAdmin, writeAuditLog } from '../services/admin.js';
import { requireUser } from '../services/auth.js';

const checkoutSchema = z.object({
  planCode: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{1,39}$/),
  billingInterval: z.enum(['month', 'year']),
  requestId: z.string().uuid(),
});

function stripeSignature(value: string | string[] | undefined): string {
  if (typeof value === 'string' && value) return value;
  throw new BillingError('Signature Stripe manquante.', 400, 'stripe_signature_missing');
}

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/billing/checkout', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const input = checkoutSchema.parse(request.body);
    const url = await createCheckoutSession({ userId: user.id, ...input });
    return { url };
  });

  app.post('/api/billing/portal', { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return { url: await createCustomerPortalSession(user.id) };
  });

  app.post('/api/billing/webhook', {
    config: { rawBody: true, rateLimit: false },
    bodyLimit: 2 * 1024 * 1024,
  }, async (request, reply) => {
    if (!Buffer.isBuffer(request.rawBody)) {
      throw new BillingError('Corps brut du webhook Stripe indisponible.', 400, 'stripe_raw_body_missing');
    }
    let event;
    try {
      event = constructStripeEvent(request.rawBody, stripeSignature(request.headers['stripe-signature']));
    } catch (error) {
      request.log.warn({ err: error }, 'Webhook Stripe rejeté');
      throw new BillingError('Signature du webhook Stripe invalide.', 400, 'stripe_signature_invalid');
    }
    const result = await processStripeEvent(event);
    return reply.code(200).send({ received: true, duplicate: result.duplicate });
  });

  app.post('/api/admin/plans/:code/stripe-sync', async (request, reply) => {
    const admin = await requireSuperAdmin(request, reply);
    if (!admin) return;
    const { code } = z.object({ code: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{1,39}$/) }).parse(request.params);
    const result = await synchronizeStripePlan(code);
    await writeAuditLog({
      actorUserId: admin.id,
      action: 'billing.plan_synchronized',
      entityType: 'plan',
      entityId: code,
      details: result,
      ipAddress: request.ip,
    });
    return { billing: result };
  });

  app.post('/api/admin/accounts/:id/stripe-reconcile', async (request, reply) => {
    const admin = await requireSuperAdmin(request, reply);
    if (!admin) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    await reconcileStripeAccount(id);
    await writeAuditLog({
      actorUserId: admin.id,
      action: 'billing.account_reconciled',
      entityType: 'account',
      entityId: id,
      ipAddress: request.ip,
    });
    return reply.code(204).send();
  });
}
