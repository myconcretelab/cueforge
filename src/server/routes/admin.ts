import type { FastifyInstance } from 'fastify';
import { and, asc, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { accountMemberships, accounts, auditLogs, plans, projects, subscriptions, tracks, users } from '../db/schema.js';
import { requirePlatformAdmin, requireSuperAdmin, writeAuditLog } from '../services/admin.js';
import { planDeletionError, planPublicationError } from '../services/commercial-plans.js';
import { ADMIN_RELEASES, CURRENT_VERSION } from '../releases.js';

const accountStatuses = ['trialing', 'active', 'grace_period', 'read_only', 'suspended'] as const;
const platformRoles = ['user', 'support', 'admin', 'super_admin'] as const;
const planCodeSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{1,39}$/);
const optionalDateSchema = z.union([z.iso.datetime(), z.null()]).transform((value) => value === null ? null : new Date(value));

const planFieldsSchema = z.object({
  code: planCodeSchema,
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(''),
  storageQuotaBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  monthlyPriceCents: z.number().int().nonnegative().nullable().default(null),
  annualPriceCents: z.number().int().nonnegative().nullable().default(null),
  trialDays: z.number().int().min(0).max(365).default(14),
  active: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  visibleOnWebsite: z.boolean().default(false),
  featuredOnWebsite: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
});

const planInputSchema = planFieldsSchema
  .refine((value) => !value.isDefault || value.active, {
    message: 'Le forfait par défaut doit être actif.',
    path: ['active'],
  })
  .refine((value) => !value.featuredOnWebsite || value.visibleOnWebsite, {
    message: 'Un forfait mis en avant doit être visible sur le site.',
    path: ['visibleOnWebsite'],
  });

const planUpdateSchema = planFieldsSchema.omit({ code: true }).partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Aucune modification fournie.',
});

function numberValue(value: unknown): number {
  return Number(value ?? 0);
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/admin/releases', async (request, reply) => {
    const admin = await requirePlatformAdmin(request, reply);
    if (!admin) return;
    return { currentVersion: CURRENT_VERSION, releases: ADMIN_RELEASES };
  });

  app.get('/api/admin/overview', async (request, reply) => {
    const admin = await requirePlatformAdmin(request, reply);
    if (!admin) return;

    const [userCount, accountCounts, storage, recentAudit] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.isDemo, false)),
      db.select({
        total: sql<number>`count(*)::int`,
        trialing: sql<number>`count(*) filter (where ${accounts.accessStatus} = 'trialing')::int`,
        active: sql<number>`count(*) filter (where ${accounts.accessStatus} in ('active', 'grace_period'))::int`,
        restricted: sql<number>`count(*) filter (where ${accounts.accessStatus} in ('read_only', 'suspended'))::int`,
      }).from(accounts).where(eq(accounts.isDemo, false)),
      db.select({ bytes: sql<number>`coalesce(sum(${tracks.sizeBytes}), 0)::bigint` }).from(tracks)
        .innerJoin(projects, eq(tracks.projectId, projects.id))
        .innerJoin(accounts, and(eq(projects.accountId, accounts.id), eq(accounts.isDemo, false))),
      db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        actorEmail: users.email,
      }).from(auditLogs).leftJoin(users, eq(auditLogs.actorUserId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(12),
    ]);

    return {
      overview: {
        users: numberValue(userCount[0]?.count),
        accounts: numberValue(accountCounts[0]?.total),
        trialingAccounts: numberValue(accountCounts[0]?.trialing),
        activeAccounts: numberValue(accountCounts[0]?.active),
        restrictedAccounts: numberValue(accountCounts[0]?.restricted),
        storageUsedBytes: numberValue(storage[0]?.bytes),
      },
      recentAudit,
    };
  });

  app.get('/api/admin/accounts', async (request, reply) => {
    const admin = await requirePlatformAdmin(request, reply);
    if (!admin) return;
    const input = z.object({ search: z.string().trim().max(120).default('') }).parse(request.query);
    const filter = input.search
      ? or(
        ilike(accounts.name, `%${input.search}%`),
        sql`exists (select 1 from ${accountMemberships} am inner join ${users} u on u.id = am.user_id where am.account_id = ${accounts.id} and u.email ilike ${`%${input.search}%`})`,
      )
      : undefined;
    const rows = await db.select({
      id: accounts.id,
      name: accounts.name,
      planCode: accounts.planCode,
      planName: plans.name,
      accessStatus: accounts.accessStatus,
      trialEndsAt: accounts.trialEndsAt,
      storageQuotaOverrideBytes: accounts.storageQuotaOverrideBytes,
      storageQuotaBytes: sql<number>`coalesce(${accounts.storageQuotaOverrideBytes}, ${plans.storageQuotaBytes})`,
      storageUsedBytes: sql<number>`(select coalesce(sum(t.size_bytes), 0)::bigint from ${projects} p left join ${tracks} t on t.project_id = p.id where p.account_id = ${accounts.id})`,
      memberCount: sql<number>`(select count(*)::int from ${accountMemberships} am where am.account_id = ${accounts.id})`,
      projectCount: sql<number>`(select count(*)::int from ${projects} p where p.account_id = ${accounts.id})`,
      subscriptionStatus: subscriptions.status,
      billingInterval: subscriptions.billingInterval,
      updatedAt: accounts.updatedAt,
    }).from(accounts)
      .innerJoin(plans, eq(accounts.planCode, plans.code))
      .leftJoin(subscriptions, eq(subscriptions.accountId, accounts.id))
      .where(and(eq(accounts.isDemo, false), filter))
      .orderBy(desc(accounts.createdAt))
      .limit(200);
    return { accounts: rows.map((row) => ({
      ...row,
      storageQuotaBytes: numberValue(row.storageQuotaBytes),
      storageUsedBytes: numberValue(row.storageUsedBytes),
      memberCount: numberValue(row.memberCount),
      projectCount: numberValue(row.projectCount),
    })) };
  });

  app.get('/api/admin/accounts/:id', async (request, reply) => {
    const admin = await requirePlatformAdmin(request, reply);
    if (!admin) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [account] = await db.select({
      account: accounts,
      plan: plans,
      subscription: subscriptions,
      storageUsedBytes: sql<number>`(select coalesce(sum(t.size_bytes), 0)::bigint from ${projects} p left join ${tracks} t on t.project_id = p.id where p.account_id = ${accounts.id})`,
    }).from(accounts)
      .innerJoin(plans, eq(accounts.planCode, plans.code))
      .leftJoin(subscriptions, eq(subscriptions.accountId, accounts.id))
      .where(and(eq(accounts.id, id), eq(accounts.isDemo, false))).limit(1);
    if (!account) return reply.code(404).send({ error: 'Compte introuvable.' });
    const members = await db.select({
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      platformRole: users.platformRole,
      role: accountMemberships.role,
      createdAt: accountMemberships.createdAt,
    }).from(accountMemberships).innerJoin(users, eq(accountMemberships.userId, users.id))
      .where(eq(accountMemberships.accountId, id)).orderBy(asc(accountMemberships.createdAt));
    return {
      ...account,
      storageUsedBytes: numberValue(account.storageUsedBytes),
      storageQuotaBytes: account.account.storageQuotaOverrideBytes ?? account.plan.storageQuotaBytes,
      members,
    };
  });

  app.patch('/api/admin/accounts/:id', async (request, reply) => {
    const admin = await requireSuperAdmin(request, reply);
    if (!admin) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = z.object({
      name: z.string().trim().min(2).max(120).optional(),
      planCode: planCodeSchema.optional(),
      accessStatus: z.enum(accountStatuses).optional(),
      trialEndsAt: optionalDateSchema.optional(),
      storageQuotaOverrideBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
    }).refine((value) => Object.keys(value).length > 0, { message: 'Aucune modification fournie.' }).parse(request.body);
    if (input.planCode) {
      const [plan] = await db.select({ code: plans.code }).from(plans).where(and(eq(plans.code, input.planCode), eq(plans.active, true))).limit(1);
      if (!plan) return reply.code(400).send({ error: 'Forfait actif introuvable.' });
    }
    const [account] = await db.update(accounts).set({
      ...input,
      suspendedAt: input.accessStatus === 'suspended' ? new Date() : input.accessStatus ? null : undefined,
      updatedAt: new Date(),
    }).where(and(eq(accounts.id, id), eq(accounts.isDemo, false))).returning();
    if (!account) return reply.code(404).send({ error: 'Compte introuvable.' });
    await writeAuditLog({ actorUserId: admin.id, action: 'account.updated', entityType: 'account', entityId: id, details: input, ipAddress: request.ip });
    return { account };
  });

  app.get('/api/admin/users', async (request, reply) => {
    const admin = await requirePlatformAdmin(request, reply);
    if (!admin) return;
    const input = z.object({ search: z.string().trim().max(120).default('') }).parse(request.query);
    const filter = input.search ? or(ilike(users.email, `%${input.search}%`), ilike(users.displayName, `%${input.search}%`)) : undefined;
    const rows = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      platformRole: users.platformRole,
      disabledAt: users.disabledAt,
      createdAt: users.createdAt,
      accountCount: sql<number>`(select count(*)::int from ${accountMemberships} am where am.user_id = ${users.id})`,
    }).from(users).where(and(eq(users.isDemo, false), filter)).orderBy(desc(users.createdAt)).limit(200);
    return { users: rows.map((row) => ({ ...row, accountCount: numberValue(row.accountCount) })) };
  });

  app.patch('/api/admin/users/:id', async (request, reply) => {
    const admin = await requireSuperAdmin(request, reply);
    if (!admin) return;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = z.object({
      platformRole: z.enum(platformRoles).optional(),
      disabled: z.boolean().optional(),
    }).refine((value) => Object.keys(value).length > 0, { message: 'Aucune modification fournie.' }).parse(request.body);
    if (id === admin.id && (input.disabled || (input.platformRole && input.platformRole !== 'super_admin'))) {
      return reply.code(400).send({ error: 'Vous ne pouvez pas retirer votre propre accès super-administrateur.' });
    }
    const [user] = await db.update(users).set({
      platformRole: input.platformRole,
      disabledAt: input.disabled === undefined ? undefined : input.disabled ? new Date() : null,
    }).where(and(eq(users.id, id), eq(users.isDemo, false))).returning();
    if (!user) return reply.code(404).send({ error: 'Utilisateur introuvable.' });
    await writeAuditLog({ actorUserId: admin.id, action: 'user.updated', entityType: 'user', entityId: id, details: input, ipAddress: request.ip });
    return { user: { id: user.id, email: user.email, displayName: user.displayName, platformRole: user.platformRole, disabledAt: user.disabledAt } };
  });

  app.get('/api/admin/plans', async (request, reply) => {
    const admin = await requirePlatformAdmin(request, reply);
    if (!admin) return;
    const rows = await db.select({
      ...getTableColumns(plans),
      accountCount: sql<number>`(select count(*)::int from ${accounts} a where a.plan_code = ${plans.code} and a.is_demo = false)`,
    }).from(plans).orderBy(desc(plans.isDefault), desc(plans.active), asc(plans.name));
    return { plans: rows.map((plan) => ({ ...plan, accountCount: numberValue(plan.accountCount) })) };
  });

  app.post('/api/admin/plans', async (request, reply) => {
    const admin = await requireSuperAdmin(request, reply);
    if (!admin) return;
    const input = planInputSchema.parse(request.body);
    const plan = await db.transaction(async (transaction) => {
      if (input.isDefault) await transaction.update(plans).set({ isDefault: false, updatedAt: new Date() });
      if (input.featuredOnWebsite) await transaction.update(plans).set({ featuredOnWebsite: false, updatedAt: new Date() });
      const [created] = await transaction.insert(plans).values(input).returning();
      return created;
    });
    await writeAuditLog({ actorUserId: admin.id, action: 'plan.created', entityType: 'plan', entityId: plan.code, details: input, ipAddress: request.ip });
    return reply.code(201).send({ plan: { ...plan, accountCount: 0 } });
  });

  app.patch('/api/admin/plans/:code', async (request, reply) => {
    const admin = await requireSuperAdmin(request, reply);
    if (!admin) return;
    const { code } = z.object({ code: planCodeSchema }).parse(request.params);
    const input = planUpdateSchema.parse(request.body);
    const [existing] = await db.select({
      active: plans.active,
      isDefault: plans.isDefault,
      visibleOnWebsite: plans.visibleOnWebsite,
      featuredOnWebsite: plans.featuredOnWebsite,
      accountCount: sql<number>`(select count(*)::int from ${accounts} a where a.plan_code = ${plans.code} and a.is_demo = false)`,
    }).from(plans).where(eq(plans.code, code)).limit(1);
    if (!existing) return reply.code(404).send({ error: 'Forfait introuvable.' });
    const nextActive = input.active ?? existing.active;
    const nextDefault = input.isDefault ?? existing.isDefault;
    if (nextDefault && !nextActive) return reply.code(400).send({ error: 'Le forfait par défaut doit être actif.' });
    if (existing.isDefault && !nextDefault) return reply.code(400).send({ error: 'Choisissez un autre forfait par défaut avant de désactiver celui-ci.' });
    const nextVisible = input.visibleOnWebsite ?? existing.visibleOnWebsite;
    const nextFeatured = input.featuredOnWebsite ?? existing.featuredOnWebsite;
    const publicationError = planPublicationError({ visibleOnWebsite: nextVisible, featuredOnWebsite: nextFeatured });
    if (publicationError) return reply.code(400).send({ error: publicationError });
    const plan = await db.transaction(async (transaction) => {
      if (input.isDefault) await transaction.update(plans).set({ isDefault: false, updatedAt: new Date() });
      if (input.featuredOnWebsite) await transaction.update(plans).set({ featuredOnWebsite: false, updatedAt: new Date() });
      const [updated] = await transaction.update(plans).set({ ...input, updatedAt: new Date() }).where(eq(plans.code, code)).returning();
      return updated;
    });
    await writeAuditLog({ actorUserId: admin.id, action: 'plan.updated', entityType: 'plan', entityId: code, details: input, ipAddress: request.ip });
    return { plan: { ...plan, accountCount: numberValue(existing.accountCount) } };
  });

  app.delete('/api/admin/plans/:code', async (request, reply) => {
    const admin = await requireSuperAdmin(request, reply);
    if (!admin) return;
    const { code } = z.object({ code: planCodeSchema }).parse(request.params);
    const [plan] = await db.select({
      code: plans.code,
      name: plans.name,
      isDefault: plans.isDefault,
      accountCount: sql<number>`(select count(*)::int from ${accounts} a where a.plan_code = ${plans.code} and a.is_demo = false)`,
    }).from(plans).where(eq(plans.code, code)).limit(1);
    if (!plan) return reply.code(404).send({ error: 'Forfait introuvable.' });
    const deletionError = planDeletionError({ isDefault: plan.isDefault, accountCount: numberValue(plan.accountCount) });
    if (deletionError) return reply.code(409).send({ error: deletionError });
    await db.delete(plans).where(eq(plans.code, code));
    await writeAuditLog({
      actorUserId: admin.id,
      action: 'plan.deleted',
      entityType: 'plan',
      entityId: code,
      details: { name: plan.name },
      ipAddress: request.ip,
    });
    return reply.code(204).send();
  });
}
