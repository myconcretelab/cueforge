import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { and, eq, gt } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { sessions, users, type User } from '../db/schema.js';

const scrypt = promisify(scryptCallback);
export const sessionCookieName = 'cueforge_session';
export const legacySessionCookieName = 'sf_session';
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

function sessionCookieOptions(expires?: Date) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    ...(expires ? { expires } : {}),
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('base64')}.${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltBase64, hashBase64] = stored.split('.');
  if (!saltBase64 || !hashBase64) return false;
  const expected = Buffer.from(hashBase64, 'base64');
  const actual = (await scrypt(password, Buffer.from(saltBase64, 'base64'), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function startSession(userId: string, reply: FastifyReply): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await db.insert(sessions).values({ tokenHash: tokenHash(token), userId, expiresAt });
  reply.setCookie(sessionCookieName, token, sessionCookieOptions(expiresAt));
}

export async function endSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies[sessionCookieName] ?? request.cookies[legacySessionCookieName];
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash(token)));
  reply.clearCookie(sessionCookieName, sessionCookieOptions());
  reply.clearCookie(legacySessionCookieName, sessionCookieOptions());
}

export async function userFromToken(token?: string): Promise<User | null> {
  if (!token) return null;
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row?.user ?? null;
}

export function cookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const pair of cookieHeader.split(';')) {
    const [key, ...value] = pair.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

export async function requireUser(request: FastifyRequest, reply: FastifyReply): Promise<User | null> {
  const currentToken = request.cookies[sessionCookieName];
  const legacyToken = request.cookies[legacySessionCookieName];
  const user = await userFromToken(currentToken ?? legacyToken);
  if (!user) {
    await reply.code(401).send({ error: 'Authentification requise.' });
    return null;
  }
  if (user.disabledAt) {
    await endSession(request, reply);
    await reply.code(403).send({ error: 'Ce compte utilisateur est désactivé.' });
    return null;
  }
  if (!currentToken && legacyToken) {
    reply.setCookie(sessionCookieName, legacyToken, sessionCookieOptions(new Date(Date.now() + sessionLifetimeMs)));
    reply.clearCookie(legacySessionCookieName, sessionCookieOptions());
  }
  return user;
}
