import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { z } from 'zod';
import { config } from './config.js';
import { cookieValue, legacySessionCookieName, sessionCookieName, userFromToken } from './services/auth.js';
import { ownsProject } from './services/ownership.js';

const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('play'), trackId: z.string().uuid(), volumeMultiplier: z.number().min(0).max(1).optional() }),
  z.object({ type: z.literal('stop'), trackId: z.string().uuid() }),
  z.object({ type: z.literal('stop-all') }),
  z.object({ type: z.literal('stop-all-immediate') }),
  z.object({
    type: z.literal('run-action'),
    trackId: z.string().uuid(),
    action: z.enum(['start', 'crossfade', 'fade-in', 'replace', 'stop', 'none']),
    volumeMultiplier: z.number().min(0).max(1).optional(),
  }),
]);

export function registerSocketServer(app: FastifyInstance): Server {
  const io = new Server(app.server, {
    cors: { origin: config.PUBLIC_ORIGINS, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = cookieValue(socket.handshake.headers.cookie, sessionCookieName)
        ?? cookieValue(socket.handshake.headers.cookie, legacySessionCookieName);
      const user = await userFromToken(token);
      if (!user) return next(new Error('unauthorized'));
      socket.data.userId = user.id;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-project', async (payload, acknowledge) => {
      const parsed = z.object({ projectId: z.string().uuid(), role: z.enum(['player', 'controller']) }).safeParse(payload);
      if (!parsed.success || !(await ownsProject(socket.data.userId, parsed.data.projectId))) {
        acknowledge?.({ ok: false });
        return;
      }
      await socket.join(`${parsed.data.projectId}:${parsed.data.role}`);
      acknowledge?.({ ok: true });
    });

    socket.on('remote-command', async (payload) => {
      const parsed = z.object({ projectId: z.string().uuid(), command: commandSchema }).safeParse(payload);
      if (!parsed.success || !(await ownsProject(socket.data.userId, parsed.data.projectId))) return;
      io.to(`${parsed.data.projectId}:player`).emit('remote-command', parsed.data.command);
    });
  });

  return io;
}
