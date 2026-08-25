import type { FastifyInstance } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { plans } from '../db/schema.js';
import { config } from '../config.js';

export async function publicPlanRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/public/plans', async (_request, reply) => {
    const rows = await db.select({
      code: plans.code,
      name: plans.name,
      description: plans.description,
      storageQuotaBytes: plans.storageQuotaBytes,
      monthlyPriceCents: plans.monthlyPriceCents,
      annualPriceCents: plans.annualPriceCents,
      trialDays: plans.trialDays,
      featured: plans.featuredOnWebsite,
      displayOrder: plans.displayOrder,
    }).from(plans)
      .where(and(eq(plans.visibleOnWebsite, true), eq(plans.active, true)))
      .orderBy(asc(plans.displayOrder), asc(plans.name));

    reply.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
    return {
      currency: 'EUR',
      signupUrl: config.PUBLIC_URL,
      plans: rows,
    };
  });
}
