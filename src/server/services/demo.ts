import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, inArray, lte } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { accountMemberships, accounts, categories, plans, projects, subscriptions, tracks, users, type User } from '../db/schema.js';
import { CURRENT_VERSION } from '../releases.js';

export const demoLifetimeMs = 24 * 60 * 60 * 1000;
export const demoMaxUploads = 15;
export const demoMaxFileBytes = 5 * 1024 * 1024;
export const demoStorageQuotaBytes = 80 * 1024 * 1024;

const demoSounds = [
  { title: 'Ouverture', filename: 'ouverture.wav', frequencies: [392, 523.25, 659.25], category: 0, color: '#22d3b6' },
  { title: 'Transition', filename: 'transition.wav', frequencies: [440, 554.37, 659.25], category: 1, color: '#8b5cf6' },
  { title: 'Final', filename: 'final.wav', frequencies: [523.25, 659.25, 783.99], category: 2, color: '#06b6d4' },
] as const;

export function demoExpiration(now = new Date()): Date {
  return new Date(now.getTime() + demoLifetimeMs);
}

export function createDemoTone(frequencies: readonly number[]): Buffer {
  const sampleRate = 22_050;
  const toneDuration = 0.34;
  const gapDuration = 0.08;
  const totalSamples = Math.ceil((toneDuration + gapDuration) * frequencies.length * sampleRate);
  const dataSize = totalSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let sample = 0; sample < totalSamples; sample += 1) {
    const segmentSamples = Math.ceil((toneDuration + gapDuration) * sampleRate);
    const segment = Math.min(frequencies.length - 1, Math.floor(sample / segmentSamples));
    const segmentTime = (sample % segmentSamples) / sampleRate;
    let amplitude = 0;
    if (segmentTime < toneDuration) {
      const attack = Math.min(1, segmentTime / 0.025);
      const release = Math.min(1, (toneDuration - segmentTime) / 0.08);
      amplitude = Math.sin(2 * Math.PI * frequencies[segment]! * segmentTime) * Math.min(attack, release) * 0.28;
    }
    buffer.writeInt16LE(Math.round(amplitude * 32_767), 44 + sample * 2);
  }
  return buffer;
}

export async function createDemoWorkspace(now = new Date()): Promise<User> {
  await mkdir(config.STORAGE_PATH, { recursive: true });
  const seededFiles = demoSounds.map((sound) => ({
    ...sound,
    key: `${randomUUID()}.wav`,
    content: createDemoTone(sound.frequencies),
  }));

  try {
    await Promise.all(seededFiles.map((file) => writeFile(path.join(config.STORAGE_PATH, file.key), file.content, { flag: 'wx' })));
    return await db.transaction(async (transaction) => {
      const [defaultPlan] = await transaction.select().from(plans).where(eq(plans.isDefault, true)).limit(1);
      if (!defaultPlan) throw new Error('Aucun forfait par défaut n’est configuré.');
      const id = randomUUID();
      const [user] = await transaction.insert(users).values({
        id,
        email: `demo-${id}@demo.invalid`,
        displayName: 'Visiteur',
        passwordHash: 'demo-session',
        isDemo: true,
        demoExpiresAt: demoExpiration(now),
        lastSeenRelease: CURRENT_VERSION,
      }).returning();
      const [account] = await transaction.insert(accounts).values({
        name: 'Démo SonoRiva',
        planCode: defaultPlan.code,
        accessStatus: 'active',
        isDemo: true,
        storageQuotaOverrideBytes: demoStorageQuotaBytes,
      }).returning();
      await transaction.insert(accountMemberships).values({ accountId: account.id, userId: user.id, role: 'owner' });
      await transaction.insert(subscriptions).values({ accountId: account.id });
      const [project] = await transaction.insert(projects).values({ accountId: account.id, name: 'Découverte de SonoRiva' }).returning();
      const seededCategories = await transaction.insert(categories).values([
        { projectId: project.id, name: 'Lancements', color: '#22d3b6', position: 0 },
        { projectId: project.id, name: 'Transitions', color: '#8b5cf6', position: 1 },
        { projectId: project.id, name: 'Final', color: '#06b6d4', position: 2 },
      ]).returning();
      await transaction.insert(tracks).values(seededFiles.map((file, index) => ({
        projectId: project.id,
        categoryId: seededCategories[file.category]!.id,
        title: file.title,
        originalFilename: file.filename,
        storageKey: file.key,
        mimeType: 'audio/wav',
        sizeBytes: file.content.length,
        durationMs: Math.round((file.content.length - 44) / 2 / 22_050 * 1000),
        color: file.color,
        position: index,
        demoSeed: true,
      })));
      return user;
    });
  } catch (error) {
    await Promise.all(seededFiles.map((file) => unlink(path.join(config.STORAGE_PATH, file.key)).catch(() => undefined)));
    throw error;
  }
}

export async function removeDemoUsers(userIds: string[]): Promise<number> {
  if (userIds.length === 0) return 0;
  const owned = await db.select({ accountId: accounts.id, storageKey: tracks.storageKey })
    .from(users)
    .innerJoin(accountMemberships, eq(accountMemberships.userId, users.id))
    .innerJoin(accounts, eq(accounts.id, accountMemberships.accountId))
    .leftJoin(projects, eq(projects.accountId, accounts.id))
    .leftJoin(tracks, eq(tracks.projectId, projects.id))
    .where(and(inArray(users.id, userIds), eq(users.isDemo, true)));
  const accountIds = [...new Set(owned.map((row) => row.accountId))];
  const storageKeys = owned.flatMap((row) => row.storageKey ? [row.storageKey] : []);
  await db.transaction(async (transaction) => {
    if (accountIds.length > 0) await transaction.delete(accounts).where(and(inArray(accounts.id, accountIds), eq(accounts.isDemo, true)));
    await transaction.delete(users).where(and(inArray(users.id, userIds), eq(users.isDemo, true)));
  });
  await Promise.all(storageKeys.map((key) => unlink(path.join(config.STORAGE_PATH, key)).catch(() => undefined)));
  return userIds.length;
}

export async function cleanupExpiredDemos(now = new Date()): Promise<number> {
  const expired = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.isDemo, true), lte(users.demoExpiresAt, now)));
  return removeDemoUsers(expired.map((user) => user.id));
}
