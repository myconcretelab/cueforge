import {
  bigint,
  boolean,
  integer,
  index,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('sessions_user_id_idx').on(table.userId), index('sessions_expires_at_idx').on(table.expiresAt)]);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  leftClickAction: text('left_click_action').notNull().default('start'),
  rightClickAction: text('right_click_action').notNull().default('crossfade'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('projects_owner_id_idx').on(table.ownerId)]);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#8b5cf6'),
  position: integer('position').notNull().default(0),
}, (table) => [index('categories_project_id_idx').on(table.projectId)]);

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

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Track = typeof tracks.$inferSelect;
