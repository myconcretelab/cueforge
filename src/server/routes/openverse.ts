import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { requireUser } from '../services/auth.js';
import { openverseSources, searchOpenverse } from '../services/openverse.js';

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  license: z.enum(['all', 'cc0', 'by']).default('all'),
  sources: z.string().transform((value, context) => {
    const sources = [...new Set(value.split(',').map((source) => source.trim()).filter(Boolean))];
    const invalid = sources.find((source) => !(openverseSources as readonly string[]).includes(source));
    if (!sources.length || invalid) {
      context.addIssue({ code: 'custom', message: 'Sélection de sources Openverse invalide.' });
      return z.NEVER;
    }
    return sources as Array<typeof openverseSources[number]>;
  }),
  page: z.coerce.number().int().min(1).max(50).default(1),
});

export async function openverseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/openverse/search', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const input = searchQuerySchema.parse(request.query);
    try {
      const result = await searchOpenverse({
        query: input.q,
        license: input.license,
        sources: input.sources,
        page: input.page,
        clientId: config.OPENVERSE_CLIENT_ID,
        clientSecret: config.OPENVERSE_CLIENT_SECRET,
      });
      return reply.header('Cache-Control', 'private, max-age=300').send(result);
    } catch (error) {
      request.log.warn({ error }, 'Openverse search failed');
      return reply.code(502).send({ error: 'Openverse est temporairement indisponible.' });
    }
  });
}
