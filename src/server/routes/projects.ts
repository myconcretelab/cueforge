import type { FastifyInstance } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { categories, projects, tracks } from '../db/schema.js';
import { requireUser } from '../services/auth.js';
import { ownsProject } from '../services/ownership.js';

const idParams = z.object({ id: z.string().uuid() });

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/projects', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return {
      projects: await db.select().from(projects).where(eq(projects.ownerId, user.id)).orderBy(asc(projects.createdAt)),
    };
  });

  app.post('/api/projects', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const input = z.object({ name: z.string().trim().min(1).max(120) }).parse(request.body);
    const [project] = await db.insert(projects).values({ ownerId: user.id, name: input.name }).returning();
    return reply.code(201).send({ project });
  });

  app.get('/api/projects/:id', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = idParams.parse(request.params);
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, id), eq(projects.ownerId, user.id))).limit(1);
    if (!project) return reply.code(404).send({ error: 'Projet introuvable.' });

    const [projectCategories, projectTracks] = await Promise.all([
      db.select().from(categories).where(eq(categories.projectId, id)).orderBy(asc(categories.position)),
      db.select().from(tracks).where(eq(tracks.projectId, id)).orderBy(asc(tracks.position), asc(tracks.createdAt)),
    ]);
    return { project, categories: projectCategories, tracks: projectTracks };
  });

  app.post('/api/projects/:id/categories', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = idParams.parse(request.params);
    if (!(await ownsProject(user.id, id))) return reply.code(404).send({ error: 'Projet introuvable.' });
    const input = z.object({
      name: z.string().trim().min(1).max(80),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#8b5cf6'),
    }).parse(request.body);
    const [category] = await db.insert(categories).values({ projectId: id, ...input }).returning();
    return reply.code(201).send({ category });
  });
}
