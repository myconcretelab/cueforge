import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { categories, projects, tracks } from '../db/schema.js';
import { requireUser } from '../services/auth.js';
import { ownsProject } from '../services/ownership.js';
import { parseByteRange } from '../services/range.js';

const acceptedMimeTypes = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/aac',
]);

function extensionFor(filename: string): string {
  const extension = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, '');
  return extension.slice(0, 8) || '.audio';
}

async function ownedTrack(userId: string, trackId: string) {
  const [row] = await db.select({ track: tracks }).from(tracks)
    .innerJoin(projects, eq(tracks.projectId, projects.id))
    .where(and(eq(tracks.id, trackId), eq(projects.ownerId, userId))).limit(1);
  return row?.track;
}

async function categoryBelongsToProject(categoryId: string, projectId: string): Promise<boolean> {
  const [category] = await db.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.projectId, projectId))).limit(1);
  return Boolean(category);
}

export async function trackRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/tracks/upload', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;

    const parts = request.parts();
    const fields: Record<string, string> = {};
    let uploaded: { key: string; originalFilename: string; mimeType: string; size: number } | undefined;
    await mkdir(config.STORAGE_PATH, { recursive: true });

    try {
      for await (const part of parts) {
        if (part.type === 'field') {
          fields[part.fieldname] = String(part.value);
          continue;
        }
        if (part.fieldname !== 'file') {
          part.file.resume();
          continue;
        }
        if (!acceptedMimeTypes.has(part.mimetype)) {
          part.file.resume();
          return reply.code(415).send({ error: 'Format audio non pris en charge.' });
        }
        const key = `${randomUUID()}${extensionFor(part.filename)}`;
        const destination = path.join(config.STORAGE_PATH, key);
        await pipeline(part.file, createWriteStream(destination, { flags: 'wx' }));
        const info = await stat(destination);
        uploaded = { key, originalFilename: part.filename, mimeType: part.mimetype, size: info.size };
      }

      const input = z.object({
        projectId: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        title: z.string().trim().min(1).max(160),
        durationMs: z.coerce.number().int().positive().optional(),
      }).parse(fields);
      if (!uploaded) return reply.code(400).send({ error: 'Fichier audio manquant.' });
      if (!(await ownsProject(user.id, input.projectId))) {
        await unlink(path.join(config.STORAGE_PATH, uploaded.key));
        return reply.code(404).send({ error: 'Projet introuvable.' });
      }
      if (input.categoryId && !(await categoryBelongsToProject(input.categoryId, input.projectId))) {
        await unlink(path.join(config.STORAGE_PATH, uploaded.key));
        return reply.code(400).send({ error: 'Catégorie invalide pour ce projet.' });
      }

      const [track] = await db.insert(tracks).values({
        projectId: input.projectId,
        categoryId: input.categoryId,
        title: input.title,
        durationMs: input.durationMs,
        originalFilename: uploaded.originalFilename,
        storageKey: uploaded.key,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.size,
      }).returning();
      return reply.code(201).send({ track });
    } catch (error) {
      if (uploaded) await unlink(path.join(config.STORAGE_PATH, uploaded.key)).catch(() => undefined);
      throw error;
    }
  });

  app.get('/api/tracks/:id/stream', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const track = await ownedTrack(user.id, id);
    if (!track) return reply.code(404).send({ error: 'Son introuvable.' });
    const filePath = path.join(config.STORAGE_PATH, track.storageKey);
    const info = await stat(filePath);
    const range = request.headers.range;

    reply.header('Accept-Ranges', 'bytes').header('Content-Type', track.mimeType).header('Cache-Control', 'private, max-age=86400');
    if (!range) {
      reply.header('Content-Length', info.size);
      return reply.send(createReadStream(filePath));
    }

    const parsedRange = parseByteRange(range, info.size);
    if (!parsedRange) return reply.code(416).header('Content-Range', `bytes */${info.size}`).send();
    const { start, end } = parsedRange;
    reply.code(206)
      .header('Content-Range', `bytes ${start}-${end}/${info.size}`)
      .header('Content-Length', end - start + 1);
    return reply.send(createReadStream(filePath, { start, end }));
  });

  app.patch('/api/tracks/:id', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const existingTrack = await ownedTrack(user.id, id);
    if (!existingTrack) return reply.code(404).send({ error: 'Son introuvable.' });
    const input = z.object({
      title: z.string().trim().min(1).max(160).optional(),
      categoryId: z.string().uuid().nullable().optional(),
      volume: z.number().min(0).max(2).optional(),
      loop: z.boolean().optional(),
      fadeInMs: z.number().int().min(0).max(60_000).optional(),
      fadeOutMs: z.number().int().min(0).max(60_000).optional(),
    }).parse(request.body);
    if (input.categoryId && !(await categoryBelongsToProject(input.categoryId, existingTrack.projectId))) {
      return reply.code(400).send({ error: 'Catégorie invalide pour ce projet.' });
    }
    const [track] = await db.update(tracks).set(input).where(eq(tracks.id, id)).returning();
    return { track };
  });

  app.delete('/api/tracks/:id', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const track = await ownedTrack(user.id, id);
    if (!track) return reply.code(404).send({ error: 'Son introuvable.' });
    await db.delete(tracks).where(eq(tracks.id, id));
    await unlink(path.join(config.STORAGE_PATH, track.storageKey)).catch(() => undefined);
    return reply.code(204).send();
  });
}
