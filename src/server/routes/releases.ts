import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { APP_RELEASES, compareVersions, CURRENT_RELEASE, CURRENT_VERSION, releaseExists, releasesAfter } from '../releases.js';
import { requireUser } from '../services/auth.js';

const releaseParamsSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export async function releaseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/version', async () => ({
    version: CURRENT_VERSION,
    releasedAt: CURRENT_RELEASE.date,
  }));

  app.get('/api/releases', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const unseen = releasesAfter(user.lastSeenRelease);
    return {
      currentVersion: CURRENT_VERSION,
      releases: APP_RELEASES,
      unseenVersions: unseen.map((release) => release.version),
    };
  });

  app.post('/api/releases/:version/seen', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { version } = releaseParamsSchema.parse(request.params);
    if (!releaseExists(version)) return reply.code(404).send({ error: 'Version introuvable.' });
    if (!user.lastSeenRelease || compareVersions(version, user.lastSeenRelease) > 0) {
      await db.update(users).set({ lastSeenRelease: version }).where(eq(users.id, user.id));
    }
    return reply.code(204).send();
  });
}
