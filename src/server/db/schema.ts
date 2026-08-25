import {
  bigint,
  boolean,
  integer,
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  primaryKey,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  platformRole: text('platform_role').notNull().default('user'),
  disabledAt: timestamp('disabled_at', { withTimezone: true }),
  lastSeenRelease: text('last_seen_release'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const plans = pgTable('plans', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  storageQuotaBytes: bigint('storage_quota_bytes', { mode: 'number' }).notNull(),
  monthlyPriceCents: integer('monthly_price_cents'),
  annualPriceCents: integer('annual_price_cents'),
  trialDays: integer('trial_days').notNull().default(14),
  isDefault: boolean('is_default').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  planCode: text('plan_code').notNull().references(() => plans.code),
  accessStatus: text('access_status').notNull().default('trialing'),
  storageQuotaOverrideBytes: bigint('storage_quota_override_bytes', { mode: 'number' }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().default('manual'),
  providerCustomerId: text('provider_customer_id'),
  providerSubscriptionId: text('provider_subscription_id'),
  status: text('status').notNull().default('none'),
  billingInterval: text('billing_interval'),
  currentPeriodStartsAt: timestamp('current_period_starts_at', { withTimezone: true }),
  currentPeriodEndsAt: timestamp('current_period_ends_at', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('subscriptions_account_id_idx').on(table.accountId),
  uniqueIndex('subscriptions_provider_subscription_id_idx').on(table.provider, table.providerSubscriptionId),
]);

export const accountMemberships = pgTable('account_memberships', {
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('owner'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.accountId, table.userId] }),
  index('account_memberships_user_id_idx').on(table.userId),
]);

export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('sessions_user_id_idx').on(table.userId), index('sessions_expires_at_idx').on(table.expiresAt)]);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('password_reset_tokens_user_id_idx').on(table.userId),
  index('password_reset_tokens_expires_at_idx').on(table.expiresAt),
]);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  leftClickAction: text('left_click_action').notNull().default('start'),
  rightClickAction: text('right_click_action').notNull().default('crossfade'),
  escapeKeyAction: text('escape_key_action').notNull().default('stop-all'),
  backspaceKeyAction: text('backspace_key_action').notNull().default('stop-all'),
  spaceKeyAction: text('space_key_action').notNull().default('stop-all-immediate'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('projects_account_id_idx').on(table.accountId)]);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#8b5cf6'),
  position: integer('position').notNull().default(0),
}, (table) => [index('categories_project_id_idx').on(table.projectId)]);

export const projectColors = pgTable('project_colors', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  color: text('color').notNull(),
  position: integer('position').notNull().default(0),
}, (table) => [
  index('project_colors_project_id_idx').on(table.projectId),
  uniqueIndex('project_colors_project_color_idx').on(table.projectId, table.color),
]);

export const playlists = pgTable('playlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#8b5cf6'),
  autostart: boolean('autostart').notNull().default(false),
  loop: boolean('loop').notNull().default(false),
  random: boolean('random').notNull().default(false),
  gapMs: integer('gap_ms').notNull().default(0),
  crossfadeMs: integer('crossfade_ms').notNull().default(0),
  position: real('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('playlists_project_id_idx').on(table.projectId), index('playlists_category_id_idx').on(table.categoryId)]);

export const tracks = pgTable('tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  originalFilename: text('original_filename').notNull(),
  storageKey: text('storage_key').notNull().unique(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  durationMs: integer('duration_ms'),
  startTimeMs: integer('start_time_ms').notNull().default(0),
  endTimeMs: integer('end_time_ms'),
  volume: real('volume').notNull().default(1),
  loop: boolean('loop').notNull().default(false),
  fadeInMs: integer('fade_in_ms').notNull().default(0),
  fadeOutMs: integer('fade_out_ms').notNull().default(400),
  color: text('color'),
  description: text('description'),
  copyrightText: text('copyright_text'),
  sourceUrl: text('source_url'),
  sourceId: text('source_id'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('tracks_project_id_idx').on(table.projectId), index('tracks_category_id_idx').on(table.categoryId)]);

export const playlistItems = pgTable('playlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  playlistId: uuid('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  trackId: uuid('track_id').notNull().references(() => tracks.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
}, (table) => [index('playlist_items_playlist_id_idx').on(table.playlistId), index('playlist_items_track_id_idx').on(table.trackId)]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_actor_user_id_idx').on(table.actorUserId),
  index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  index('audit_logs_created_at_idx').on(table.createdAt),
]);

export type User = typeof users.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectColor = typeof projectColors.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type PlaylistItem = typeof playlistItems.$inferSelect;
