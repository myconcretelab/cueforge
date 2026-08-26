import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accountMemberships, accounts, plans, projects, tracks, users, type Account, type Plan, type Track } from '../db/schema.js';
import { evaluateStorageAllowance } from './account-access.js';
import { demoMaxFileBytes, demoMaxUploads } from './demo.js';

export class AccountStorageError extends Error {
  constructor(public readonly reason: 'read-only' | 'quota-exceeded') {
    super(reason === 'quota-exceeded'
      ? 'Votre quota de stockage est atteint. Supprimez des sons ou choisissez un forfait supérieur.'
      : "Votre espace est en lecture seule. Activez un abonnement pour le modifier.");
  }
}

export class DemoUploadError extends Error {
  constructor(public readonly reason: 'file-too-large' | 'file-count-exceeded') {
    super(reason === 'file-too-large'
      ? 'La démonstration accepte des fichiers de 5 Mo maximum.'
      : 'La démonstration accepte 15 fichiers importés maximum.');
  }
}

export interface AccountContext {
  account: Account;
  plan: Plan;
  storageQuotaBytes: number;
}

export async function accountForUser(userId: string): Promise<AccountContext | null> {
  const [row] = await db.select({ account: accounts, plan: plans })
    .from(accountMemberships)
    .innerJoin(accounts, eq(accountMemberships.accountId, accounts.id))
    .innerJoin(plans, eq(accounts.planCode, plans.code))
    .where(eq(accountMemberships.userId, userId))
    .orderBy(accountMemberships.createdAt)
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    storageQuotaBytes: row.account.storageQuotaOverrideBytes ?? row.plan.storageQuotaBytes,
  };
}

export async function accountUsage(userId: string) {
  const context = await accountForUser(userId);
  if (!context) return null;
  const [usage] = await db.select({
    usedBytes: sql<number>`coalesce(sum(${tracks.sizeBytes}), 0)::bigint`,
  }).from(projects)
    .leftJoin(tracks, eq(tracks.projectId, projects.id))
    .where(eq(projects.accountId, context.account.id));
  return { ...context, usedBytes: Number(usage?.usedBytes ?? 0) };
}

export async function requireWritableAccount(userId: string): Promise<AccountContext> {
  const context = await accountForUser(userId);
  if (!context) throw new Error('Espace de travail introuvable.');
  const allowance = evaluateStorageAllowance({
    accessStatus: context.account.accessStatus,
    trialEndsAt: context.account.trialEndsAt,
    gracePeriodEndsAt: context.account.gracePeriodEndsAt,
    storageQuotaBytes: context.storageQuotaBytes,
    usedBytes: 0,
    incomingBytes: 0,
  });
  if (!allowance.allowed) throw new AccountStorageError('read-only');
  return context;
}

export async function insertTrackWithinQuota(userId: string, values: typeof tracks.$inferInsert): Promise<Track> {
  return db.transaction(async (transaction) => {
    const [membership] = await transaction.select({ account: accounts, plan: plans, projectId: projects.id, isDemo: users.isDemo })
      .from(accountMemberships)
      .innerJoin(users, eq(accountMemberships.userId, users.id))
      .innerJoin(accounts, eq(accountMemberships.accountId, accounts.id))
      .innerJoin(plans, eq(accounts.planCode, plans.code))
      .innerJoin(projects, and(eq(projects.accountId, accounts.id), eq(projects.id, values.projectId)))
      .where(eq(accountMemberships.userId, userId))
      .limit(1);
    if (!membership) throw new Error('Projet introuvable.');

    await transaction.execute(sql`select ${accounts.id} from ${accounts} where ${accounts.id} = ${membership.account.id} for update`);
    const [usage] = await transaction.select({
      usedBytes: sql<number>`coalesce(sum(${tracks.sizeBytes}), 0)::bigint`,
      uploadedFiles: sql<number>`count(*) filter (where ${tracks.demoSeed} = false)::int`,
    }).from(projects)
      .leftJoin(tracks, eq(tracks.projectId, projects.id))
      .where(eq(projects.accountId, membership.account.id));
    if (membership.isDemo && Number(values.sizeBytes) > demoMaxFileBytes) throw new DemoUploadError('file-too-large');
    if (membership.isDemo && Number(usage?.uploadedFiles ?? 0) >= demoMaxUploads) throw new DemoUploadError('file-count-exceeded');
    const allowance = evaluateStorageAllowance({
      accessStatus: membership.account.accessStatus,
      trialEndsAt: membership.account.trialEndsAt,
      gracePeriodEndsAt: membership.account.gracePeriodEndsAt,
      storageQuotaBytes: membership.account.storageQuotaOverrideBytes ?? membership.plan.storageQuotaBytes,
      usedBytes: Number(usage?.usedBytes ?? 0),
      incomingBytes: values.sizeBytes,
    });
    if (!allowance.allowed) throw new AccountStorageError(allowance.reason);
    const [track] = await transaction.insert(tracks).values(values).returning();
    return track;
  });
}
