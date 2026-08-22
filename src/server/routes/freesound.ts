import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { requireUser } from '../services/auth.js';
import { searchFreesound } from '../services/freesound.js';

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  license: z.enum(['compatible', 'cc0', 'by']).default('compatible'),
  maxDuration: z.coerce.number().int().min(1).max(3_600).optional(),
  page: z.coerce.number().int().min(1).max(50).default(1),
});

export async function freesoundRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/freesound/search', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (!config.FREESOUND_API_KEY) {
      return reply.code(503).send({ error: "La recherche Freesound n'est pas configurée." });
    }
    const input = searchQuerySchema.parse(request.query);
    try {
      const result = await searchFreesound({
        apiKey: config.FREESOUND_API_KEY,
        query: input.q,
        license: input.license,
        maxDuration: input.maxDuration,
        page: input.page,
      });
      return reply.header('Cache-Control', 'private, max-age=300').send(result);
    } catch (error) {
      request.log.warn({ error }, 'Freesound search failed');
      return reply.code(502).send({ error: 'Freesound est temporairement indisponible.' });
    }
  });
}
