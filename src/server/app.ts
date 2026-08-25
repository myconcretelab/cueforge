import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { trackRoutes } from './routes/tracks.js';
import { importRoutes } from './routes/imports.js';
import { freesoundRoutes } from './routes/freesound.js';
import { accountRoutes } from './routes/account.js';
import { releaseRoutes } from './routes/releases.js';
import { CURRENT_VERSION } from './releases.js';
import { AccountStorageError } from './services/accounts.js';

export async function buildApp() {
  const app = Fastify({ logger: true, trustProxy: true });
  await app.register(cookie, { secret: config.SESSION_SECRET });
  await app.register(cors, {
    origin: config.isProduction ? config.PUBLIC_ORIGINS : true,
    credentials: true,
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  await app.register(multipart, {
    limits: { fileSize: 250 * 1024 * 1024, files: 1, fields: 20 },
  });

  app.get('/api/health', async () => ({ status: 'ok', version: CURRENT_VERSION }));
  await app.register(authRoutes);
  await app.register(accountRoutes);
  await app.register(releaseRoutes);
  await app.register(projectRoutes);
  await app.register(trackRoutes);
  await app.register(importRoutes);
  await app.register(freesoundRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Données invalides.', details: error.issues });
    }
    if ((error as { code?: string }).code === '23505') {
      return reply.code(409).send({ error: 'Cette valeur existe déjà.' });
    }
    if (error instanceof AccountStorageError) {
      return reply.code(error.reason === 'quota-exceeded' ? 413 : 403).send({ error: error.message, reason: error.reason });
    }
    app.log.error(error);
    return reply.code(500).send({ error: 'Une erreur interne est survenue.' });
  });

  if (config.isProduction) {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const clientRoot = path.resolve(currentDir, '../client');
    await app.register(fastifyStatic, { root: clientRoot });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) return reply.code(404).send({ error: 'Route introuvable.' });
      return reply.sendFile('index.html');
    });
  }

  return app;
}
