import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accountMemberships, accounts, projects, tracks, type Account, type Track } from '../db/schema.js';
import { evaluateStorageAllowance } from './account-access.js';

export class AccountStorageError extends Error {
  constructor(public readonly reason: 'read-only' | 'quota-exceeded') {
    super(reason === 'quota-exceeded'
      ? 'Votre quota de stockage est atteint. Supprimez des sons ou choisissez un forfait supérieur.'
      : "Votre espace est en lecture seule. Activez un abonnement pour ajouter de nouveaux sons.");
  }
}

export async function accountForUser(userId: string): Promise<Account | null> {
  const [row] = await db.select({ account: accounts })
    .from(accountMemberships)
    .innerJoin(accounts, eq(accountMemberships.accountId, accounts.id))
    .where(eq(accountMemberships.userId, userId))
    .orderBy(accountMemberships.createdAt)
    .limit(1);
  return row?.account ?? null;
}

export async function accountUsage(userId: string) {
  const account = await accountForUser(userId);
  if (!account) return null;
  const [usage] = await db.select({
    usedBytes: sql<number>`coalesce(sum(${tracks.sizeBytes}), 0)::bigint`,
  }).from(projects)
    .leftJoin(tracks, eq(tracks.projectId, projects.id))
    .where(eq(projects.accountId, account.id));
  return { account, usedBytes: Number(usage?.usedBytes ?? 0) };
}

export async function insertTrackWithinQuota(userId: string, values: typeof tracks.$inferInsert): Promise<Track> {
  return db.transaction(async (transaction) => {
    const [membership] = await transaction.select({ account: accounts, projectId: projects.id })
      .from(accountMemberships)
      .innerJoin(accounts, eq(accountMemberships.accountId, accounts.id))
      .innerJoin(projects, and(eq(projects.accountId, accounts.id), eq(projects.id, values.projectId)))
      .where(eq(accountMemberships.userId, userId))
      .limit(1);
    if (!membership) throw new Error('Projet introuvable.');

    await transaction.execute(sql`select ${accounts.id} from ${accounts} where ${accounts.id} = ${membership.account.id} for update`);
    const [usage] = await transaction.select({
      usedBytes: sql<number>`coalesce(sum(${tracks.sizeBytes}), 0)::bigint`,
    }).from(projects)
      .leftJoin(tracks, eq(tracks.projectId, projects.id))
      .where(eq(projects.accountId, membership.account.id));
    const allowance = evaluateStorageAllowance({
      subscriptionStatus: membership.account.subscriptionStatus,
      trialEndsAt: membership.account.trialEndsAt,
      storageQuotaBytes: membership.account.storageQuotaBytes,
      usedBytes: Number(usage?.usedBytes ?? 0),
      incomingBytes: values.sizeBytes,
    });
    if (!allowance.allowed) throw new AccountStorageError(allowance.reason);
    const [track] = await transaction.insert(tracks).values(values).returning();
    return track;
  });
}
