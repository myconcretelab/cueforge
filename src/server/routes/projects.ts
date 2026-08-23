import { unlink } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { categories, projects, tracks } from '../db/schema.js';
import { requireUser } from '../services/auth.js';
import { sameIds } from '../services/order.js';
import { ownsProject } from '../services/ownership.js';

const idParams = z.object({ id: z.string().uuid() });
const mouseActionSchema = z.enum(['start', 'crossfade', 'fade-in', 'replace', 'stop', 'none']);
const keyActionSchema = z.enum(['stop-all', 'stop-all-immediate', 'none']);

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/projects', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return {
      projects: await db.select().from(projects).where(eq(projects.ownerId, user.id)).orderBy(asc(projects.position), asc(projects.createdAt)),
    };
  });

  app.post('/api/projects', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const input = z.object({ name: z.string().trim().min(1).max(120) }).parse(request.body);
    const ownerProjects = await db.select({ position: projects.position }).from(projects).where(eq(projects.ownerId, user.id));
    const position = Math.max(-1, ...ownerProjects.map((project) => project.position)) + 1;
    const [project] = await db.insert(projects).values({ ownerId: user.id, name: input.name, position }).returning();
    return reply.code(201).send({ project });
  });

  app.patch('/api/projects/reorder', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const input = z.object({ projectIds: z.array(z.string().uuid()).min(1).max(500) }).parse(request.body);
    const ownerProjects = await db.select().from(projects).where(eq(projects.ownerId, user.id));
    if (!sameIds(input.projectIds, ownerProjects.map((project) => project.id))) {
      return reply.code(400).send({ error: 'Ordre des spectacles invalide.' });
    }
    await db.transaction(async (transaction) => {
      for (const [position, projectId] of input.projectIds.entries()) {
        await transaction.update(projects).set({ position, updatedAt: new Date() }).where(eq(projects.id, projectId));
      }
    });
    const reordered = await db.select().from(projects).where(eq(projects.ownerId, user.id)).orderBy(asc(projects.position), asc(projects.createdAt));
    return { projects: reordered };
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

  app.patch('/api/projects/:id/mouse-actions', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = idParams.parse(request.params);
    if (!(await ownsProject(user.id, id))) return reply.code(404).send({ error: 'Projet introuvable.' });
    const input = z.object({
      leftClickAction: mouseActionSchema.optional(),
      rightClickAction: mouseActionSchema.optional(),
      escapeKeyAction: keyActionSchema.optional(),
      backspaceKeyAction: keyActionSchema.optional(),
      spaceKeyAction: keyActionSchema.optional(),
    }).refine((value) => Object.keys(value).length > 0, { message: 'Sélectionnez une action.' }).parse(request.body);
    const [project] = await db.update(projects).set({ ...input, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    return { project };
  });

  app.delete('/api/projects/:id', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = idParams.parse(request.params);
    if (!(await ownsProject(user.id, id))) return reply.code(404).send({ error: 'Projet introuvable.' });
    const projectTracks = await db.select({ storageKey: tracks.storageKey }).from(tracks).where(eq(tracks.projectId, id));
    await db.transaction(async (transaction) => {
      await transaction.delete(projects).where(and(eq(projects.id, id), eq(projects.ownerId, user.id)));
      const remaining = await transaction.select({ id: projects.id }).from(projects)
        .where(eq(projects.ownerId, user.id)).orderBy(asc(projects.position), asc(projects.createdAt));
      for (const [position, project] of remaining.entries()) {
        await transaction.update(projects).set({ position }).where(eq(projects.id, project.id));
      }
    });
    await Promise.all(projectTracks.map((track) => unlink(path.join(config.STORAGE_PATH, track.storageKey)).catch(() => undefined)));
    return reply.code(204).send();
  });

  app.post('/api/projects/:id/categories', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = idParams.parse(request.params);
    if (!(await ownsProject(user.id, id))) return reply.code(404).send({ error: 'Projet introuvable.' });
    const input = z.object({
      name: z.string().trim().min(1).max(80),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#8b5cf6'),
      position: z.number().int().min(0).optional(),
    }).parse(request.body);
    const projectCategories = await db.select({ position: categories.position }).from(categories).where(eq(categories.projectId, id));
    const position = input.position ?? Math.max(-1, ...projectCategories.map((category) => category.position)) + 1;
    const [category] = await db.insert(categories).values({ projectId: id, ...input, position }).returning();
    return reply.code(201).send({ category });
  });

  app.patch('/api/projects/:id/categories/reorder', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = idParams.parse(request.params);
    if (!(await ownsProject(user.id, id))) return reply.code(404).send({ error: 'Projet introuvable.' });
    const input = z.object({ categoryIds: z.array(z.string().uuid()).max(500) }).parse(request.body);
    const projectCategories = await db.select().from(categories).where(eq(categories.projectId, id));
    if (!sameIds(input.categoryIds, projectCategories.map((category) => category.id))) {
      return reply.code(400).send({ error: 'Ordre des catégories invalide.' });
    }
    await db.transaction(async (transaction) => {
      for (const [position, categoryId] of input.categoryIds.entries()) {
        await transaction.update(categories).set({ position }).where(and(eq(categories.id, categoryId), eq(categories.projectId, id)));
      }
    });
    const reordered = await db.select().from(categories).where(eq(categories.projectId, id)).orderBy(asc(categories.position));
    return { categories: reordered };
  });

  app.delete('/api/projects/:id/categories/:categoryId', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id, categoryId } = z.object({ id: z.string().uuid(), categoryId: z.string().uuid() }).parse(request.params);
    if (!(await ownsProject(user.id, id))) return reply.code(404).send({ error: 'Projet introuvable.' });
    const [category] = await db.select({ id: categories.id }).from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.projectId, id))).limit(1);
    if (!category) return reply.code(404).send({ error: 'Catégorie introuvable.' });
    await db.transaction(async (transaction) => {
      await transaction.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.projectId, id)));
      const remaining = await transaction.select({ id: categories.id }).from(categories)
        .where(eq(categories.projectId, id)).orderBy(asc(categories.position));
      for (const [position, item] of remaining.entries()) {
        await transaction.update(categories).set({ position }).where(eq(categories.id, item.id));
      }
    });
    return reply.code(204).send();
  });
}
