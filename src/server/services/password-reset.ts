import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { passwordResetTokens, sessions, users } from '../db/schema.js';
import { hashPassword } from './auth.js';

export const passwordResetLifetimeMs = 30 * 60 * 1000;

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createPasswordResetToken(now = new Date()): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(now.getTime() + passwordResetLifetimeMs),
  };
}

export async function issuePasswordResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const reset = createPasswordResetToken();
  await db.transaction(async (tx) => {
    await tx.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
    await tx.insert(passwordResetTokens).values({
      tokenHash: reset.tokenHash,
      userId,
      expiresAt: reset.expiresAt,
    });
  });
  return { token: reset.token, expiresAt: reset.expiresAt };
}

export async function revokePasswordResetToken(token: string): Promise<void> {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, hashPasswordResetToken(token)));
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return db.transaction(async (tx) => {
    const now = new Date();
    const [claimed] = await tx.update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(
        eq(passwordResetTokens.tokenHash, hashPasswordResetToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ))
      .returning({ userId: passwordResetTokens.userId });
    if (!claimed) return false;

    await tx.update(users).set({ passwordHash }).where(eq(users.id, claimed.userId));
    await tx.delete(sessions).where(eq(sessions.userId, claimed.userId));
    await tx.update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.userId, claimed.userId), isNull(passwordResetTokens.usedAt)));
    return true;
  });
}
